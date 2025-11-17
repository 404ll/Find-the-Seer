import { Account, Post as RawPost } from "@/types/raw";
import { User, Post as DisplayPost, Post, PostStatus } from "@/types/display";
import { getPosts, getTableContentByGraphql } from "@/contracts/query";
import { Seer } from "@/types/raw";
import { DisplaySeer } from "@/types/display";
import { readUserPostContent } from "./walrus/download";
// import {readUserPostContent} from "./walrus/download";

const postContentCache = new Map<string, Promise<string>>();

async function getPostContentWithCache(blobId: string): Promise<string> {
  if (!postContentCache.has(blobId)) {
    const contentPromise = readUserPostContent(blobId).catch((error) => {
      postContentCache.delete(blobId);
      throw error;
    });
    postContentCache.set(blobId, contentPromise);
  }
  return postContentCache.get(blobId)!;
}

export function invalidatePostContentCache(blobIds?: string | string[]) {
  if (!blobIds) {
    postContentCache.clear();
    return;
  }

  const ids = Array.isArray(blobIds) ? blobIds : [blobIds];
  ids.forEach((id) => postContentCache.delete(id));
}
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

  const buildPostPromises = (postIds: string[]) =>
    postIds
      .map((postId) => postMap.get(postId))
      .filter((post): post is RawPost => post !== undefined)
      .map((post) => rawPostToDisplayPost(post));

  // 转换 owned_posts / voted_posts / claimed_posts
  const ownedPostsPromises = buildPostPromises(account.owned_posts);
  const votedPostsPromises = buildPostPromises(account.voted_posts);
  const claimedPostsPromises = buildPostPromises(account.claimed_posts);

  // 并行等待所有 posts 转换完成
  const [ownedPosts, votedPosts, claimedPosts] = await Promise.all([
    Promise.all(ownedPostsPromises),
    Promise.all(votedPostsPromises),
    Promise.all(claimedPostsPromises),
  ]);

  return {
    id: account.id.id,
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
  const trueRatio = Number(post.predicted_true_bp / 1000); //0-10范围
// 转换 status
  // status: 0 = Active, 1 = Closed, 2 = Verify 
  let status: PostStatus = PostStatus.Active;
  if (post.status === 1) {
    status = PostStatus.Closed;
  } else if (post.status === 2) {
    status = PostStatus.Verify;
  }

  // 转换时间戳为日期字符串
  let createdAt: string;
  let createdDate: Date;
  
  // 确保 created_at 是数字类型（BCS 解析可能返回字符串）
  const created_at_num = Number(post.created_at);
  
  if (created_at_num && created_at_num > 0 && !isNaN(created_at_num) && isFinite(created_at_num)) {
    createdDate = new Date(created_at_num);
    // 检查日期是否有效
    const timestamp = createdDate.getTime();
    if (!isNaN(timestamp) && timestamp > 0 && isFinite(timestamp)) {
      createdAt = createdDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } else {
      // 如果日期无效，使用当前日期作为默认值
      console.error("createdAt is invalid", {
        postId: post.id.id,
        created_at: post.created_at,
        created_at_num,
        timestamp,
        dateString: createdDate.toString()
      });
      createdDate = new Date();
      createdAt = createdDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
  } else {
    // 如果时间戳无效或为0，使用当前日期作为默认值
    console.warn("created_at is missing or invalid", {
      postId: post.id.id,
      created_at: post.created_at,
      created_at_num,
      isNaN: isNaN(created_at_num),
      isFinite: isFinite(created_at_num)
    });
    createdDate = new Date();
    createdAt = createdDate.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // 计算 deadline：createdAt + lastingTime
  const lasting_time_num = Number(post.lasting_time);
  const deadlineDate = new Date(createdDate.getTime() + lasting_time_num);
  const deadline = deadlineDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });


  const content = await getPostContentWithCache(post.blob_id);
  // const content =await readUserPostContent(post.blob_id);
  return {
    id: post.id.id, // 添加 Post ID
    content: content,
    createdAt,
    lastingTime: Number(post.lasting_time)/3600000,
    deadline,
    trueVotesCount,
    falseVotesCount,
    status,
    votecount: totalVotes,
    trueRatio
  };
}


export async function rawSeerToDisplaySeer(seer: Seer): Promise<DisplaySeer> {
  const userPosts = await getTableContentByGraphql(seer.posts_table_id);
  const postIds = Object.values(userPosts)
    .flat()
    .filter((id): id is string => Boolean(id));
  const uniquePostIds = Array.from(new Set(postIds));

  let displayPosts: Post[] = [];

  if (uniquePostIds.length > 0) {
    const rawPosts = await getPosts(uniquePostIds);
    const rawPostMap = new Map(rawPosts.map((post) => [post.id.id, post]));
    const orderedRawPosts = uniquePostIds
      .map((postId) => rawPostMap.get(postId))
      .filter((post): post is RawPost => Boolean(post));

    displayPosts = await Promise.all(
      orderedRawPosts.map((post) => rawPostToDisplayPost(post))
    );
  }
  
  const displaySeer: DisplaySeer = {
    id: seer.id,
    posts: displayPosts,
    accounts: seer.accounts,
    postFees: seer.post_fees,
  };
  console.log("displaySeer", displaySeer);
  return displaySeer;
}