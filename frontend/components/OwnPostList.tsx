import OwnPostCard from './OwnPostCard';
interface OwnPostListProps {
    posts: {
        id: string;
        content: string;
        createdAt: string;
        lastingTime: number;
    }[];
    onPostClick?: (post: { content: string; verifier?: string; truthRatio?: string }) => void;
}
export default function OwnPostList({ posts, onPostClick }: OwnPostListProps) {
    return (
        <div className='grid grid-cols-2 gap-4 bg-white rounded-[12px] p-4'>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <OwnPostCard 
            key={post.id} 
            {...post} 
            onClick={() => onPostClick?.({ content: post.content })}
          />
        ))}
      </div>
    </div>
  );
}