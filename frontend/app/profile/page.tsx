'use client';

import Navbar from "@/components/Navbar";
import OwnPostList from "@/components/OwnPostList";
import ProfileCard from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
const mockData = {
    walletAddress: "0x1234567890123456789012345678901234567890",
    influence: 100,
    totalVotes: 100,
    totalPosts: 100,
    profit: 100,
    posts: [
        {
            id: "1",
            content: "The world is ending",
            createdAt: "2025-01-01",
            lastingTime: 100,
        },
        {
            id: "2",
            content: "The world is ending",
            createdAt: "2025-01-01",
            lastingTime: 100,
        },
        {
            id: "3",
            content: "The world is ending",
            createdAt: "2025-01-01",
            lastingTime: 100,
        },
        {
            id: "4",
            content: "The world is ending",
            createdAt: "2025-01-01",
            lastingTime: 100,
        },
        {
            id: "5",
            content: "The world is ending",
            createdAt: "2025-01-01",
            lastingTime: 100,
        },
        {
            id: "6",
            content: "The world is ending",
            createdAt: "2025-01-01",
            lastingTime: 100,
        },
    ],
}
export default function ProfilePage() {
    return (
        <div className="min-h-screen flex flex-col bg-black relative">
            <Navbar />

            <div className="flex flex-row items-center justify-between px-8 py-14">
                <ProfileCard {...mockData} />
                <OwnPostList posts={mockData.posts} />
            </div>

            <div className="flex flex-row items-center justify-end px-8 py-14">
                <Button className="bg-white text-black rounded-[12px] p-2 font-cbyg text-4xl">Create New</Button>
            </div>
        </div>
    );
}