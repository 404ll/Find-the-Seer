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
        <Card className="bg-white rounded-[12px] p-4 flex flex-col">
           
            <CardContent className="flex flex-col gap-10 text-black text-4xl font-cbyg">
                {/*斜体 */}
                <div className="flex flex-row items-center gap-2">
                    <Image
                        src="/icon/influence.svg"
                        alt="Seer"
                        width={30}
                        height={30}
                    />
                    <span className="text-black text-3xl font-cbyg italic">You are a real seer ?</span>
                    </div>
                {/* <p>address: {walletAddress}</p> */}
                <div className="flex flex-row items-center gap-2">
                    {/* <Image src="/icon/influence.svg" alt="Wallet Address" width={30} height={30} /> */}
                    <span>Influence: <u>{influence}</u></span>
                </div>
                <div className="flex flex-row items-center gap-2">
                    {/* <Image src="/icon/vote.svg" alt="Wallet Address" width={30} height={30} /> */}
                    <span>Total Votes: <u>{totalVotes}</u></span>
                </div>
                <div className="flex flex-row items-center gap-2">
                    {/* <Image src="/icon/posts.svg" alt="Wallet Address" width={30} height={30} /> */}
                    <span>Total Posts: <u>{totalPosts}</u></span>
                </div>
                <div className="flex flex-row items-center gap-2">
                    {/* <Image src="/icon/profit.svg" alt="Wallet Address" width={30} height={30} /> */}
                    <span>vote profit: <u>{voteProfit}</u></span>
                </div>
                <div className="flex flex-row items-center gap-2">
                    {/* <Image src="/icon/profit.svg" alt="Wallet Address" width={30} height={30} /> */}
                    <span>post profit: <u>{authorProfit}</u></span>
                </div>
            </CardContent>
        </Card>
    );
}