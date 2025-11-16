
import { networkConfig } from "./index";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
// import { fromHex } from "@mysten/sui/utils";

const FeeConfig = {
    createPost: 100000000,
    votePost: 100000000,
}
// public fun create_account(name: String, seer: &mut Seer, ctx: &mut TxContext) {
export const createAccount = async (): Promise<Transaction> => {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::create_account`,
        arguments: [tx.object(networkConfig.testnet.variables.Seer)],
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
export const createPost = async (address: string, blobId: string, lastingTime: number, predictedTrueBp: number, accountId: string): Promise<Transaction> => {
    const tx = new Transaction();
    const createPostFee = FeeConfig.createPost;
    tx.setSender(address);
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::create_post`,
        arguments: [
            tx.pure.string(blobId),
            tx.pure.u64(lastingTime),
            tx.pure.u64(predictedTrueBp),
            tx.object(accountId),
            tx.object(networkConfig.testnet.variables.Seer),
            coinWithBalance({ balance: createPostFee, type: networkConfig.testnet.variables.SUI }),
            tx.object.clock(),
            tx.object(networkConfig.testnet.variables.Config)
        ],
    });
    return tx;
};

export const createAccountAndPost = async (
    address: string,
    blobId: string,
    lastingTime: number,
    predictedTrueBp: number,
): Promise<Transaction> => {
    const tx = new Transaction();
    const createPostFee = FeeConfig.createPost;
    tx.setSender(address);

    // 1. 先创建 account
    const [account] = tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::create_account`,
        arguments: [tx.object(networkConfig.testnet.variables.Seer)],
    });

    // 2. 再创建 post，使用上一步的 account 结果
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::create_post`,
        arguments: [
            tx.pure.string(blobId),
            tx.pure.u64(lastingTime),
            tx.pure.u64(predictedTrueBp),
            tx.object(account),
            tx.object(networkConfig.testnet.variables.Seer),
            coinWithBalance({ balance: createPostFee, type: networkConfig.testnet.variables.SUI }),
            tx.object.clock(),
            tx.object(networkConfig.testnet.variables.Config)
        ],
    });

    tx.transferObjects([account], address);

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

export const votePost = async (address: string, postId: string, accountId: string, cryptoVoteData: number[]): Promise<Transaction> => {
    const tx = new Transaction();
    const votePostFee = FeeConfig.votePost;
    tx.setSender(address);
    console.log("cryptoVoteData", cryptoVoteData);
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

export const createAccountAndVotePost = async (address: string, postId: string, cryptoVoteData: number[]): Promise<Transaction> => {
    const tx = new Transaction();
    tx.setSender(address);
    const [account] = tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::create_account`,
        arguments: [tx.object(networkConfig.testnet.variables.Seer)],
    });
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::vote_post`,
        arguments: [tx.object(postId), tx.object(account), tx.object.clock(), tx.pure.vector("u8", cryptoVoteData), coinWithBalance({ balance: FeeConfig.votePost, type: networkConfig.testnet.variables.SUI }), tx.object(networkConfig.testnet.variables.Config)],
    });
    tx.transferObjects([account], address);
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
    // post: &mut Post,
    // derived_keys: vector<vector<u8>>,
    // key_servers: vector<address>,
    // clock: &Clock,
    console.log("derivedKeys-------------------------------------", derivedKeys);
    console.log("keyServers-------------------------------------", keyServers);
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::decrypt_and_settle_crypto_vote`,
        arguments: [
            tx.object(postId),
            tx.pure.vector("vector<u8>", derivedKeys),
            tx.pure.vector("address", keyServers),
            tx.object.clock(),
            tx.object(networkConfig.testnet.variables.Config)
        ],
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

export const setPublicKeys1 = async (publicKeys: number[][]): Promise<Transaction> => {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::seer::set_publickeys`,
        arguments: [tx.object(networkConfig.testnet.variables.AdminCap), tx.object(networkConfig.testnet.variables.Config), tx.pure.vector("vector<u8>", publicKeys)],
    });
    return tx;
};



