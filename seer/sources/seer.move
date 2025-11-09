/*
/// Module: seer
module seer::seer;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions
module seer::seer;

use std::string::String;
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use sui::table::{Self, Table};
use sui::clock::{Clock};
use sui::coin::{Self, Coin};

const EInvalidVoteTime: u64 = 0;
const EAlreadyVoted: u64 = 1;
const EInvalidSettleTime: u64 = 2;
const EPostDisabled: u64 = 3;
const EInvalidCoinValue: u64 = 4;
const EInvalidPostStatus: u64 = 5;
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
const ALLOCATION_RATIO: u64 = 8000;

//禁用帖子
public struct AdminCap has key{
    id:UID,
}

public struct Config has key {
    id: UID,
    create_post_fee: u64,
    //帖子用户占奖池的比例
    allocation_ratio: u64,
}

public struct Registry has key {
    id: UID,
    //需要存吗？
    accounts: vector<address>,
    //owner -> post
    posts: Table<address, vector<address>>,
    post_fees: Balance<SUI>,
}

public struct Post has key {
    id: UID,
    blob_id: String,
    author: address,
    lasting_time: u64,
    created_at: u64,
    true_bp: u64,
    true_votes_count: u64,
    false_votes_count: u64,
    status: u8,
    votes_pool: Balance<SUI>,
    author_claimed: bool,
    disabled: bool,
}

public struct Account has key {
    id: UID,
    name: String,
    influence: u64,
    vote_profit: u64,
    author_profit: u64,
    owned_posts: vector<address>,
    //post_address -> support or against
    voted_posts: Table<address, bool>,
    //post_address -> claimed or not
    claimed_posts: vector<address>,
}

fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::share_object(Config {
        id: object::new(ctx),
        create_post_fee: CREATE_POST_FEE,
        allocation_ratio: ALLOCATION_RATIO,
    });
    transfer::share_object(Registry {
        id: object::new(ctx),
        accounts: vector::empty<address>(),
        posts: table::new(ctx),
        post_fees: balance::zero<SUI>(),
    });
}

public fun create_account(name: String, registry: &mut Registry, ctx: &mut TxContext) {
    let id = object::new(ctx);
    let address = object::uid_to_address(&id);
    let account = Account {
        id: id,
        name: name,
        influence: 0,
        vote_profit: 0,
        author_profit: 0,
        owned_posts: vector::empty<address>(),
        voted_posts: table::new(ctx),
        claimed_posts: vector::empty<address>(),
    };
    vector::push_back(&mut registry.accounts, address);
    transfer::share_object(account);
}

public fun create_post(author: address, blob_id: String, lasting_time: u64, true_bp: u64, account: &mut Account,registry: &mut Registry,coin: Coin<SUI>,clock: &Clock,config: &Config, ctx: &mut TxContext) {
    assert!(coin::value(&coin) == config.create_post_fee, EInvalidCoinValue);
    let id = object::new(ctx);
    let address = object::uid_to_address(&id);
    if(!table::contains(&registry.posts, author)) {
        table::add(&mut registry.posts, author, vector::empty<address>());
    };
    let posts = table::borrow_mut(&mut registry.posts, author);
    vector::push_back(posts, address);
    vector::push_back(&mut account.owned_posts, address);
    coin::put(&mut registry.post_fees, coin);
    transfer::share_object(Post {
        id,
        blob_id,
        author,
        lasting_time,
        created_at: clock.timestamp_ms(),
        true_bp,
        true_votes_count: 0,
        false_votes_count: 0,
        status: POST_STATUS_PENDING,
        votes_pool: balance::zero<SUI>(),
        disabled: false,
        author_claimed: false,
    });
}

public fun vote_post(post: &mut Post, account: &mut Account, clock: &Clock,vote: bool,coin: Coin<SUI>) {
    let post_address = object::uid_to_address(&post.id);
    assert!(post.created_at + post.lasting_time > clock.timestamp_ms(), EInvalidVoteTime);
    assert!(!table::contains(&account.voted_posts, post_address), EAlreadyVoted);
    assert!(post.disabled == false, EPostDisabled);
    assert!(coin::value(&coin) == VOTE_VALUE, EInvalidCoinValue);
    table::add(&mut account.voted_posts, post_address, vote);
    coin::put(&mut post.votes_pool, coin);
    if (vote == true) {
        post.true_votes_count= post.true_votes_count + 1;
    } else {
        post.false_votes_count= post.false_votes_count + 1;
    }
}

public fun settle_post(post: &mut Post, clock: &Clock) {
    assert!(post.created_at + post.lasting_time <= clock.timestamp_ms(), EInvalidSettleTime);
    assert!(post.status == POST_STATUS_PENDING && post.disabled == false, EInvalidPostStatus);
    if(post.true_votes_count + post.false_votes_count == 0) {
        post.status = POST_STATUS_NO_VOTES;
    }else{
    let true_bp = post.true_votes_count * BP_DECIMAL / (post.true_votes_count + post.false_votes_count);
    if (true_bp > post.true_bp) {
        post.status = POST_STATUS_SUCCESS;
    } else{
        post.status = POST_STATUS_FAILED;
    }
    };
}

#[allow(lint(self_transfer))]
public fun claim_vote_rewards(post: &mut Post, account: &mut Account, config: &Config, ctx: &mut TxContext) {
    let post_address = object::uid_to_address(&post.id);
    assert!(post.status != POST_STATUS_PENDING && post.status != POST_STATUS_NO_VOTES && post.disabled == false, EInvalidPostStatus);
    assert!(table::contains(&account.voted_posts, post_address), ENotVotedForPost);
    let account_vote = table::borrow(&account.voted_posts, post_address);
    let mut reward_users:u64 = 0;
    if(post.status == POST_STATUS_SUCCESS) {
        assert!(*account_vote == true, EInvalidVoteForPost);
        reward_users = post.true_votes_count;
    } else if(post.status == POST_STATUS_FAILED) {
        assert!(*account_vote == false, EInvalidVoteForPost);
        reward_users = post.false_votes_count;
    };
    assert!(!vector::contains(&account.claimed_posts, &post_address), EAlreadyClaimed);
    vector::push_back(&mut account.claimed_posts, post_address);
    let value = balance::value(&post.votes_pool);
    let vote_reward = value * config.allocation_ratio / (BP_DECIMAL * reward_users);
    account.vote_profit = account.vote_profit + vote_reward;
    let coin = coin::take(&mut post.votes_pool, vote_reward, ctx);
    transfer::public_transfer(coin, ctx.sender());
}

#[allow(lint(self_transfer))]
public fun claim_vote_rewards_for_author(post: &mut Post,account: &mut Account,config: &Config, ctx: &mut TxContext) {
    assert!(post.status != POST_STATUS_PENDING && post.status != POST_STATUS_NO_VOTES, EInvalidPostStatus);
    assert!(post.author == ctx.sender(), EInvalidPostAuthor);
    assert!(post.author_claimed == false, EAlreadyClaimed);
    assert!(post.disabled == false, EPostDisabled);
    let influence = post.true_votes_count + post.false_votes_count;
    let value = balance::value(&post.votes_pool);
    let vote_reward = value * (BP_DECIMAL - config.allocation_ratio) / BP_DECIMAL;
    account.author_profit = account.author_profit + vote_reward;
    account.influence = account.influence + influence;
    post.author_claimed = true;
    let coin = coin::take(&mut post.votes_pool, vote_reward, ctx);
    transfer::public_transfer(coin, ctx.sender());
}

#[allow(lint(self_transfer))]
public fun claim_create_post_fees(_: &AdminCap,registry: &mut Registry,values:u64, ctx: &mut TxContext) {
    let post_fees = balance::value(&registry.post_fees);
    assert!(post_fees >= values, ENotEnoughFees);
    let coin = coin::take(&mut registry.post_fees, values, ctx);
    transfer::public_transfer(coin, ctx.sender());
}

//settle
public fun manage_post(_: &AdminCap,post: &mut Post, status: bool) {
    post.disabled = status;
}

public fun update_allocation_ratio(_: &AdminCap, config: &mut Config, allocation_ratio: u64) {
    assert!(allocation_ratio <= BP_DECIMAL, EInvalidBp);
    config.allocation_ratio = allocation_ratio;
}

public fun update_create_post_fee(_: &AdminCap, config: &mut Config, create_post_fee: u64) {
    config.create_post_fee = create_post_fee;
}

//getter
public fun get_create_post_fee(config: &Config):u64 {
    config.create_post_fee
}

public fun get_allocation_ratio(config: &Config):u64 {
    config.allocation_ratio
}

public fun get_post_status(post: &Post):u8 {
    post.status
}

public fun get_post_author(post: &Post):address {
    post.author
}

public fun get_post_finish_time(post: &Post,clock: &Clock):u64 {
    let end_time = post.created_at + post.lasting_time;
    let current_time = clock.timestamp_ms();
    if (current_time >= end_time) {
        0
    } else {
        end_time - current_time
    }
}
