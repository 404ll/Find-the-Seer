// public struct Account has key {
//     id: UID,
//     name: String,
//     vote_profit: u64,
//     author_profit: u64,
//     owned_posts: vector<address>,
//     //post_address -> support or against
//     voted_posts: vector<address>,
//     //post_address -> claimed or not
//     claimed_posts: vector<address>,
// }

export interface Account {
    id: {id: string};
    name: string;
    vote_profit: number;
    author_profit: number;
    owned_posts: string[];
    voted_posts: string[];
    claimed_posts: string[];
}

// public struct Post has key {
//     id: UID,
//     b36_address: String,
//     blob_id: String,
//     author: address,
//     lasting_time: u64,
//     created_at: u64,
//     predicted_true_bp: u64,
//     total_votes_count: u64,
//     total_votes_value: u64,
//     crypto_vote_result: CryptoVoteResult,
//     derived_vote_result: Option<DerivedVoteResult>,
//     voted_users: vector<address>,
//     voted_results: vector<u8>,
//     status: u8,
//     votes_pool: Balance<SUI>,
//     author_claimed: bool,
// }

// public struct CryptoVoteResult has store {
//     key_servers: vector<address>,
//     public_keys: vector<vector<u8>>,
//     threshold: u8,
//     encrypted_votes: vector<EncryptedObject>,
// }

// public struct DerivedVoteResult has store {
//     true_bp: u64,
//     true_votes_count: u64,
//     false_votes_count: u64,
// }

export interface Post {
    id: {id: string};
    b36_address: string;
    blob_id: string;
    author: string;
    lasting_time: number;
    created_at: number;
    predicted_true_bp: number;
    total_votes_count: number;
    total_votes_value: number;
    crypto_vote_result: CryptoVoteResult;
    derived_vote_result: DerivedVoteResult | null;
    voted_users: string[];
    voted_results: number[];
    status: number;
    votes_pool: number;
    author_claimed: boolean;
}

export interface EncryptedObject {
    package_id: string;
    id: string[];
    indices: string[];
    services: string[];
    threshold: number;
}

export interface CryptoVoteResult {
    key_servers: string[];
    public_keys: string[][];
    threshold: number;
    encrypted_votes: EncryptedObject[];
}

export interface DerivedVoteResult {
    true_bp: number;
    true_votes_count: number;
    false_votes_count: number;
}

// public struct Seer has key {
//     id: UID,
//     //需要存吗？
//     accounts: vector<address>,
//     //owner -> post
//     posts: Table<address, vector<address>>,
//     post_fees: Balance<SUI>,
// }

export interface Seer {
    id: {id: string};
    accounts: string[];
    posts_table_id: string;
    post_fees: number;
}