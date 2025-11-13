import { isValidSuiAddress } from "@mysten/sui/utils";
import { suiClient } from "./index";
import { SuiObjectResponse } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { getObjectInfo, getTableVecContent, getTableContent } from "./graphl";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { networkConfig } from "./index";
import { Seer, Post, Account } from "../types/raw";
import { Transaction } from "@mysten/sui/transactions";


const grpcClient = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
});


export const getUserProfile = async (address: string): Promise<CategorizedObjects> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  let hasNextPage = true;
  let nextCursor: string | null = null;
  let allObjects: SuiObjectResponse[] = [];

  while (hasNextPage) {
    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true,
      },
      cursor: nextCursor,
    });

    allObjects = allObjects.concat(response.data);
    hasNextPage = response.hasNextPage;
    nextCursor = response.nextCursor ?? null;
  }

  return categorizeSuiObjects(allObjects);
};

export const getSeer = async (): Promise<Seer> => {
  const {response} = await grpcClient.ledgerService.getObject({
    objectId: networkConfig.testnet.variables.Seer,
  });
  const fields = await getSeerDynamicFields(networkConfig.testnet.variables.Seer);
  const seer = response.object?.contents?.value as unknown as Seer;
  seer.posts = fields.posts as unknown as Record<string, string[]>;
  return seer;
};

export const getSeerDynamicFields = async (parent: string): Promise<Record<string, string>> => {
  const {response:fields} = await grpcClient.stateService.listDynamicFields({
    parent,
  });

  return fields.dynamicFields as unknown as Record<string, string>;
};

export const getPosts = async (postIds: string[]): Promise<Post[]> => {
  const requests = postIds.map((postId) => ({
    objectId: postId,
  }));
  const {response} = await grpcClient.ledgerService.batchGetObjects({
    requests,
  });

  const posts = response.objects
    .map((object) => {
      if (object.result.oneofKind === 'object') {
        return object.result.object?.contents?.value as unknown as Post;
      }
      return null;
    })
    .filter((post): post is Post => post !== null);

  return posts;
};

export const getAccount = async (accountId: string): Promise<Account> => {
  const {response} = await grpcClient.ledgerService.getObject({
    objectId: accountId,
  });

  return response.object?.contents?.value as unknown as Account;
};



