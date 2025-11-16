
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { networkConfig } from "./index";
import { Seer, Post, Account, Config } from "../types/raw";
import { PostBcs, AccountBcs, SeerBcs, ConfigBcs } from "../types/bcs";
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import {getTableContent} from './graphl';


const graphqlClient = new SuiGraphQLClient({
  url: ` https://graphql.testnet.sui.io/graphql`,
});

const grpcClient = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
});

// export interface Seer {
//   id: {id: string};
//   accounts: string[];
//   posts: Record<string, string[]>;
//   post_fees: number;
// }
export const getTableContentByGraphql = async (address: string): Promise<Record<string, string[]>> => {
  const response = await graphqlClient.query({
    query: getTableContent,
    variables: {
      tableId: address,
    },
  });

  console.log("response", response);
  return response as unknown as Record<string, string[]>;
};

export const getSeer = async (): Promise<Seer> => {
  const { response } = await grpcClient.ledgerService.getObject({
    objectId: networkConfig.testnet.variables.Seer,
    readMask: {
      paths: [
        "contents",
      ],
    },
  });
  const seer = SeerBcs.parse(response.object?.contents?.value as Uint8Array);
  console.log("seer-id", seer.posts.id.id);
  const posts = await getTableContentByGraphql("0xcb3f9b7003f06c5f1a38649ef827c1eba64f22fc965e127781abf72a212d5a82");
  console.log("posts-graphql", posts);
  return seer as unknown as Seer;
};

const getPostsFromSeer = async (parentId: string): Promise<Record<string, string[]>> => {
  const { response } = await grpcClient.stateService.listDynamicFields({
    parent: parentId,
  });
  const dynamicFields = await Promise.all(response.dynamicFields.map(async (field) => {
   const {response: dynamicField} = await grpcClient.ledgerService.getObject({
    objectId: field.fieldId,
    readMask: {
      paths: [
        "json",
        "contents",
      ],
    },
  });
  // console.log("post--------------------", post);
  return dynamicField;
  }));
  return dynamicFields as unknown as Record<string, string[]>;
};

export const getPosts = async (postIds: string[]): Promise<Post[]> => {
  const requests = postIds.map((postId) => ({
    objectId: postId,
  }));
  const { response } = await grpcClient.ledgerService.batchGetObjects({
    requests,
    readMask: {
      paths: [
        "contents",
        "json",
      ],
    },
  });

  const posts = response.objects
    .map((object) => {
      if (object.result.oneofKind === 'object') {
        return PostBcs.parse(object.result.object?.contents?.value as Uint8Array);
      }
      return null;
    })
  return posts as unknown as Post[];
};

export const getAccount = async (accountId: string): Promise<Account> => {
  const { response } = await grpcClient.stateService.listOwnedObjects({
    owner: accountId,
    objectType: `${networkConfig.testnet.variables.Package}::seer::Account`,
    readMask: {
      paths: [
        "contents",
      ],
    },
  });
  const account = AccountBcs.parse(response.objects[0]?.contents?.value as Uint8Array);
  return account as unknown as Account;
};

export const getConfig = async (): Promise<Config> => {
  const { response } = await grpcClient.ledgerService.getObject({
    objectId: networkConfig.testnet.variables.Config,
    readMask: {
      paths: [
        "contents",
      ],
    },
  });
  const config = ConfigBcs.parse(response.object?.contents?.value as Uint8Array);
  console.log("config", config);
  return config as unknown as Config;
};