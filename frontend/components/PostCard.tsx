interface PostCardProps {
    content: string;
    image?: string;
}

export default function PostCard({ content, image }: PostCardProps) {
    return (
        <div className='bg-white rounded-[12px] p-4 flex flex-col gap-4'>
            <h1 className='text-black text-2xl font-cbyg text-center '>{content}</h1>
            {image && <img src={image} alt="Post Image" />}
            <hr className='border-black border-1' />
            <div className='flex justify-between'>
                <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl'>True</button>
                <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl'>False</button>
            </div>
        </div>
    );
}