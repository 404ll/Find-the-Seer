/*
/// Module: seer
module seer::seer;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions
module seer::seer;

use seal::bf_hmac_encryption::{
    EncryptedObject,
    decrypt,
    new_public_key,
    verify_derived_keys,
    parse_encrypted_object
};
use seer::utils::to_b36;
use std::string::String;
use sui::balance::{Self, Balance};
use sui::bls12381::g1_from_bytes;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;
use sui::table::{Self, Table};

const EInvalidVoteTime: u64 = 0;
const EAlreadyVoted: u64 = 1;
const EInvalidSettleTime: u64 = 2;
const ENotVotedForCorrect: u64 = 3;
const EInvalidCoinValue: u64 = 4;
const EVoteForPostAuthor: u64 = 5;
const EInvalidPostAuthor: u64 = 6;
const EInvalidBp: u64 = 7;
const ENotEnoughFees: u64 = 8;
const ENotVotedForPost: u64 = 10;
const EAlreadyClaimed: u64 = 11;
const EInvalidKeyServers: u64 = 12;
const EInvalidThreshold: u64 = 13;
const EInvalidEncryptedVote: u64 = 14;
const EAlreadySettled: u64 = 15;
const ENotEnoughDerivedKeys: u64 = 16;
const ENoAccess: u64 = 17;
const ENotSettled: u64 = 18;
const EInvalidPost: u64 = 19;
//======CONSTANTS=====
const POST_STATUS_PENDING: u8 = 0;
const POST_STATUS_SUCCESS: u8 = 1;
const POST_STATUS_FAILED: u8 = 2;
const POST_STATUS_NO_VOTES: u8 = 3;

//add vote_deadline = 24 hours
const VOTE_FOR_CRYPTO: u8 = 0;
const VOTE_FOR_TRUE: u8 = 1;
const VOTE_FOR_FALSE: u8 = 2;
const VOTE_FOR_NONE: u8 = 3;
//万分比
const BP_DECIMAL: u64 = 10000;

//TODO:待设置项
const CREATE_POST_FEE: u64 = 100_000_000;
const VOTE_VALUE: u64 = 100_000_000;
const REWARD_BENCHMARK: u64 = 2000; //20%

//=====Structs=====
public struct AdminCap has key, store {
    id: UID,
}

public struct Config has key {
    id: UID,
    create_post_fee: u64,
    vote_value: u64,
    package_id: address,
    reward_benchmark: u64,
    key_servers: vector<address>,
    publickeys: vector<vector<u8>>,
    threshold: u8,
    //帖子用户占奖池的比例
    // allocation_ratio: u64,
}

//用于存储全局信息
public struct Seer has key {
    id: UID,
    //需要存吗？
    accounts: vector<address>,
    //owner -> post
    posts: Table<address, vector<address>>,
    post_fees: Balance<SUI>,
}

public struct Post has key {
    id: UID,
    b36_address: String,
    blob_id: String,
    author: address,
    lasting_time: u64,
    created_at: u64,
    predicted_true_bp: u64,
    total_votes_count: u64,
    total_votes_value: u64,
    crypto_vote_result: CryptoVoteResult,
    derived_vote_result: Option<DerivedVoteResult>,
    voted_users: vector<address>,
    voted_results: vector<u8>,
    status: u8,
    votes_pool: Balance<SUI>,
    author_claimed: bool,
}

public struct CryptoVoteResult has store {
    key_servers: vector<address>,
    public_keys: vector<vector<u8>>,
    threshold: u8,
    encrypted_votes: vector<EncryptedObject>,
}

public struct DerivedVoteResult has store {
    true_bp: u64,
    true_votes_count: u64,
    false_votes_count: u64,
}

public struct Account has key, store {
    id: UID,
    vote_profit: u64,
    author_profit: u64,
    owned_posts: vector<address>,
    voted_posts: vector<address>,
    claimed_posts: vector<address>,
}

//=====Events=====
public struct CreateAccountEvent has copy, drop {
    user: address,
    account_address: address,
}

public struct CreatePostEvent has copy, drop {
    post: address,
    blob_id: String,
    lasting_time: u64,
    predicted_true_bp: u64,
    author: address,
}

public struct VotePostEvent has copy, drop {
    post: address,
    user: address,
    account: address,
    vote_result: vector<u8>,
}

public struct PostSettleEvent has copy, drop {
    post: address,
    settle: address,
    status: u8,
}

public struct ClaimVoteRewardsEvent has copy, drop {
    post: address,
    account: address,
    value: u64,
}

public struct ClaimVoteRewardsForAuthorEvent has copy, drop {
    post: address,
    author: address,
    value: u64,
}

public struct ClaimCreatePostFeesEvent has copy, drop {
    admin: address,
    values: u64,
}

public struct UpdateRewardBenchmarkEvent has copy, drop {
    reward_benchmark: u64,
}

public struct UpdateCreatePostFeeEvent has copy, drop {
    create_post_fee: u64,
}

public struct SetPackageIdEvent has copy, drop {
    package_id: address,
}

public struct SetKeyServersEvent has copy, drop {
    key_servers: vector<address>,
}

public struct SetPublickeysEvent has copy, drop {
    publickeys: vector<vector<u8>>,
}

public struct SetThresholdEvent has copy, drop {
    threshold: u8,
}

//=====Functions=====
fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::share_object(Config {
        id: object::new(ctx),
        create_post_fee: CREATE_POST_FEE,
        vote_value: VOTE_VALUE,
        key_servers: vector::empty<address>(),
        publickeys: vector::empty<vector<u8>>(),
        threshold: 0,
        reward_benchmark: REWARD_BENCHMARK,
        package_id: @seer,
    });
    transfer::share_object(Seer {
        id: object::new(ctx),
        accounts: vector::empty<address>(),
        posts: table::new(ctx),
        post_fees: balance::zero<SUI>(),
    });
}

public fun create_account(seer: &mut Seer, ctx: &mut TxContext): Account {
    let id = object::new(ctx);
    let address = object::uid_to_address(&id);
    let account = Account {
        id: id,
        vote_profit: 0,
        author_profit: 0,
        owned_posts: vector::empty<address>(),
        voted_posts: vector::empty<address>(),
        claimed_posts: vector::empty<address>(),
    };
    vector::push_back(&mut seer.accounts, address);
    event::emit(CreateAccountEvent {
        user: ctx.sender(),
        account_address: address,
    });
    account
}

public fun create_post(
    blob_id: String,
    lasting_time: u64,
    predicted_true_bp: u64,
    account: &mut Account,
    seer: &mut Seer,
    coin: Coin<SUI>,
    clock: &Clock,
    config: &Config,
    ctx: &mut TxContext,
) {
    assert!(coin::value(&coin) == config.create_post_fee, EInvalidCoinValue);
    assert!(predicted_true_bp <= BP_DECIMAL, EInvalidBp);
    assert!(config.key_servers.length() == config.publickeys.length(), EInvalidKeyServers);
    assert!(config.threshold <= config.key_servers.length() as u8, EInvalidThreshold);

    let id = object::new(ctx);
    let address = object::uid_to_address(&id);
    let b36_address = to_b36(address);
    if (!table::contains(&seer.posts, ctx.sender())) {
        table::add(&mut seer.posts, ctx.sender(), vector::empty<address>());
    };
    let posts = table::borrow_mut(&mut seer.posts, ctx.sender());
    vector::push_back(posts, address);
    vector::push_back(&mut account.owned_posts, address);
    coin::put(&mut seer.post_fees, coin);
    let crypto_vote_result = CryptoVoteResult {
        key_servers: config.key_servers,
        public_keys: config.publickeys,d
        threshold: config.threshold,
        encrypted_votes: vector::empty<EncryptedObject>(),
    };
    transfer::share_object(Post {
        id,
        b36_address,
        blob_id,
        author: ctx.sender(),
        lasting_time,
        created_at: clock.timestamp_ms(),
        predicted_true_bp,
        voted_users: vector::empty<address>(),
        voted_results: vector::empty<u8>(),
        total_votes_count: 0,
        total_votes_value: 0,
        crypto_vote_result: crypto_vote_result,
        derived_vote_result: option::none<DerivedVoteResult>(),
        status: POST_STATUS_PENDING,
        votes_pool: balance::zero<SUI>(),
        author_claimed: false,
    });
    event::emit(CreatePostEvent {
        post: address,
        blob_id: blob_id,
        lasting_time: lasting_time,
        predicted_true_bp: predicted_true_bp,
        author: ctx.sender(),
    });
}

public fun vote_post(
    post: &mut Post,
    account: &mut Account,
    clock: &Clock,
    crypto_vote_data: vector<u8>,
    coin: Coin<SUI>,
    config: &Config,
    ctx: &mut TxContext,
) {
    let post_address = object::uid_to_address(&post.id);
    assert!(post.created_at + post.lasting_time > clock.timestamp_ms(), EInvalidVoteTime);
    assert!(!vector::contains(&account.voted_posts, &post_address), EAlreadyVoted);
    assert!(coin::value(&coin) == config.vote_value, EInvalidCoinValue);
    assert!(post.author != ctx.sender(), EVoteForPostAuthor);
    coin::put(&mut post.votes_pool, coin);
    let post_id = object::id(post);
    let crypto_vote_result = &mut post.crypto_vote_result;
    let encrypted_vote = parse_encrypted_object(crypto_vote_data);
    verify_crypto_vote(crypto_vote_result, &encrypted_vote, post_id.to_bytes(), ctx);
    post.total_votes_count = post.total_votes_count + 1;
    post.total_votes_value = post.total_votes_value + config.vote_value;
    vector::push_back(&mut crypto_vote_result.encrypted_votes, encrypted_vote);
    vector::push_back(&mut post.voted_users, ctx.sender());
    vector::push_back(&mut post.voted_results, VOTE_FOR_CRYPTO);
    vector::push_back(&mut account.voted_posts, post_address);
    event::emit(VotePostEvent {
        post: post_address,
        user: ctx.sender(),
        account: object::uid_to_address(&account.id),
        vote_result: crypto_vote_data,
    });
}

public fun decrypt_and_settle_crypto_vote(
    post: &mut Post,
    derived_keys: vector<vector<u8>>,
    key_servers: vector<address>,
    clock: &Clock,
    config: &Config,
    ctx: &mut TxContext,
) {
    assert!(post.created_at + post.lasting_time <= clock.timestamp_ms(), EInvalidSettleTime);
    assert!(post.status == POST_STATUS_PENDING, EAlreadySettled);
    if (post.total_votes_count == 0) {
        post.status = POST_STATUS_NO_VOTES;
    } else {
        assert!(post.derived_vote_result.is_none(), EAlreadySettled);
        assert!(derived_keys.length() == key_servers.length(), EInvalidKeyServers);

        let crypto_vote_result = &post.crypto_vote_result;
        assert!(derived_keys.length() as u8 >= crypto_vote_result.threshold, ENotEnoughDerivedKeys);
        let verified_derived_keys = verify_derived_keys(
            &derived_keys.map_ref!(|k| g1_from_bytes(k)),
            config.package_id,
            object::id(post).to_bytes(),
            &key_servers
                .map_ref!(
                    |ks1| crypto_vote_result
                        .key_servers
                        .find_index!(|ks2| ks1 == ks2)
                        .destroy_some(),
                )
                .map!(
                    |i| new_public_key(
                        crypto_vote_result.key_servers[i].to_id(),
                        crypto_vote_result.public_keys[i],
                    ),
                ),
        );
        let all_public_keys = crypto_vote_result
            .key_servers
            .zip_map!(crypto_vote_result.public_keys, |ks, pk| new_public_key(ks.to_id(), pk));
        let mut true_votes_count = 0;
        let mut false_votes_count = 0;
        let mut decrypted_votes = vector::empty<Option<vector<u8>>>();

        crypto_vote_result.encrypted_votes.do_ref!(|encrypted_vote| {
            let decrypted_vote = decrypt(encrypted_vote, &verified_derived_keys, &all_public_keys);
            vector::push_back(&mut decrypted_votes, decrypted_vote);
        });

        let mut i = 0;
        decrypted_votes.do_ref!(|decrypted_vote| {
            let vote_result_ref = vector::borrow_mut(&mut post.voted_results, i);
            if (decrypted_vote.is_some()) {
                let decrypted_vote = decrypted_vote.borrow();
                if (decrypted_vote.length() == 1 && decrypted_vote[0] == 1) {
                    *vote_result_ref = VOTE_FOR_TRUE;
                    true_votes_count = true_votes_count + 1;
                } else if (decrypted_vote.length() == 1 && decrypted_vote[0] == 0) {
                    *vote_result_ref = VOTE_FOR_FALSE;
                    false_votes_count = false_votes_count + 1;
                } else {
                    *vote_result_ref = VOTE_FOR_NONE;
                }
            } else {
                *vote_result_ref = VOTE_FOR_NONE;
            };
            i = i + 1;
        });
        let true_bp = true_votes_count * BP_DECIMAL / (true_votes_count + false_votes_count);
        let derived_vote_result = DerivedVoteResult {
            true_bp: true_bp,
            true_votes_count: true_votes_count,
            false_votes_count: false_votes_count,
        };
        post.derived_vote_result.fill(derived_vote_result);

        if (true_bp > 5000) {
            post.status = POST_STATUS_SUCCESS;
        } else {
            post.status = POST_STATUS_FAILED;
        };

        event::emit(PostSettleEvent {
            post: object::uid_to_address(&post.id),
            settle: object::uid_to_address(&post.id),
            status: post.status,
        });
    };
}

//TODO:领取金额要改
#[allow(lint(self_transfer))]
public fun claim_vote_rewards(
    post: &mut Post,
    account: &mut Account,
    config: &Config,
    ctx: &mut TxContext,
) {
    //限制 - 领取权限 - 时间限制 - 是否投票 - 是否领取过
    assert!(post.derived_vote_result.is_some(), ENotSettled);
    let post_address = object::uid_to_address(&post.id);
    assert!(vector::contains(&account.voted_posts, &post_address), ENotVotedForPost);
    assert!(!vector::contains(&account.claimed_posts, &post_address), EAlreadyClaimed);
    assert!(check_post_vote_reward_for_user(post, ctx.sender()), ENotVotedForCorrect);
    vector::push_back(&mut account.claimed_posts, post_address);
    let vote_reward = calculate_post_vote_reward(post, config);
    account.vote_profit = account.vote_profit + vote_reward;
    let coin = coin::take(&mut post.votes_pool, vote_reward, ctx);
    transfer::public_transfer(coin, ctx.sender());
    event::emit(ClaimVoteRewardsEvent {
        post: object::uid_to_address(&post.id),
        account: object::uid_to_address(&account.id),
        value: vote_reward,
    });
}

//TODO:领取金额要改
#[allow(lint(self_transfer))]
public fun claim_vote_rewards_for_author(
    post: &mut Post,
    account: &mut Account,
    config: &Config,
    ctx: &mut TxContext,
) {
    //限制 - 领取权限 - 时间限制 - 是否领取过
    assert!(post.status != POST_STATUS_PENDING, ENotSettled);
    assert!(post.author == ctx.sender(), EInvalidPostAuthor);
    assert!(post.author_claimed == false, EAlreadyClaimed);
    let author_reward = calculate_post_author_reward(post, config);
    account.author_profit = account.author_profit + author_reward;
    post.author_claimed = true;
    let coin = coin::take(&mut post.votes_pool, author_reward, ctx);
    transfer::public_transfer(coin, ctx.sender());
    event::emit(ClaimVoteRewardsForAuthorEvent {
        post: object::uid_to_address(&post.id),
        author: ctx.sender(),
        value: author_reward,
    });
}

#[allow(lint(self_transfer))]
public fun claim_create_post_fees(_: &AdminCap, seer: &mut Seer, values: u64, ctx: &mut TxContext) {
    let post_fees = balance::value(&seer.post_fees);
    assert!(post_fees >= values, ENotEnoughFees);
    let coin = coin::take(&mut seer.post_fees, values, ctx);
    transfer::public_transfer(coin, ctx.sender());
    event::emit(ClaimCreatePostFeesEvent {
        admin: ctx.sender(),
        values: values,
    });
}

public fun update_reward_benchmark(_: &AdminCap, config: &mut Config, reward_benchmark: u64) {
    assert!(reward_benchmark <= BP_DECIMAL, EInvalidBp);
    config.reward_benchmark = reward_benchmark;
    event::emit(UpdateRewardBenchmarkEvent {
        reward_benchmark: reward_benchmark,
    });
}

public fun update_create_post_fee(_: &AdminCap, config: &mut Config, create_post_fee: u64) {
    config.create_post_fee = create_post_fee;
    event::emit(UpdateCreatePostFeeEvent {
        create_post_fee: create_post_fee,
    });
}

public fun set_package_id(_: &AdminCap, config: &mut Config, package_id: address) {
    config.package_id = package_id;
    event::emit(SetPackageIdEvent {
        package_id: package_id,
    });
}

public fun set_key_servers(_: &AdminCap, config: &mut Config, key_servers: vector<address>) {
    config.key_servers = key_servers;
    event::emit(SetKeyServersEvent {
        key_servers: key_servers,
    });
}

public fun set_publickeys(_: &AdminCap, config: &mut Config, publickeys: vector<vector<u8>>) {
    config.publickeys = publickeys;
    event::emit(SetPublickeysEvent {
        publickeys: publickeys,
    });
}

public fun set_threshold(_: &AdminCap, config: &mut Config, threshold: u8) {
    config.threshold = threshold;
    event::emit(SetThresholdEvent {
        threshold: threshold,
    });
}

public fun get_key_servers(config: &Config): vector<address> {
    config.key_servers
}

public fun get_publickeys(config: &Config): vector<vector<u8>> {
    config.publickeys
}

//getter
public fun get_create_post_fee(config: &Config): u64 {
    config.create_post_fee
}

public fun get_reward_benchmark(config: &Config): u64 {
    config.reward_benchmark
}

public fun get_post_status(post: &Post): u8 {
    post.status
}

public fun get_post_author(post: &Post): address {
    post.author
}

public fun get_post_finish_time(post: &Post, clock: &Clock): u64 {
    let end_time = post.created_at + post.lasting_time;
    let current_time = clock.timestamp_ms();
    if (current_time >= end_time) {
        0
    } else {
        end_time - current_time
    }
}

// Rp = (P * α) * (1 - Δ) / (1 + N)
//P = post.total_votes_value
//α = config.reward_benchmark
//Δ = calculate_vote_delta(post)
//N = derived_vote_result.false_votes_count + derived_vote_result.true_votes_count + 1
//author_reward = benchmark_value * (BP_DECIMAL - vote_delta) / (total_count * BP_DECIMAL)

public fun calculate_post_author_reward(post: &Post, config: &Config): u64 {
    assert!(post.derived_vote_result.is_some(), ENotSettled);
    let vote_delta = calculate_vote_delta(post);
    let benchmark_value = (post.total_votes_value * config.reward_benchmark) / BP_DECIMAL;
    let derived_vote_result = post.derived_vote_result.borrow();
    let total_count =
        derived_vote_result.false_votes_count + derived_vote_result.true_votes_count + 1;
    let author_reward = benchmark_value * (BP_DECIMAL - vote_delta) / (total_count * BP_DECIMAL);
    author_reward
}

public fun calculate_post_vote_reward(post: &Post, config: &Config): u64 {
    let author_reward = calculate_post_author_reward(post, config);
    let votes_reward = post.total_votes_value - author_reward;
    let derived_vote_result = post.derived_vote_result.borrow();
    let true_bp = derived_vote_result.true_bp;
    let mut vote_reward: u64 = 0;
    if (true_bp > 5000) {
        vote_reward = votes_reward / (derived_vote_result.true_votes_count);
    } else {
        vote_reward = votes_reward / (derived_vote_result.false_votes_count);
    };
    vote_reward
}

public fun check_post_vote_reward_for_user(post: &Post, user: address): bool {
    assert!(post.derived_vote_result.is_some(), ENotSettled);
    assert!(vector::contains(&post.voted_users, &user), ENotVotedForPost);
    let true_bp = post.derived_vote_result.borrow().true_bp;
    let user_index = post.voted_users.find_index!(|v| v == user).borrow();
    let user_vote = post.voted_results[*user_index];
    if (user_vote == VOTE_FOR_TRUE && true_bp > 5000) {
        true
    } else if (user_vote == VOTE_FOR_FALSE && true_bp <= 5000) {
        true
    } else {
        false
    }
}

public fun calculate_vote_delta(post: &Post): u64 {
    let derived_vote_result = post.derived_vote_result.borrow();
    if (derived_vote_result.true_bp > post.predicted_true_bp) {
        derived_vote_result.true_bp - post.predicted_true_bp
    } else {
        post.predicted_true_bp - derived_vote_result.true_bp
    }
}

public fun calculate_true_bp(post: &Post): u64 {
    let derived_vote_result = post.derived_vote_result.borrow();
    let true_bp = derived_vote_result.true_bp;
    true_bp
}

entry fun seal_approve(id: vector<u8>, post: &Post, clock: &Clock) {
    assert!(id == object::id(post).to_bytes(), EInvalidPost);
    let end_time = post.created_at + post.lasting_time;
    assert!(clock.timestamp_ms() >= end_time, ENoAccess);
}

fun verify_crypto_vote(
    crypto_vote_result: &CryptoVoteResult,
    encrypted_vote: &EncryptedObject,
    post_id: vector<u8>,
    ctx: &mut TxContext,
) {
    assert!(encrypted_vote.aad().borrow() == ctx.sender().to_bytes(), EInvalidEncryptedVote);
    assert!(encrypted_vote.services() == crypto_vote_result.key_servers, EInvalidEncryptedVote);
    assert!(encrypted_vote.threshold() == crypto_vote_result.threshold, EInvalidEncryptedVote);
    assert!(encrypted_vote.id() == post_id, EInvalidEncryptedVote);
    // assert!(encrypted_vote.package_id() == @seer, EInvalidEncryptedVote);
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
