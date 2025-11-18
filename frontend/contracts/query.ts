
import { networkConfig } from "./index";
import { Seer, Post, Account, Config, PostsTable } from "../types/raw";
import { PostBcs, AccountBcs, SeerBcs, ConfigBcs } from "../types/bcs";
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import {getTableContent} from './graphl';
import { suiGrpcClient } from "./index";

const graphqlClient = new SuiGraphQLClient({
  url: ` https://graphql.testnet.sui.io/graphql`,
});


// export interface Seer {
//   id: {id: string};
//   accounts: string[];
//   posts: Record<string, string[]>;
//   post_fees: number;
// }
export const getTableContentByGraphql = async (address: string): Promise<PostsTable> => {
  let hasNextPage = true;
  let nextCursor: string | null = null;
  const userPosts: PostsTable = {};
  interface TableContentQueryResult {
    data?: {
        address?: {
            dynamicFields?: {
                pageInfo?: {
                    hasNextPage: boolean;
                    endCursor: string;
                };
                nodes?: Array<{
                    name?: {
                        json: string;
                    };
                    value?: {
                        json: string[];
                    };
                }>;
            };
        };
    };
  }
//posts: Table<address, vector<address>>
while (hasNextPage) {
  const response = await graphqlClient.query({
    query: getTableContent,
    variables: {
      address: address,
      after: nextCursor,
    },
  }) as TableContentQueryResult;

  //解析
  if (response.data?.address?.dynamicFields?.nodes) {
    response.data.address.dynamicFields.nodes.forEach((node) => {
      const key = node.name?.json;
      const value = node.value?.json;
      if (key && Array.isArray(value)) {
        userPosts[key as string] = value as string[];
      }
    });
  }
  hasNextPage = response.data?.address?.dynamicFields?.pageInfo?.hasNextPage || false;
  if (hasNextPage) {
    nextCursor = response.data?.address?.dynamicFields?.pageInfo?.endCursor || null;
  }
}
  return userPosts;
};

export const getSeer = async (): Promise<Seer> => {
  const { response } = await suiGrpcClient.ledgerService.getObject({
    objectId: networkConfig.testnet.variables.Seer,
    readMask: {
      paths: [
        "contents",
      ],
    },
  });
  const seerBcs = SeerBcs.parse(response.object?.contents?.value as Uint8Array);
  
  // 将 BCS 解析后的数据转换为 Seer 类型
  const seer: Seer = {
    id: seerBcs.id.id,
    accounts: seerBcs.accounts,
    posts_table_id: seerBcs.posts.id.id,
    post_fees: Number(seerBcs.post_fees.value),
  };
  
  return seer;
};

const getPostsFromSeer = async (parentId: string): Promise<Record<string, string[]>> => {
  const { response } = await suiGrpcClient.stateService.listDynamicFields({
    parent: parentId,
  });
  const dynamicFields = await Promise.all(response.dynamicFields.map(async (field) => {
   const {response: dynamicField} = await suiGrpcClient.ledgerService.getObject({
    objectId: field.fieldId,
    readMask: {
      paths: [
        "json",
        "contents",
      ],
    },
  });
  return dynamicField;
  }));
  return dynamicFields as unknown as Record<string, string[]>;
};

export const getPosts = async (postIds: string[]): Promise<Post[]> => {
  const requests = postIds.map((postId) => ({
    objectId: postId,
  }));
  const { response } = await suiGrpcClient.ledgerService.batchGetObjects({
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

export const getAccount = async (accountId: string): Promise<Account | null> => {
  const { response } = await suiGrpcClient.stateService.listOwnedObjects({
    owner: accountId,
    objectType: `${networkConfig.testnet.variables.Package}::seer::Account`,
    readMask: {
      paths: [
        "contents",
      ],
    },
  });
  const rawAccount = response.objects?.[0]?.contents?.value as Uint8Array | undefined;

  if (!rawAccount) {
    return null;
  }

  const account = AccountBcs.parse(rawAccount);
  return account as unknown as Account;
};

export const getConfig = async (): Promise<Config> => {
  const { response } = await suiGrpcClient.ledgerService.getObject({
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