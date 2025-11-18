import { Post } from '@/types/display';
import PostCard from './PostCard';
interface PostListProps {
    posts: Post[];
    onVotePost: (postId: string, vote_choice: boolean) => void;
    onVerifyPost: (postId: string) => void;
    onPostClick: (post: Post) => void;
}

export default function PostList({ posts, onPostClick, onVotePost, onVerifyPost }: PostListProps) {
    return (
        <div className='grid grid-cols-3 gap-4'>
            {posts.map((post) => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    onVotePost={onVotePost}
                    onClick={() => onPostClick(post)} 
                    onVerifyPost={onVerifyPost}
                />
            ))}
        </div>
    );
}