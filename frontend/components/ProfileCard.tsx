import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
interface ProfileCardProps {
    walletAddress: string;
    influence: number;
    totalVotes: number;
    totalPosts: number;
    profit: number; 
}
export default function ProfileCard({ walletAddress, influence, totalVotes, totalPosts, profit }: ProfileCardProps) {
    return (
        <Card className="bg-white rounded-[12px] p-4 flex flex-col">
           
            <CardContent className="flex flex-col gap-6 text-black text-2xl font-cbyg">
                {/* <p>address: {walletAddress}</p> */}
                <p>Influence: {influence}</p>
                <p>Total Votes: {totalVotes}</p>
                <p>Total Posts: {totalPosts}</p>
                <p>Profit: {profit}</p>
            </CardContent>
        </Card>
    );
}