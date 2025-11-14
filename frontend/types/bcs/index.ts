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
      encrypted_votes: bcs.vector(bcs.string()), // EncryptedObject 通常是序列化的字符串或字节
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
    name: bcs.string(),
    vote_profit: bcs.u64(),
    author_profit: bcs.u64(),
    owned_posts: bcs.vector(bcs.Address),
    voted_posts: bcs.vector(bcs.Address),
    claimed_posts: bcs.vector(bcs.Address),
  });

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
      type: bcs.Address,
    }),
  });