import Image from 'next/image';

interface PostCardProps {
    content: string;
    image?: string;
}

export default function PostCard({ content, image }: PostCardProps) {
    console.log("image", image);
    return (
        <div className='bg-white rounded-[12px] p-4 flex flex-col gap-4'>
            <h1 className='text-black text-2xl font-cbyg text-center '>{content}</h1>
            <div className='flex justify-center'>
                {image && <Image src={image} alt="Post Image" width={100} height={100} />}
            </div>
            <hr className='border-black border-1' />
            <div className='flex justify-between'>
                <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl'>True</button>
                <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl'>False</button>
            </div>
        </div>
    );
}