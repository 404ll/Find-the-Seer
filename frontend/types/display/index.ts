export interface Post {
    content: string;
    createdAt: string;
    lastingTime: number;
    trueVotesCount: number;
    falseVotesCount: number;
    status: PostStatus;
    votecount: number;
    trueFalseRatio: number;
    // authorClaimed: boolean;
}

export interface CreatePostForm {
    epoch: number;
    trueRatio: number;
    falseRatio: number;
    content: string;
}

export interface ProfileCard {
    influence: number;
    totalVotes: number;
    totalPosts: number;
    voteProfit: number;
    postProfit: number;
}

export enum PostStatus {
    Active = 'Active', //投票中
    Closed = 'Closed', //已结束
    Verify = 'Verify', //等待验证
}

export interface User {
    id: string;
    name: string;
    voteProfit: number;
    authorProfit: number;
    ownedPosts: Post[];
    votedPosts: Post[];
    claimedPosts: Post[];
}