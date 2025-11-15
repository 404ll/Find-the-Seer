import { Account, Post as RawPost } from "@/types/raw";
import { User, Post as DisplayPost, PostStatus } from "@/types/display";
import { getPosts } from "@/contracts/query";
import {readUserPostContent} from "./walrus/download";
/**
 * 将 Account (raw) 转换为 User (display)
 * 需要异步获取 posts 数据
 */
export async function accountToUser(account: Account): Promise<User> {
  // 获取所有相关的 posts
  const allPostIds = [
    ...account.owned_posts,
    ...account.voted_posts,
    ...account.claimed_posts,
  ];

  // 去重
  const uniquePostIds = Array.from(new Set(allPostIds));

  // 批量获取 posts
  const rawPosts = uniquePostIds.length > 0 ? await getPosts(uniquePostIds) : [];

  // 创建 postId 到 Post 的映射
  const postMap = new Map<string, RawPost>();
  rawPosts.forEach((post) => {
    postMap.set(post.id.id, post);
  });

  // 转换 owned_posts
  const ownedPostsPromises = account.owned_posts
    .map((postId) => postMap.get(postId))
    .filter((post): post is RawPost => post !== undefined)
    .map((post) => rawPostToDisplayPost(post));

  // 转换 voted_posts
  const votedPostsPromises = account.voted_posts
    .map((postId) => postMap.get(postId))
    .filter((post): post is RawPost => post !== undefined)
    .map((post) => rawPostToDisplayPost(post));

  // 转换 claimed_posts
  const claimedPostsPromises = account.claimed_posts
    .map((postId) => postMap.get(postId))
    .filter((post): post is RawPost => post !== undefined)
    .map((post) => rawPostToDisplayPost(post));

  // 并行等待所有 posts 转换完成
  const [ownedPosts, votedPosts, claimedPosts] = await Promise.all([
    Promise.all(ownedPostsPromises),
    Promise.all(votedPostsPromises),
    Promise.all(claimedPostsPromises),
  ]);

  return {
    id: account.id.id,
    name: account.name,
    voteProfit: account.vote_profit,
    authorProfit: account.author_profit,
    ownedPosts,
    votedPosts,
    claimedPosts,
  };
}

/**
 * 将 Post (raw) 转换为 Post (display)
 */
export async function rawPostToDisplayPost(post: RawPost): Promise<DisplayPost> {
  // 计算 true/false votes
  const trueVotesCount = post.derived_vote_result?.true_votes_count || 0;
  const falseVotesCount = post.derived_vote_result?.false_votes_count || 0;
  const totalVotes = trueVotesCount + falseVotesCount;

  // 计算 true/false ratio (1-9 范围)
  let trueFalseRatio = 5; // 默认值
  if (totalVotes > 0) {
    const trueRatio = trueVotesCount / totalVotes;
    // 将 0-1 的比例转换为 1-9 的范围
    trueFalseRatio = Math.round(trueRatio * 8) + 1;
  }

  // 转换 status
  // status: 0 = Active, 1 = Closed, 2 = Verify (根据你的业务逻辑调整)
  let status: PostStatus = PostStatus.Active;
  if (post.status === 1) {
    status = PostStatus.Closed;
  } else if (post.status === 2) {
    status = PostStatus.Verify;
  }

  // 转换时间戳为日期字符串
  // 验证时间戳是否有效（created_at 是毫秒时间戳）
  let createdAt: string;
  if (post.created_at && post.created_at > 0 && !isNaN(post.created_at)) {
    const date = new Date(post.created_at);
    // 检查日期是否有效
    if (!isNaN(date.getTime())) {
      createdAt = date.toISOString().split("T")[0];
    } else {
      // 如果日期无效，使用当前日期作为默认值
      createdAt = new Date().toISOString().split("T")[0];
    }
  } else {
    // 如果时间戳无效或为0，使用当前日期作为默认值
    createdAt = new Date().toISOString().split("T")[0];
  }

  const content =await readUserPostContent(post.blob_id);
  return {
    content: content,
    createdAt,
    lastingTime: post.lasting_time,
    trueVotesCount,
    falseVotesCount,
    status,
    votecount: totalVotes,
    trueFalseRatio,
  };
}

