import { useEffect } from "react";
import { useState } from "react";

interface OwnPostCardProps {    
    content: string;
    createdAt: string;
    lastingTime: number;
}

export default function OwnPostCard({ content, createdAt, lastingTime }: OwnPostCardProps) {
    const now = new Date();
    const [status, setStatus] = useState<boolean>(false);
    useEffect(() => {
        if (now.getTime() > new Date(createdAt).getTime() + lastingTime) {
            setStatus(true);
        }
    }, [now, createdAt, lastingTime]);
    return (
        <div className='bg-black rounded-[12px] p-4 flex flex-col gap-4 hover:scale-105 transition-all duration-300'>
            <div className='flex flex-row justify-center items-center gap-4 text-white text-2xl font-cbyg'>
                <div>{content}</div>
                {status ? <div className="bg-[#679533] rounded-[8px] p-2 text-black text-xl font-cbyg">Now</div> : <div className="bg-[#BDBDBD] rounded-[8px] p-2 text-white text-xl font-cbyg">Close</div>}
            </div>
        </div>
    )};
        