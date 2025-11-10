import { Post } from '@/types/display';
import PostCard from './PostCard';
interface PostListProps {
    posts: Post[];
    onPostClick?: (post: Post) => void;
}

export default function PostList({ posts, onPostClick }: PostListProps) {
    return (
        <div className='grid grid-cols-3 gap-4'>
            {posts.map((post) => (
                <PostCard 
                    key={post.content} 
                    post={post} 
                    onClick={() => onPostClick?.(post)} 
                />
            ))}
        </div>
    );
}