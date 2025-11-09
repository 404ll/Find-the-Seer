import PostCard from './PostCard';
interface PostListProps {
    posts: {
        id: string;
        content: string;
        image?: string;
    }[];
}

export default function PostList({ posts }: PostListProps) {
    return (
        <div className='grid grid-cols-3 gap-4'>
            {posts.map((post) => (
                <PostCard key={post.id} {...post} />
            ))}
        </div>
    );
}