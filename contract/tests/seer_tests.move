#[test_only]
module seer::seer_tests {
    use std::string::{Self, String};
    use sui::test_scenario::{Self as ts};
    use sui::test_utils::assert_eq;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use seer::seer::{Self, AdminCap, Config, Seer, Post, Account};

    // 测试常量
    const ADMIN: address = @0xa;
    const USER1: address = @0x1;
    const USER2: address = @0x2;
    const USER3: address = @0x3;
    const AUTHOR: address = @0x4;

    const CREATE_POST_FEE: u64 = 100_000_000; // 0.1 SUI
    const VOTE_VALUE: u64 = 100_000_000; // 0.1 SUI
    const LASTING_TIME: u64 = 86400000; // 24小时（毫秒）
    const PREDICTED_TRUE_BP: u64 = 6000; // 预测60%的人会投赞成

    // ===== 辅助函数 =====

    /// 创建测试时钟
    fun create_clock_at_time(time: u64, ctx: &mut TxContext): Clock {
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, time);
        clock
    }

    /// 初始化测试环境
    fun setup_test(scenario: &mut ts::Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            seer::init_for_testing(ts::ctx(scenario));
        };
    }

    /// 创建账户的辅助函数
    fun create_test_account(scenario: &mut ts::Scenario, user: address, name: String) {
        ts::next_tx(scenario, user);
        {
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            seer::create_account(name, &mut seer_obj, ts::ctx(scenario));
            ts::return_shared(seer_obj);
        };
    }

    /// 创建帖子的辅助函数
    fun create_test_post(
        scenario: &mut ts::Scenario, 
        author: address, 
        blob_id: String,
        lasting_time: u64,
        predicted_true_bp: u64,
        current_time: u64
    ) {
        ts::next_tx(scenario, author);
        {
            let mut account = ts::take_from_sender<Account>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(current_time, ts::ctx(scenario));
            
            let coin = coin::mint_for_testing<SUI>(CREATE_POST_FEE, ts::ctx(scenario));
            
            seer::create_post(
                blob_id,
                lasting_time,
                predicted_true_bp,
                &mut account,
                &mut seer_obj,
                coin,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_to_sender(scenario, account);
            ts::return_shared(seer_obj);
            ts::return_shared(config);
        };
    }

    /// 投票的辅助函数
    fun vote_on_post(
        scenario: &mut ts::Scenario,
        voter: address,
        vote: bool,
        current_time: u64
    ) {
        ts::next_tx(scenario, voter);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(current_time, ts::ctx(scenario));
            
            let coin = coin::mint_for_testing<SUI>(VOTE_VALUE, ts::ctx(scenario));
            
            seer::vote_post(
                &mut post,
                &mut account,
                &clock,
                vote,
                coin,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
    }

    // ===== 基础功能测试 =====

    #[test]
    fun test_initialization() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        
        // 验证配置正确初始化
        ts::next_tx(scenario, ADMIN);
        {
            let config = ts::take_shared<Config>(scenario);
            assert_eq(seer::get_create_post_fee(&config), CREATE_POST_FEE);
            assert_eq(seer::get_reward_benchmark(&config), 2000); // 20%
            ts::return_shared(config);
        };
        
        // 验证 AdminCap 被转移给部署者
        ts::next_tx(scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(scenario);
            ts::return_to_sender(scenario, admin_cap);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_create_account() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, USER1, string::utf8(b"Alice"));
        
        // 验证账户创建成功
        ts::next_tx(scenario, USER1);
        {
            let account = ts::take_from_sender<Account>(scenario);
            ts::return_to_sender(scenario, account);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_create_post() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_post(
            scenario, 
            AUTHOR, 
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 验证帖子创建成功
        ts::next_tx(scenario, AUTHOR);
        {
            let post = ts::take_shared<Post>(scenario);
            assert_eq(seer::get_post_status(&post), 0); // PENDING
            assert_eq(seer::get_post_author(&post), AUTHOR);
            ts::return_shared(post);
        };
        
        ts::end(scenario_val);
    }

    // ===== 投票功能测试 =====
    #[test]
    fun test_vote_post_success() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // USER1 投赞成票
        vote_on_post(scenario, USER1, true, 2000);
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_multiple_votes() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));
        create_test_account(scenario, USER3, string::utf8(b"User3"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 多个用户投票
        vote_on_post(scenario, USER1, true, 2000);
        vote_on_post(scenario, USER2, true, 3000);
        vote_on_post(scenario, USER3, false, 4000);
        
        ts::end(scenario_val);
    }

    // ===== 结算和奖励测试 =====

    #[test]
    fun test_claim_vote_rewards() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 投票
        vote_on_post(scenario, USER1, true, 2000);
        vote_on_post(scenario, USER2, false, 3000);
        
        // 等待投票期结束后领取奖励
        ts::next_tx(scenario, USER1);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::claim_vote_rewards(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        // 验证收到奖励
        ts::next_tx(scenario, USER1);
        {
            let reward_coin = ts::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&reward_coin) > 0, 0);
            ts::return_to_sender(scenario, reward_coin);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_claim_author_rewards() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 投票
        vote_on_post(scenario, USER1, true, 2000);
        vote_on_post(scenario, USER2, true, 3000);
        
        // 作者领取奖励
        ts::next_tx(scenario, AUTHOR);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::claim_vote_rewards_for_author(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        // 验证收到奖励
        ts::next_tx(scenario, AUTHOR);
        {
            let reward_coin = ts::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&reward_coin) > 0, 0);
            ts::return_to_sender(scenario, reward_coin);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_post_success_status() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));
        create_test_account(scenario, USER3, string::utf8(b"User3"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 多数人投赞成票（超过50%）
        vote_on_post(scenario, USER1, true, 2000);
        vote_on_post(scenario, USER2, true, 3000);
        vote_on_post(scenario, USER3, false, 4000);
        
        // 结算后检查状态
        ts::next_tx(scenario, USER1);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::claim_vote_rewards(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            // 验证状态为 SUCCESS (1)
            assert_eq(seer::get_post_status(&post), 1);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_post_failed_status() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));
        create_test_account(scenario, USER3, string::utf8(b"User3"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 多数人投反对票（少于等于50%投赞成）
        vote_on_post(scenario, USER1, false, 2000);
        vote_on_post(scenario, USER2, false, 3000);
        vote_on_post(scenario, USER3, true, 4000);
        
        // 结算后检查状态
        ts::next_tx(scenario, USER1);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::claim_vote_rewards(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            // 验证状态为 FAILED (2)
            assert_eq(seer::get_post_status(&post), 2);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    // ===== 管理员功能测试 =====

    #[test]
    fun test_claim_create_post_fees() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 管理员领取创建帖子费用
        ts::next_tx(scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            
            seer::claim_create_post_fees(
                &admin_cap,
                &mut seer_obj,
                CREATE_POST_FEE,
                ts::ctx(scenario)
            );
            
            ts::return_to_sender(scenario, admin_cap);
            ts::return_shared(seer_obj);
        };
        
        // 验证收到费用
        ts::next_tx(scenario, ADMIN);
        {
            let fee_coin = ts::take_from_sender<Coin<SUI>>(scenario);
            assert_eq(coin::value(&fee_coin), CREATE_POST_FEE);
            ts::return_to_sender(scenario, fee_coin);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_update_reward_benchmark() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        
        ts::next_tx(scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(scenario);
            let mut config = ts::take_shared<Config>(scenario);
            
            let new_benchmark = 3000; // 30%
            seer::update_reward_benchmark(&admin_cap, &mut config, new_benchmark);
            
            assert_eq(seer::get_reward_benchmark(&config), new_benchmark);
            
            ts::return_to_sender(scenario, admin_cap);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_update_create_post_fee() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        
        ts::next_tx(scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(scenario);
            let mut config = ts::take_shared<Config>(scenario);
            
            let new_fee = 200_000_000; // 0.2 SUI
            seer::update_create_post_fee(&admin_cap, &mut config, new_fee);
            
            assert_eq(seer::get_create_post_fee(&config), new_fee);
            
            ts::return_to_sender(scenario, admin_cap);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    // ===== 错误情况测试 =====

    #[test]
    #[expected_failure(abort_code = seer::EInvalidCoinValue)]
    fun test_create_post_with_wrong_fee() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        
        ts::next_tx(scenario, AUTHOR);
        {
            let mut account = ts::take_from_sender<Account>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000, ts::ctx(scenario));
            
            // 错误的费用金额
            let coin = coin::mint_for_testing<SUI>(50_000_000, ts::ctx(scenario));
            
            seer::create_post(
                string::utf8(b"QmTest123"),
                LASTING_TIME,
                PREDICTED_TRUE_BP,
                &mut account,
                &mut seer_obj,
                coin,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_to_sender(scenario, account);
            ts::return_shared(seer_obj);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::EInvalidBp)]
    fun test_create_post_with_invalid_bp() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        
        ts::next_tx(scenario, AUTHOR);
        {
            let mut account = ts::take_from_sender<Account>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000, ts::ctx(scenario));
            
            let coin = coin::mint_for_testing<SUI>(CREATE_POST_FEE, ts::ctx(scenario));
            
            // 无效的基点（超过10000）
            seer::create_post(
                string::utf8(b"QmTest123"),
                LASTING_TIME,
                10001,
                &mut account,
                &mut seer_obj,
                coin,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_to_sender(scenario, account);
            ts::return_shared(seer_obj);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::EAlreadyVoted)]
    fun test_vote_twice() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        vote_on_post(scenario, USER1, true, 2000);
        
        // 尝试再次投票（应该失败）
        vote_on_post(scenario, USER1, false, 3000);
        
        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::EVoteForPostAuthor)]
    fun test_author_vote_own_post() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 作者尝试给自己的帖子投票（应该失败）
        vote_on_post(scenario, AUTHOR, true, 2000);
        
        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::EInvalidVoteTime)]
    fun test_vote_after_deadline() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 在截止时间之后投票（应该失败）
        vote_on_post(scenario, USER1, true, 1000 + LASTING_TIME + 1000);
        
        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::EAlreadyClaimed)]
    fun test_claim_rewards_twice() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        vote_on_post(scenario, USER1, true, 2000);
        
        // 第一次领取
        ts::next_tx(scenario, USER1);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::claim_vote_rewards(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        // 尝试第二次领取（应该失败）
        ts::next_tx(scenario, USER1);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 2000, ts::ctx(scenario));
            
            seer::claim_vote_rewards(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::EInvalidPostAuthor)]
    fun test_non_author_claim_author_rewards() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        vote_on_post(scenario, USER1, true, 2000);
        
        // USER1 尝试领取作者奖励（应该失败）
        ts::next_tx(scenario, USER1);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::claim_vote_rewards_for_author(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::ENotVotedForPost)]
    fun test_claim_without_voting() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        vote_on_post(scenario, USER1, true, 2000);
        
        // USER2 没有投票，尝试领取奖励（应该失败）
        ts::next_tx(scenario, USER2);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::claim_vote_rewards(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    // ===== 边界条件测试 =====

#[test]
    fun test_post_with_no_votes() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 等待投票期结束，没有任何人投票
        ts::next_tx(scenario, AUTHOR);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            // 作者尝试领取奖励，会触发结算
            seer::claim_vote_rewards_for_author(
                &mut post,
                &mut account,
                &clock,
                &config,
                ts::ctx(scenario)
            );
            
            // 验证状态为 NO_VOTES (3)
            assert_eq(seer::get_post_status(&post), 3);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_get_post_finish_time() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        // 检查剩余时间
        ts::next_tx(scenario, AUTHOR);
        {
            let post = ts::take_shared<Post>(scenario);
            let clock = create_clock_at_time(2000, ts::ctx(scenario));
            
            let remaining_time = seer::get_post_finish_time(&post, &clock);
            assert_eq(remaining_time, LASTING_TIME - 1000); // 1000到2000经过了1000ms
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
        };
        
        // 检查投票期结束后的时间
        ts::next_tx(scenario, AUTHOR);
        {
            let post = ts::take_shared<Post>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            let remaining_time = seer::get_post_finish_time(&post, &clock);
            assert_eq(remaining_time, 0); // 已经结束
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
        };
        
        ts::end(scenario_val);
    }

    #[test]
    fun test_reward_calculation_functions() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));
        
        create_test_post(
            scenario,
            AUTHOR,
            string::utf8(b"QmTest123"),
            LASTING_TIME,
            PREDICTED_TRUE_BP,
            1000
        );
        
        vote_on_post(scenario, USER1, true, 2000);
        vote_on_post(scenario, USER2, true, 3000);
        
        // 测试奖励计算函数
        ts::next_tx(scenario, AUTHOR);
        {
            let post = ts::take_shared<Post>(scenario);
            let config = ts::take_shared<Config>(scenario);
            
            let vote_delta = seer::calculate_vote_delta(&post);
            let true_bp = seer::calculate_true_bp(&post);
            let author_reward = seer::calculate_post_author_reward(&post, &config, vote_delta);
            let vote_reward = seer::calculate_post_vote_reward(&post, &config, vote_delta);
            
            // 验证基本计算
            assert_eq(true_bp, 10000); // 100% 投赞成
            assert!(author_reward > 0, 0);
            assert!(vote_reward > 0, 1);
            
            ts::return_shared(post);
            ts::return_shared(config);
        };
        
        ts::end(scenario_val);
    }
}
