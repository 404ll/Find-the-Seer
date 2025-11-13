#[test_only]
module seer::seer_tests {
    use std::string::{Self, String};
    use sui::test_scenario::{Self as ts};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self};
    use seal::bf_hmac_encryption::parse_encrypted_object;
    use sui::sui::SUI;
    use std::debug;
    use seer::seer::{Self, Config, Seer, Post, Account};

    // 测试常量 - 必须与加密数据匹配
    const ADMIN: address = @0xa;
    const AUTHOR: address = @0x1;  // ← 对应 encrypted_vote_1 的 AAD
    const USER1: address = @0x2;   // ← 对应 encrypted_vote_2 的 AAD
    const USER2: address = @0x3;   // ← 对应 encrypted_vote_3 的 AAD

    const CREATE_POST_FEE: u64 = 100_000_000;
    const VOTE_VALUE: u64 = 100_000_000;
    const LASTING_TIME: u64 = 86400000;
    const PREDICTED_TRUE_BP: u64 = 6000;

    // 固定的密钥服务器地址（来自 voting.move 测试）
    const KEY_SERVER_0: address = @0x34401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab96;
    const KEY_SERVER_1: address = @0xd726ecf6f7036ee3557cd6c7b93a49b231070e8eecada9cfa157e40e3f02e5d3;
    const KEY_SERVER_2: address = @0xdba72804cc9504a82bbaa13ed4a83a0e2c6219d7e45125cf57fd10cbab957a97;

    // ===== 辅助函数 =====

    fun create_clock_at_time(time: u64, ctx: &mut TxContext): Clock {
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, time);
        clock
    }

    fun setup_test(scenario: &mut ts::Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            seer::init_for_testing(ts::ctx(scenario));
        };
    }

    fun create_test_account(scenario: &mut ts::Scenario, user: address, name: String) {
        ts::next_tx(scenario, user);
        {
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            seer::create_account(name, &mut seer_obj, ts::ctx(scenario));
            ts::return_shared(seer_obj);
        };
    }

    // ===== 测试用例 =====

    #[test]
    fun test_encrypted_voting_full_flow() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;

        setup_test(scenario);

        // ===== 密钥服务器配置（使用固定的公钥）=====
        let pk0 = x"a58bfa576a8efe2e2730bc664b3dbe70257d8e35106e4af7353d007dba092d722314a0aeb6bca5eed735466bbf471aef01e4da8d2efac13112c51d1411f6992b8604656ea2cf6a33ec10ce8468de20e1d7ecbfed8688a281d462f72a41602161";
        let pk1 = x"a9ce55cfa7009c3116ea29341151f3c40809b816f4ad29baa4f95c1bb23085ef02a46cf1ae5bd570d99b0c6e9faf525306224609300b09e422ae2722a17d2a969777d53db7b52092e4d12014da84bffb1e845c2510e26b3c259ede9e42603cd6";
        let pk2 = x"93b3220f4f3a46fb33074b590cda666c0ebc75c7157d2e6492c62b4aebc452c29f581361a836d1abcbe1386268a5685103d12dec04aadccaebfa46d4c92e2f2c0381b52d6f2474490d02280a9e9d8c889a3fce2753055e06033f39af86676651";

        // ===== 创建账户 =====
        create_test_account(scenario, ADMIN, string::utf8(b"Admin"));  // ← ADMIN 创建帖子
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));
        create_test_account(scenario, USER1, string::utf8(b"User1"));
        create_test_account(scenario, USER2, string::utf8(b"User2"));

        // ===== 创建帖子（由 ADMIN 创建，这样 AUTHOR 可以投票）=====
        ts::next_tx(scenario, ADMIN);  // ← 改为 ADMIN
        {
            let mut account = ts::take_from_sender<Account>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000, ts::ctx(scenario));
            
            let coin = coin::mint_for_testing<SUI>(CREATE_POST_FEE, ts::ctx(scenario));
            
            // ✅ 使用固定的密钥服务器地址（与加密数据匹配）
            seer::create_post(
                string::utf8(b"QmTest123"),
                LASTING_TIME,
                PREDICTED_TRUE_BP,
                vector[KEY_SERVER_0, KEY_SERVER_1, KEY_SERVER_2],  // ✅ 固定地址
                vector[pk0, pk1, pk2],
                2,
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

        // ===== AUTHOR (@0x1) 投赞成票 =====
        ts::next_tx(scenario, AUTHOR);  // ✅ AUTHOR = @0x1（encrypted_vote_1 的 AAD）
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(2000, ts::ctx(scenario));
            
            let coin = coin::mint_for_testing<SUI>(VOTE_VALUE, ts::ctx(scenario));
            
            let encrypted_vote_1 = x"0000000000000000000000000000000000000000000000000000000000000000002075c3360eb19fd2c20fbba5e2da8cf1a39cdb1ee913af3802ba330b852e459e0503034401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab9601d726ecf6f7036ee3557cd6c7b93a49b231070e8eecada9cfa157e40e3f02e5d302dba72804cc9504a82bbaa13ed4a83a0e2c6219d7e45125cf57fd10cbab957a97030200a5f116cadc50530e4b2987a3ac183f121650367e0021e357d960de848c6c61de7331e2e65534ebf94508c006464bdd8406690c5034b8ae7dea889e17f32e340767ff940fa7c1e01c0b43214be17cf5020a87e3a72a99f6bab70c6c08b269a04803463655be2ed5e10556188e085081b1a0415e002b52be9386d66dfa175308173faca55f4e7aeab0559b973aec811a169bba82e873a3c2e176e9d3161d1848e55382a289975348f2aa52edcd1f908baf66bfd75e54826a50333df65c4ecb3088ec7bed6b11ca4c03586ad6a2cadb1e379d33d2a65212e5457a65c3b69ad8e66ba00101b8012000000000000000000000000000000000000000000000000000000000000000019282326a203b08b24b508107f23ed98c306ee73cc04f228a66bdefd5e9f44cb6";
            let encrypted_vote = parse_encrypted_object(encrypted_vote_1);
            // debug::print(encrypted_vote.aad().borrow());
            debug::print(encrypted_vote.id());
            debug::print(&post);
            seer::vote_post(
                &mut post,
                &mut account,
                &clock,
                encrypted_vote_1,
                coin,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };

        // ===== USER1 (@0x2) 投反对票 =====
        ts::next_tx(scenario, USER1);  // ✅ USER1 = @0x2
        {
            let mut post = ts::take_shared<Post>(scenario);
            let mut account = ts::take_from_sender<Account>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(3000, ts::ctx(scenario));
            
            let coin = coin::mint_for_testing<SUI>(VOTE_VALUE, ts::ctx(scenario));
            
            // encrypted_vote_2 的 AAD = @0x2，所以由 USER1 投票
            let encrypted_vote_2 = x"0000000000000000000000000000000000000000000000000000000000000000002075c3360eb19fd2c20fbba5e2da8cf1a39cdb1ee913af3802ba330b852e459e0503034401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab9601d726ecf6f7036ee3557cd6c7b93a49b231070e8eecada9cfa157e40e3f02e5d302dba72804cc9504a82bbaa13ed4a83a0e2c6219d7e45125cf57fd10cbab957a9703020094febd743a9da981328deba26dd19f39d145bae4e131e9839db2101b76ea04342b302d95b4bf8ff9f5530376ee73206800d0902e622c7b7adb32a9fe4530fd27a12d40dfaaf89e71f513f44cd30dc133c8a9a4bc6df5b51a0f3dc0a393cea8e2032d4e5e1b74730b57af98e254b7a747a6be31370151d020681c545966377937969a3db369ac061c3432cdc84f0e83091277de81c0c3d79ed90a96d3dc37ab074cef24780ee29bc2a23c1af069fd4d0bb364209937f7de7890a0ddeca441f61afc546378d006a4e72d65515c2d4f5aff1a6e4262f72200159ce7c62c11588cae8f0101d1012000000000000000000000000000000000000000000000000000000000000000024832a280c8ceba7aba3311045889f0ffb8911172ef9f0481174863509afeaf23";
            
            seer::vote_post(
                &mut post,
                &mut account,
                &clock,
                encrypted_vote_2,
                coin,
                &config,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
            ts::return_to_sender(scenario, account);
            ts::return_shared(config);
        };

        // ===== 解密（使用固定的派生密钥）=====
        ts::next_tx(scenario, ADMIN);
        {
            let mut post = ts::take_shared<Post>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            let dk0 = x"a24161c1c8398aac9942aed38e9ad9c923f033f75f067f8a3a511f313d03e2b722671a01f20d9d56ae30913994190a5b";
            let dk1 = x"b1ecf1d8da591deac2cf271048a327cb731809e0187ae8bcd54c79e92bf58c7b96e415eb1dbe62b6ced54de3197b249b";
            
            seer::decrypt_and_settle_crypto_vote(
                &mut post,
                vector[dk0, dk1],
                vector[KEY_SERVER_0, KEY_SERVER_1],  // ✅ 使用固定地址
                &clock,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
        };

        // ===== 验证结果 =====
        ts::next_tx(scenario, ADMIN);
        {
            let post = ts::take_shared<Post>(scenario);
            let status = seer::get_post_status(&post);
            // 验证状态已更新（不再是 PENDING=0）
            assert!(status != 0, 1);
            ts::return_shared(post);
        };

        ts::end(scenario_val);
    }

    // ===== 简化测试：只测试配置 =====
    #[test]
    fun test_create_post_with_crypto_config() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;

        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));

        let pk0 = x"a58bfa576a8efe2e2730bc664b3dbe70257d8e35106e4af7353d007dba092d722314a0aeb6bca5eed735466bbf471aef01e4da8d2efac13112c51d1411f6992b8604656ea2cf6a33ec10ce8468de20e1d7ecbfed8688a281d462f72a41602161";
        let pk1 = x"a9ce55cfa7009c3116ea29341151f3c40809b816f4ad29baa4f95c1bb23085ef02a46cf1ae5bd570d99b0c6e9faf525306224609300b09e422ae2722a17d2a969777d53db7b52092e4d12014da84bffb1e845c2510e26b3c259ede9e42603cd6";
        let pk2 = x"93b3220f4f3a46fb33074b590cda666c0ebc75c7157d2e6492c62b4aebc452c29f581361a836d1abcbe1386268a5685103d12dec04aadccaebfa46d4c92e2f2c0381b52d6f2474490d02280a9e9d8c889a3fce2753055e06033f39af86676651";

        ts::next_tx(scenario, AUTHOR);
        {
            let mut account = ts::take_from_sender<Account>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000, ts::ctx(scenario));
            
            let coin = coin::mint_for_testing<SUI>(CREATE_POST_FEE, ts::ctx(scenario));
            
            seer::create_post(
                string::utf8(b"QmTest123"),
                LASTING_TIME,
                PREDICTED_TRUE_BP,
                vector[KEY_SERVER_0, KEY_SERVER_1, KEY_SERVER_2],
                vector[pk0, pk1, pk2],
                2,
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

        // 验证帖子创建成功
        ts::next_tx(scenario, ADMIN);
        {
            let post = ts::take_shared<Post>(scenario);
            let status = seer::get_post_status(&post);
            assert!(status == 0, 1);  // PENDING 状态
            ts::return_shared(post);
        };

        ts::end(scenario_val);
    }

    // ===== 测试 seal_approve =====
    #[test]
    fun test_seal_approve_after_end_time() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;

        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));

        let pk0 = x"a58bfa576a8efe2e2730bc664b3dbe70257d8e35106e4af7353d007dba092d722314a0aeb6bca5eed735466bbf471aef01e4da8d2efac13112c51d1411f6992b8604656ea2cf6a33ec10ce8468de20e1d7ecbfed8688a281d462f72a41602161";

        ts::next_tx(scenario, AUTHOR);
        {
            let mut account = ts::take_from_sender<Account>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000, ts::ctx(scenario));
            let coin = coin::mint_for_testing<SUI>(CREATE_POST_FEE, ts::ctx(scenario));
            
            seer::create_post(
                string::utf8(b"QmTest"),
                LASTING_TIME,
                PREDICTED_TRUE_BP,
                vector[KEY_SERVER_0],
                vector[pk0],
                1,
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

        // 在投票期结束后调用 seal_approve（应该成功）
        ts::next_tx(scenario, ADMIN);
        {
            let post = ts::take_shared<Post>(scenario);
            let clock = create_clock_at_time(1000 + LASTING_TIME + 1000, ts::ctx(scenario));
            
            seer::seal_approve(&post, &clock);
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
        };

        ts::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = seer::ENoAccess)]
    fun test_seal_approve_before_end_time() {
        let mut scenario_val = ts::begin(ADMIN);
        let scenario = &mut scenario_val;

        setup_test(scenario);
        create_test_account(scenario, AUTHOR, string::utf8(b"Author"));

        let pk0 = x"a58bfa576a8efe2e2730bc664b3dbe70257d8e35106e4af7353d007dba092d722314a0aeb6bca5eed735466bbf471aef01e4da8d2efac13112c51d1411f6992b8604656ea2cf6a33ec10ce8468de20e1d7ecbfed8688a281d462f72a41602161";

        ts::next_tx(scenario, AUTHOR);
        {
            let mut account = ts::take_from_sender<Account>(scenario);
            let mut seer_obj = ts::take_shared<Seer>(scenario);
            let config = ts::take_shared<Config>(scenario);
            let clock = create_clock_at_time(1000, ts::ctx(scenario));
            let coin = coin::mint_for_testing<SUI>(CREATE_POST_FEE, ts::ctx(scenario));
            
            seer::create_post(
                string::utf8(b"QmTest"),
                LASTING_TIME,
                PREDICTED_TRUE_BP,
                vector[KEY_SERVER_0],
                vector[pk0],
                1,
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

        // 在投票期内调用 seal_approve（应该失败）
        ts::next_tx(scenario, ADMIN);
        {
            let post = ts::take_shared<Post>(scenario);
            let clock = create_clock_at_time(2000, ts::ctx(scenario));  // 投票期内
            
            seer::seal_approve(&post, &clock);  // 应该 abort
            
            clock::destroy_for_testing(clock);
            ts::return_shared(post);
        };

        ts::end(scenario_val);
    }
}
