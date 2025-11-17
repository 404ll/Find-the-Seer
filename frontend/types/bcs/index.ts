import { bcs } from '@mysten/sui/bcs';


export const PostBcs = bcs.struct('Post', {
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
      encrypted_votes: bcs.vector(bcs.struct('EncryptedObject', {
        package_id: bcs.Address,
        id: bcs.vector(bcs.u8()),
        indices: bcs.vector(bcs.u8()),
        services: bcs.vector(bcs.Address),
        threshold: bcs.u8(),
        nonce: bcs.struct('Element', {
          bytes: bcs.vector(bcs.u8()),
        }),
        encrypted_shares: bcs.vector(bcs.vector(bcs.u8())),
        encrypted_randomness: bcs.vector(bcs.u8()),
        blob: bcs.vector(bcs.u8()),
        aad: bcs.option(bcs.vector(bcs.u8())),
        mac: bcs.vector(bcs.u8()),
      })),
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
  });



  export const AccountBcs = bcs.struct('Account', {
    id: bcs.struct('UID', {
      id: bcs.Address,
    }),
    vote_profit: bcs.u64(),
    author_profit: bcs.u64(),
    owned_posts: bcs.vector(bcs.Address),
    voted_posts: bcs.vector(bcs.Address),
    claimed_posts: bcs.vector(bcs.Address),
  });


//   public struct Seer has key {
//     id: UID,
//     //需要存吗？
//     accounts: vector<address>,
//     //owner -> post
//     posts: Table<address, vector<address>>,
//     post_fees: Balance<SUI>,
// }
  export const SeerBcs = bcs.struct('Seer', {
    id: bcs.struct('UID', {
      id: bcs.Address,
    }),
    accounts: bcs.vector(bcs.Address),
    posts: bcs.struct('Table', {
      id: bcs.struct('UID', {
        id: bcs.Address,
      }),
      size: bcs.u64(),
    }),
      post_fees: bcs.struct('Balance', {
      value: bcs.u64(),
    }),
  });

//   public struct Config has key {
//     id: UID,
//     create_post_fee: u64,
//     vote_value: u64,
//     package_id: address,
//     reward_benchmark: u64,
//     key_servers: vector<address>,
//     publickeys: vector<vector<u8>>,
//     threshold: u8,
//     //帖子用户占奖池的比例
//     // allocation_ratio: u64,
// }

export const ConfigBcs = bcs.struct('Config', {
    id: bcs.struct('UID', {
      id: bcs.Address,
    }),
    create_post_fee: bcs.u64(),
    vote_value: bcs.u64(),
    package_id: bcs.Address,
    reward_benchmark: bcs.u64(),
    key_servers: bcs.vector(bcs.Address),
    publickeys: bcs.vector(bcs.vector(bcs.u8())),
    threshold: bcs.u8(),
  });