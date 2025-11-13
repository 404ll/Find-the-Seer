
import { networkConfig } from "./index";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
// import { fromHex } from "@mysten/sui/utils";

const FeeConfig = {
    createPost: 100000000,
    votePost: 100000000,
}
const KEY_SERVER_0 = '0x34401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab96';
const KEY_SERVER_1 = '0xd726ecf6f7036ee3557cd6c7b93a49b231070e8eecada9cfa157e40e3f02e5d3';
const KEY_SERVER_2 = '0xdba72804cc9504a82bbaa13ed4a83a0e2c6219d7e45125cf57fd10cbab957a97';
const KEY_SERVERS = [KEY_SERVER_0, KEY_SERVER_1, KEY_SERVER_2];


function hexToBytes(hex: string): number[] {
    // 移除可能的 '0x' 前缀
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes: number[] = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    return bytes;
  }
let pk0 = 'a58bfa576a8efe2e2730bc664b3dbe70257d8e35106e4af7353d007dba092d722314a0aeb6bca5eed735466bbf471aef01e4da8d2efac13112c51d1411f6992b8604656ea2cf6a33ec10ce8468de20e1d7ecbfed8688a281d462f72a41602161';
let pk1 = 'a9ce55cfa7009c3116ea29341151f3c40809b816f4ad29baa4f95c1bb23085ef02a46cf1ae5bd570d99b0c6e9faf525306224609300b09e422ae2722a17d2a969777d53db7b52092e4d12014da84bffb1e845c2510e26b3c259ede9e42603cd6';
let pk2 = '93b3220f4f3a46fb33074b590cda666c0ebc75c7157d2e6492c62b4aebc452c29f581361a836d1abcbe1386268a5685103d12dec04aadccaebfa46d4c92e2f2c0381b52d6f2474490d02280a9e9d8c889a3fce2753055e06033f39af86676651';
const PUBLIC_KEYS: number[][] = [
    hexToBytes(pk0),
    hexToBytes(pk1),
    hexToBytes(pk2),
  ];
  
  // public fun create_account(name: String, seer: &mut Seer, ctx: &mut TxContext) {
export const createAccount = async (name: string): Promise<Transaction> => {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::create_account`,
        arguments: [tx.pure.string(name), tx.object(networkConfig.testnet.variables.Seer)],
    });
    return tx;
};

// public fun create_post(
//     blob_id: String,
//     lasting_time: u64,
//     predicted_true_bp: u64,
//     key_servers: vector<address>,
//     publickeys: vector<vector<u8>>,
//     threshold: u8,
//     account: &mut Account,
//     seer: &mut Seer,
//     coin: Coin<SUI>,
//     clock: &Clock,
//     config: &Config,
//     ctx: &mut TxContext,
// ) {
export const createPost = async (address: string, blobId: string, lastingTime: number, predictedTrueBp: number, keyServers: string[], publicKeys: number[][], threshold: number, accountId: string): Promise<Transaction> => {
    const tx = new Transaction();
    const createPostFee = FeeConfig.createPost;
    tx.setSender(address);
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::create_post`,
        arguments: [
            tx.pure.string(blobId),
            tx.pure.u64(lastingTime),
            tx.pure.u64(predictedTrueBp),
            // tx.pure.vector("address", keyServers),
            tx.pure.vector("address", KEY_SERVERS),
            // tx.pure.vector("vector<u8>", publicKeys),
            tx.pure.vector("vector<u8>", PUBLIC_KEYS),
            // tx.pure.u8(threshold),
            tx.pure.u8(1),
            tx.object(accountId),
            tx.object(networkConfig.testnet.variables.Seer),
            coinWithBalance({ balance: createPostFee, type: networkConfig.testnet.variables.SUI }),
            tx.object.clock(),
            tx.object(networkConfig.testnet.variables.Config)
        ],
    });
    return tx;
};

// public fun vote_post(
//     post: &mut Post,
//     account: &mut Account,
//     clock: &Clock,
//     crypto_vote_data: vector<u8>,
//     coin: Coin<SUI>,
//     config: &Config,
//     ctx: &mut TxContext,
// ) {

export const votePost = async (address: string,postId: string, accountId: string, cryptoVoteData: number[], coin: string): Promise<Transaction> => {
    const tx = new Transaction();
    const votePostFee = FeeConfig.votePost;
    tx.setSender(address);
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::vote_post`,
        arguments: [tx.object(postId),
        tx.object(accountId),
        tx.object.clock(),
        tx.pure.vector("u8", cryptoVoteData),
        coinWithBalance({ balance: votePostFee, type: networkConfig.testnet.variables.SUI }),
        tx.object(networkConfig.testnet.variables.Config)
    ],
    });
    return tx;
};

// public fun decrypt_and_settle_crypto_vote(
//     post: &mut Post,
//     derived_keys: vector<vector<u8>>,
//     key_servers: vector<address>,
//     clock: &Clock,
//     ctx: &mut TxContext,
// ) {

export const decryptAndSettleCryptoVote = async (address: string, postId: string, derivedKeys: number[][], keyServers: string[]): Promise<Transaction> => {
    const tx = new Transaction();
    tx.setSender(address);
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::decrypt_and_settle_crypto_vote`,
        arguments: [tx.object(postId), tx.pure.vector("vector<u8>", derivedKeys), tx.pure.vector("address", keyServers), tx.object.clock(), tx.object(networkConfig.testnet.variables.Config)],
    });
    return tx;
};

// public fun claim_vote_rewards(
//     post: &mut Post,
//     account: &mut Account,
//     config: &Config,
//     ctx: &mut TxContext,
// ) {

export const claimVoteRewards = async (address: string, postId: string, accountId: string): Promise<Transaction> => {
    const tx = new Transaction();
    tx.setSender(address);
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::claim_vote_rewards`,
        arguments: [tx.object(postId), tx.object(accountId), tx.object(networkConfig.testnet.variables.Config)],
    });
    return tx;
};

// public fun claim_vote_rewards_for_author(
//     post: &mut Post,
//     account: &mut Account,
//     config: &Config,
//     ctx: &mut TxContext,
// ) {

export const claimVoteRewardsForAuthor = async (address: string, postId: string, accountId: string): Promise<Transaction> => {
    const tx = new Transaction();
    tx.setSender(address);
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::claim_vote_rewards_for_author`,
        arguments: [tx.object(postId), tx.object(accountId), tx.object(networkConfig.testnet.variables.Config)],
    });
    return tx;
};

