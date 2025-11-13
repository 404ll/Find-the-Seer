
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { networkConfig } from "./index";
import { Seer, Post, Account } from "../types/raw";
import { PostBcs, AccountBcs, SeerBcs } from "../types/bcs";
import { bcs } from '@mysten/sui/bcs';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import {getTableContent} from './graphl';


const graphqlClient = new SuiGraphQLClient({
  url: `https://sui-mainnet.mystenlabs.com/graphql`,
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
export const getTableContentByGraphql = async (tableId: string): Promise<Record<string, string[]>> => {
  const response = await graphqlClient.query({
    query: getTableContent,
    variables: {
      tableId: tableId,
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
        "json"
      ],
    },
  });
  console.log("response", response);
  const seer = SeerBcs.parse(response.object?.contents?.value as Uint8Array);
  const posts = await getTableContentByGraphql(seer.posts.id.id);
  console.log("posts", posts);
  // const posts = await getPostsFromSeer(seer.posts.id.id);
  // console.log("posts", posts);
  console.log("seer", seer);
  return seer as unknown as Seer;
};

const getPostsFromSeer = async (parentId: string): Promise<Record<string, string[]>> => {
  const { response } = await grpcClient.stateService.listDynamicFields({
    parent: parentId,
  });
  const posts = response.dynamicFields.map((field) => {
  const post = grpcClient.ledgerService.getObject({
    objectId: field.fieldId,
    readMask: {
      paths: [
        "json",
        "contents",
      ],
    },
  });
  console.log("post", post);
    return post;
  });
  console.log("posts", posts);
  console.log("response", response);
  return posts as unknown as Record<string, string[]>;
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
      ],
    },
  });

  console.log("response", response);
  const posts = response.objects
    .map((object) => {
      if (object.result.oneofKind === 'object') {
        return PostBcs.parse(object.result.object?.contents?.value as Uint8Array) as unknown as Post;
      }
      return null;
    })
    .filter((post): post is Post => post !== null);

  return posts;
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

