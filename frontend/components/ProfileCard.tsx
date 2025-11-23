import {
    Card,
    CardContent
  } from "@/components/ui/card"
import Image from "next/image";
import { User } from "@/types/display";

interface ProfileCardProps {
    user: User | null;
}
export default function ProfileCard({ user }: ProfileCardProps) {
    const totalVotes = user?.votedPosts?.length ?? 0;
    const totalPosts = user?.ownedPosts?.length ?? 0;
    const voteProfit = user?.voteProfit ?? 0;
    const authorProfit = user?.authorProfit ?? 0;
    const influence = user?.influence ?? 0;

    return (
        <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)]">
           
            <CardContent className="flex flex-col gap-8 text-white text-3xl font-cbyg">
                {/*斜体 */}
                <div className="flex flex-row items-center gap-3 pb-4 border-b border-white/10">
                    <Image
                        src="/icon/influence.svg"
                        alt="Seer"
                        width={32}
                        height={32}
                        className="invert opacity-80"
                    />
                    <span className="text-white/90 text-2xl font-cbyg italic tracking-wide">You are a real seer ?</span>
                </div>
                {/* <p>address: {walletAddress}</p> */}
                {/* <div className="flex flex-row items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                    <span className="text-gray-400 text-2xl">Influence:</span>
                    <u className="decoration-purple-500 decoration-2 underline-offset-4 text-white">{influence}</u>
                </div> */}
                <div className="flex flex-row items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                    <span className="text-gray-400 text-2xl">Total Votes:</span>
                    <u className="decoration-blue-500 decoration-2 underline-offset-4 text-white">{totalVotes}</u>
                </div>
                <div className="flex flex-row items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                    <span className="text-gray-400 text-2xl">Total Posts:</span>
                    <u className="decoration-pink-500 decoration-2 underline-offset-4 text-white">{totalPosts}</u>
                </div>
                <div className="flex flex-row items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                    <span className="text-gray-400 text-2xl">Vote Profit:</span>
                    <u className="decoration-green-500 decoration-2 underline-offset-4 text-white">{voteProfit}</u>
                </div>
                <div className="flex flex-row items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                    <span className="text-gray-400 text-2xl">Post Profit:</span>
                    <u className="decoration-yellow-500 decoration-2 underline-offset-4 text-white">{authorProfit}</u>
                </div>
            </CardContent>
        </Card>
    );
}