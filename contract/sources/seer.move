/*
/// Module: seer
module seer::seer;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions
module seer::seer;

use seal::bf_hmac_encryption::{
    EncryptedObject,
    VerifiedDerivedKey,
    PublicKey,
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
const EInvalidCoinValue: u64 = 4;
const EVoteForPostAuthor: u64 = 5;
const EInvalidPostAuthor: u64 = 6;
const EInvalidBp: u64 = 7;
const ENotEnoughFees: u64 = 8;
const EInvalidVoteForPost: u64 = 9;
const ENotVotedForPost: u64 = 10;
const EAlreadyClaimed: u64 = 11;

const POST_STATUS_PENDING: u8 = 0;
const POST_STATUS_SUCCESS: u8 = 1;
const POST_STATUS_FAILED: u8 = 2;
const POST_STATUS_NO_VOTES: u8 = 3;

//万分比
const BP_DECIMAL: u64 = 10000;

//TODO:待设置项
const CREATE_POST_FEE: u64 = 100_000_000;
const VOTE_VALUE: u64 = 100_000_000;
const REWARD_BENCHMARK: u64 = 2000; //20%

//=====Structs=====
public struct AdminCap has key {
    id: UID,
}

public struct Config has key {
    id: UID,
    create_post_fee: u64,
    vote_value: u64,
    reward_benchmark: u64,
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
    status: u8,
    votes_pool: Balance<SUI>,
    author_claimed: bool,
}

public struct CryptoVoteResult has store {
    key_servers: vector<address>,
    public_keys: vector<vector<u8>>,
    threshold: u8,
    voters: vector<address>,
    encrypted_votes: vector<EncryptedObject>,
}

public struct DerivedVoteResult has store {
    true_bp: u64,
    true_votes_count: u64,
    false_votes_count: u64,
}

public struct Account has key {
    id: UID,
    name: String,
    vote_profit: u64,
    author_profit: u64,
    owned_posts: vector<address>,
    //post_address -> support or against
    voted_posts: Table<address, bool>,
    //post_address -> claimed or not
    claimed_posts: vector<address>,
}

//=====Events=====
public struct CreateAccountEvent has copy, drop {
    user: address,
    account_address: address,
    name: String,
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
    vote: bool,
}

public struct PostSettleEvent has copy, drop {
    post: address,
    settle: address,
    status: u8,
}

public struct ClaimVoteRewardsEvent has copy, drop {
    post: address,
    vote: bool,
}

public struct ClaimVoteRewardsForAuthorEvent has copy, drop {
    post: address,
    author: address,
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

//=====Functions=====
fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::share_object(Config {
        id: object::new(ctx),
        create_post_fee: CREATE_POST_FEE,
        vote_value: VOTE_VALUE,
        reward_benchmark: REWARD_BENCHMARK,
    });
    transfer::share_object(Seer {
        id: object::new(ctx),
        accounts: vector::empty<address>(),
        posts: table::new(ctx),
        post_fees: balance::zero<SUI>(),
    });
}

public fun create_account(name: String, seer: &mut Seer, ctx: &mut TxContext) {
    let id = object::new(ctx);
    let address = object::uid_to_address(&id);
    let account = Account {
        id: id,
        name: name,
        vote_profit: 0,
        author_profit: 0,
        owned_posts: vector::empty<address>(),
        voted_posts: table::new(ctx),
        claimed_posts: vector::empty<address>(),
    };
    vector::push_back(&mut seer.accounts, address);
    transfer::transfer(account, ctx.sender()); // 改为 owned object
    event::emit(CreateAccountEvent {
        user: ctx.sender(),
        account_address: address,
        name: name,
    });
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
    transfer::share_object(Post {
        id,
        b36_address,
        blob_id,
        author: ctx.sender(),
        lasting_time,
        created_at: clock.timestamp_ms(),
        predicted_true_bp,
        true_bp: 0,
        true_votes_count: 0,
        false_votes_count: 0,
        status: POST_STATUS_PENDING,
        total_votes_value: 0,
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
    vote: bool,
    coin: Coin<SUI>,
    config: &Config,
    ctx: &mut TxContext,
) {
    let post_address = object::uid_to_address(&post.id);
    assert!(post.created_at + post.lasting_time > clock.timestamp_ms(), EInvalidVoteTime);
    assert!(!table::contains(&account.voted_posts, post_address), EAlreadyVoted);
    assert!(coin::value(&coin) == config.vote_value, EInvalidCoinValue);
    assert!(post.author != ctx.sender(), EVoteForPostAuthor);
    table::add(&mut account.voted_posts, post_address, vote);
    coin::put(&mut post.votes_pool, coin);
    post.total_votes_value = post.total_votes_value + config.vote_value;
    if (vote == true) {
        post.true_votes_count = post.true_votes_count + 1;
    } else {
        post.false_votes_count = post.false_votes_count + 1;
    };
    event::emit(VotePostEvent {
        post: post_address,
        user: ctx.sender(),
        account: object::uid_to_address(&account.id),
        vote: vote,
    });
}

public(package) fun settle_post(post: &mut Post, ctx: &mut TxContext) {
    if (post.true_votes_count + post.false_votes_count == 0) {
        post.status = POST_STATUS_NO_VOTES;
    } else {
        let true_bp = calculate_true_bp(post);
        post.true_bp = true_bp;
        if (true_bp > 5000) {
            post.status = POST_STATUS_SUCCESS;
        } else {
            post.status = POST_STATUS_FAILED;
        };
        event::emit(PostSettleEvent {
            post: object::uid_to_address(&post.id),
            settle: ctx.sender(),
            status: post.status,
        });
    };
}

//TODO:领取金额要改
#[allow(lint(self_transfer))]
public fun claim_vote_rewards(
    post: &mut Post,
    account: &mut Account,
    clock: &Clock,
    config: &Config,
    ctx: &mut TxContext,
) {
    assert!(post.created_at + post.lasting_time <= clock.timestamp_ms(), EInvalidSettleTime);
    let post_address = object::uid_to_address(&post.id);
    if (post.status == POST_STATUS_PENDING) {
        settle_post(post, ctx);
    };
    assert!(table::contains(&account.voted_posts, post_address), ENotVotedForPost);
    let account_vote = table::borrow(&account.voted_posts, post_address);
    assert!(!vector::contains(&account.claimed_posts, &post_address), EAlreadyClaimed);
    vector::push_back(&mut account.claimed_posts, post_address);
    let vote_reward = calculate_post_vote_reward(post, config, calculate_vote_delta(post));
    account.vote_profit = account.vote_profit + vote_reward;
    let coin = coin::take(&mut post.votes_pool, vote_reward, ctx);
    transfer::public_transfer(coin, ctx.sender());
    event::emit(ClaimVoteRewardsEvent {
        post: object::uid_to_address(&post.id),
        vote: *account_vote,
    });
}

//TODO:领取金额要改
#[allow(lint(self_transfer))]
public fun claim_vote_rewards_for_author(
    post: &mut Post,
    account: &mut Account,
    clock: &Clock,
    config: &Config,
    ctx: &mut TxContext,
) {
    assert!(post.created_at + post.lasting_time <= clock.timestamp_ms(), EInvalidSettleTime);
    if (post.status == POST_STATUS_PENDING) {
        settle_post(post, ctx);
    };
    // assert!(post.status != POST_STATUS_PENDING && post.status != POST_STATUS_NO_VOTES && post.disabled == false, EInvalidPostStatus);
    assert!(post.author == ctx.sender(), EInvalidPostAuthor);
    assert!(post.author_claimed == false, EAlreadyClaimed);
    let author_reward = calculate_post_author_reward(post, config, calculate_vote_delta(post));
    account.author_profit = account.author_profit + author_reward;
    post.author_claimed = true;
    let coin = coin::take(&mut post.votes_pool, author_reward, ctx);
    transfer::public_transfer(coin, ctx.sender());
    event::emit(ClaimVoteRewardsForAuthorEvent {
        post: object::uid_to_address(&post.id),
        author: post.author,
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
public fun calculate_post_author_reward(post: &Post, config: &Config, vote_delta: u64): u64 {
    let benchmark_value = (post.total_votes_value * config.reward_benchmark) / BP_DECIMAL;
    let total_count = post.false_votes_count + post.true_votes_count + 1;
    let author_reward = benchmark_value * (BP_DECIMAL - vote_delta) / (total_count * BP_DECIMAL);
    author_reward
}

public fun calculate_post_vote_reward(post: &Post, config: &Config, vote_delta: u64): u64 {
    let author_reward = calculate_post_author_reward(post, config, vote_delta);
    let votes_reward = post.total_votes_value - author_reward;
    let true_bp = calculate_true_bp(post);
    let mut vote_reward: u64 = 0;
    if (true_bp > 5000) {
        vote_reward = votes_reward / (post.true_votes_count);
    } else {
        vote_reward = votes_reward / (post.false_votes_count);
    };
    vote_reward
}

public fun calculate_vote_delta(post: &Post): u64 {
    if (post.true_bp > post.predicted_true_bp) {
        post.true_bp - post.predicted_true_bp
    } else {
        post.predicted_true_bp - post.true_bp
    }
}

public fun calculate_true_bp(post: &Post): u64 {
    let true_bp =
        post.true_votes_count * BP_DECIMAL / (post.true_votes_count + post.false_votes_count);
    true_bp
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
