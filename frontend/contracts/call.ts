import { coinWithBalance } from "@mysten/sui/transactions";
import { createBetterTxFactory } from "@/hooks/useBetterTx";

const SUI_TYPE_ARG = "0x2::sui::SUI";

const FeeConfig = {
    createPost: 100000000,
    votePost: 100000000,
}

// public fun create_account(name: String, seer: &mut Seer, ctx: &mut TxContext) {
export const createAccount = createBetterTxFactory<{}>(
    (tx, networkVariables) => {
        tx.moveCall({
            target: `${networkVariables.Package}::seer::create_account`,
            arguments: [tx.object(networkVariables.Seer)],
        });
        return tx;
    }
);

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
export const createPost = createBetterTxFactory<{
    address: string;
    blobId: string;
    lastingTime: number;
    predictedTrueBp: number;
    accountId: string;
}>(
    (tx, networkVariables, params) => {
        const { address, blobId, lastingTime, predictedTrueBp, accountId } = params;
        const createPostFee = FeeConfig.createPost;
        tx.setSender(address);
        tx.moveCall({
            target: `${networkVariables.Package}::seer::create_post`,
            arguments: [
                tx.pure.string(blobId),
                tx.pure.u64(lastingTime),
                tx.pure.u64(predictedTrueBp),
                tx.object(accountId),
                tx.object(networkVariables.Seer),
                coinWithBalance({ balance: createPostFee, type: SUI_TYPE_ARG }),
                tx.object.clock(),
                tx.object(networkVariables.Config)
            ],
        });
        return tx;
    }
);

export const createAccountAndPost = createBetterTxFactory<{
    address: string;
    blobId: string;
    lastingTime: number;
    predictedTrueBp: number;
}>(
    (tx, networkVariables, params) => {
        const { address, blobId, lastingTime, predictedTrueBp } = params;
        const createPostFee = FeeConfig.createPost;
        tx.setSender(address);

        // 1. 先创建 account
        const [account] = tx.moveCall({
            target: `${networkVariables.Package}::seer::create_account`,
            arguments: [tx.object(networkVariables.Seer)],
        });

        // 2. 再创建 post，使用上一步的 account 结果
        tx.moveCall({
            target: `${networkVariables.Package}::seer::create_post`,
            arguments: [
                tx.pure.string(blobId),
                tx.pure.u64(lastingTime),
                tx.pure.u64(predictedTrueBp),
                tx.object(account),
                tx.object(networkVariables.Seer),
                coinWithBalance({ balance: createPostFee, type: SUI_TYPE_ARG }),
                tx.object.clock(),
                tx.object(networkVariables.Config)
            ],
        });

        tx.transferObjects([account], address);

        return tx;
    }
);
// public fun vote_post(
//     post: &mut Post,
//     account: &mut Account,
//     clock: &Clock,
//     crypto_vote_data: vector<u8>,
//     coin: Coin<SUI>,
//     config: &Config,
//     ctx: &mut TxContext,
// ) {
export const votePost = createBetterTxFactory<{
    address: string;
    postId: string;
    accountId: string;
    cryptoVoteData: number[];
}>(
    (tx, networkVariables, params) => {
        const { address, postId, accountId, cryptoVoteData } = params;
        const votePostFee = FeeConfig.votePost;
        tx.setSender(address);
        console.log("cryptoVoteData", cryptoVoteData);
        tx.moveCall({
            target: `${networkVariables.Package}::seer::vote_post`,
            arguments: [
                tx.object(postId),
                tx.object(accountId),
                tx.object.clock(),
                tx.pure.vector("u8", cryptoVoteData),
                coinWithBalance({ balance: votePostFee, type: SUI_TYPE_ARG }),
                tx.object(networkVariables.Config)
            ],
        });
        return tx;
    }
);

export const createAccountAndVotePost = createBetterTxFactory<{
    address: string;
    postId: string;
    cryptoVoteData: number[];
}>(
    (tx, networkVariables, params) => {
        const { address, postId, cryptoVoteData } = params;
        tx.setSender(address);
        const [account] = tx.moveCall({
            target: `${networkVariables.Package}::seer::create_account`,
            arguments: [tx.object(networkVariables.Seer)],
        });
        tx.moveCall({
            target: `${networkVariables.Package}::seer::vote_post`,
            arguments: [
                tx.object(postId),
                tx.object(account),
                tx.object.clock(),
                tx.pure.vector("u8", cryptoVoteData),
                coinWithBalance({ balance: FeeConfig.votePost, type: SUI_TYPE_ARG }),
                tx.object(networkVariables.Config)
            ],
        });
        tx.transferObjects([account], address);
        return tx;
    }
);

// public fun decrypt_and_settle_crypto_vote(
//     post: &mut Post,
//     derived_keys: vector<vector<u8>>,
//     key_servers: vector<address>,
//     clock: &Clock,
//     ctx: &mut TxContext,
// ) {
export const decryptAndSettleCryptoVote = createBetterTxFactory<{
    address: string;
    postId: string;
    derivedKeys: number[][];
    keyServers: string[];
}>(
    (tx, networkVariables, params) => {
        const { address, postId, derivedKeys, keyServers } = params;
        tx.setSender(address);
        console.log("derivedKeys-------------------------------------", derivedKeys);
        console.log("keyServers-------------------------------------", keyServers);
        tx.moveCall({
            target: `${networkVariables.Package}::seer::decrypt_and_settle_crypto_vote`,
            arguments: [
                tx.object(postId),
                tx.pure.vector("vector<u8>", derivedKeys),
                tx.pure.vector("address", keyServers),
                tx.object.clock(),
                tx.object(networkVariables.Config)
            ],
        });
        return tx;
    }
);

// public fun claim_vote_rewards(
//     post: &mut Post,
//     account: &mut Account,
//     config: &Config,
//     ctx: &mut TxContext,
// ) {
export const claimVoteRewards = createBetterTxFactory<{
    address: string;
    postId: string;
    accountId: string;
}>(
    (tx, networkVariables, params) => {
        const { address, postId, accountId } = params;
        tx.setSender(address);
        tx.moveCall({
            target: `${networkVariables.Package}::seer::claim_vote_rewards`,
            arguments: [
                tx.object(postId),
                tx.object(accountId),
                tx.object(networkVariables.Config)
            ],
        });
        return tx;
    }
);

// public fun claim_vote_rewards_for_author(
//     post: &mut Post,
//     account: &mut Account,
//     config: &Config,
//     ctx: &mut TxContext,
// ) {
export const claimVoteRewardsForAuthor = createBetterTxFactory<{
    address: string;
    postId: string;
    accountId: string;
}>(
    (tx, networkVariables, params) => {
        const { address, postId, accountId } = params;
        tx.setSender(address);
        tx.moveCall({
            target: `${networkVariables.Package}::seer::claim_vote_rewards_for_author`,
            arguments: [
                tx.object(postId),
                tx.object(accountId),
                tx.object(networkVariables.Config)
            ],
        });
        return tx;
    }
);

export const setPublicKeys1 = createBetterTxFactory<{
    publicKeys: number[][];
}>(
    (tx, networkVariables, params) => {
        const { publicKeys } = params;
        tx.moveCall({
            target: `${networkVariables.Package}::seer::set_publickeys`,
            arguments: [
                tx.object(networkVariables.AdminCap),
                tx.object(networkVariables.Config),
                tx.pure.vector("vector<u8>", publicKeys)
            ],
        });
        return tx;
    }
);



