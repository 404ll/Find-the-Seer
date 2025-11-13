import { isValidSuiAddress } from "@mysten/sui/utils";
import { suiClient } from "./index";
import { SuiObjectResponse } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { networkConfig } from "./index";
import { Seer, Post, Account } from "../types/raw";
import { bcs } from '@mysten/sui/bcs';
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
    readMask: {
      paths: [
        "json",
      ],
    },
  });
  let seer: Seer;
  if (response.object?.json?.kind?.oneofKind === 'structValue') {
    const struct = response.object.json.kind.structValue.fields;
    const post_parent = extractValue(struct.posts).id as string;
    const posts = await getSeerDynamicFields(post_parent);
    seer = {
      id: extractValue(struct.id) as {id: string},
      accounts: extractValue(struct.accounts) as string[],
      posts: posts as unknown as Record<string, string[]>,
      post_fees: extractValue(struct.post_fees) as number,
    };
    return seer;
  }
  throw new Error("Failed to get Seer object");
};

export const getSeerDynamicFields = async (parent: string): Promise<Record<string, string>> => {
  const {response:fields} = await grpcClient.stateService.listDynamicFields({
    parent,
  });
  console.log("fields",fields);
  const {response} = await grpcClient.ledgerService.batchGetObjects({
    requests: Object.values(fields.dynamicFields).map((field) => ({
      objectId: field.fieldId,
      readMask: {
        paths: ["contents"],
      },
    })),
  });
  console.log("posts",response);
  return response.objects as unknown as Record<string, string>;
};


// public struct Post has key {
//   id: UID,
//   b36_address: String,
//   blob_id: String,
//   author: address,
//   lasting_time: u64,
//   created_at: u64,
//   predicted_true_bp: u64,
//   total_votes_count: u64,
//   total_votes_value: u64,
//   crypto_vote_result: CryptoVoteResult,
//   derived_vote_result: Option<DerivedVoteResult>,
//   voted_users: vector<address>,
//   voted_results: vector<u8>,
//   status: u8,
//   votes_pool: Balance<SUI>,
//   author_claimed: bool,
// }

// public struct CryptoVoteResult has store {
//   key_servers: vector<address>,
//   public_keys: vector<vector<u8>>,
//   threshold: u8,
//   encrypted_votes: vector<EncryptedObject>,
// }

// public struct DerivedVoteResult has store {
//   true_bp: u64,
//   true_votes_count: u64,
//   false_votes_count: u64,
// }
export const getPosts = async (postIds: string[]): Promise<Post[]> => {
  const requests = postIds.map((postId) => ({
    objectId: postId,
    readMask: {
      paths: [
        "contents",
      ],
    },
  }));
  const {response} = await grpcClient.ledgerService.batchGetObjects({
    requests,
  });
  const PostBcs = bcs.struct('Post', {
    id: bcs.struct('UID', {
      id: bcs.Address,
    }),
    b36_address: bcs.string(),
    blob_id: bcs.string(),
    author: bcs.Address,
    lasting_time: bcs.u64(),
    created_at: bcs.u64(),
    predicted_true_bp: bcs.u64(),
    total_votes_count: bcs.u64(),
    total_votes_value: bcs.u64(),
    crypto_vote_result: bcs.struct('CryptoVoteResult', {
    key_servers: bcs.vector(bcs.Address),
    public_keys: bcs.vector(bcs.vector(bcs.u8())),
    threshold: bcs.u8(),
    encrypted_votes: bcs.struct('EncryptedObject', {
      key_servers: bcs.vector(bcs.Address),
      public_keys: bcs.vector(bcs.vector(bcs.u8())),
      threshold: bcs.u8(),
      encrypted_votes: bcs.vector(bcs.Address),
    }),
    derived_vote_result: bcs.option(bcs.struct('DerivedVoteResult', {
      true_bp: bcs.u64(),
      true_votes_count: bcs.u64(),
      false_votes_count: bcs.u64(),
    })),
    voted_users: bcs.vector(bcs.Address),
    voted_results: bcs.vector(bcs.u8()),
    status: bcs.u8(),
    votes_pool: bcs.struct('Balance', {
      value: bcs.u64(),
    }),
    author_claimed: bcs.bool(),
  }),
  });

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
  const {response} = await grpcClient.stateService.listOwnedObjects({
    owner: accountId,
    objectType:`${networkConfig.testnet.variables.Package}::seer::Account`,
    readMask: {
      paths: [
        "contents",
      ],
    },
  });
  const AccountBcs = bcs.struct('Account', {
    id: bcs.struct('UID', {
      id: bcs.Address,
    }),
    name: bcs.string(),
    vote_profit: bcs.u64(),
    author_profit: bcs.u64(),
    owned_posts: bcs.vector(bcs.Address),
    voted_posts: bcs.vector(bcs.Address),
    claimed_posts: bcs.vector(bcs.Address),
  });

  const account = AccountBcs.parse(response.objects[0]?.contents?.value as Uint8Array);
  return account as unknown as Account;
};

function extractValue(value: any): any {
  if (!value || !value.kind) return null;
  
  switch (value.kind.oneofKind) {
    case 'stringValue':
      return value.kind.stringValue;
    case 'numberValue':
      return value.kind.numberValue;
    case 'boolValue':
      return value.kind.boolValue;
    case 'structValue':
      const result: any = {};
      for (const [key, val] of Object.entries(value.kind.structValue.fields)) {
        result[key] = extractValue(val);
      }
      return result;
    case 'listValue':
      return value.kind.listValue.values.map((v: any) => extractValue(v));
    default:
      return null;
  }
}
