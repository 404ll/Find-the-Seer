'use client';

import Navbar from "@/components/Navbar";
import OwnPostList from "@/components/OwnPostList";
import ProfileCard from "@/components/ProfileCard";
import NowPostModal from "@/components/NowPostModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ClosePostModal from "@/components/ClosePostModal";
import CreatePostForm from "@/components/CreatePostForm";
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
            lastingTime: 0,
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreatePostFormOpen, setIsCreatePostFormOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<{
        content: string;
        verifier?: string;
        truthRatio?: string;
        reward?: string;
        trueVotesCount?: number;
        falseVotesCount?: number;
    } | null>(null);

    const handleOpenModal = (post: { content: string; verifier?: string; truthRatio?: string }) => {
        setSelectedPost(post);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPost(null);
    };

    const handleOpenCreatePostForm = () => {
        setIsCreatePostFormOpen(true);
    };
    const handleCloseCreatePostForm = () => {
        setIsCreatePostFormOpen(false);
    };
    return (
        <div className="min-h-screen flex flex-col bg-black relative">
            <Navbar />

            <div className="flex flex-row items-center justify-between px-8 py-14">
                <ProfileCard {...mockData} />
                <OwnPostList 
                    posts={mockData.posts} 
                    onPostClick={handleOpenModal}
                />
            </div>

            <div className="flex flex-row items-center justify-end px-8 py-14">
                <Button onClick={handleOpenCreatePostForm} className="bg-white text-black rounded-[12px] p-2 font-cbyg text-4xl">Create New</Button>
            </div>

            {/* {selectedPost && (
                <NowPostModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    content={selectedPost.content}
                    verifier={selectedPost.verifier}
                    truthRatio={selectedPost.truthRatio}
                />
            )} */}
            {selectedPost && (
                <ClosePostModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    content={selectedPost.content}
                    verifier={selectedPost.verifier || ""}
                    truthRatio={selectedPost.truthRatio || ""}
                    reward={selectedPost.reward || ""}
                    trueVotesCount={selectedPost.trueVotesCount || 10}
                    falseVotesCount={selectedPost.falseVotesCount || 1}
                />
            )}
            {isCreatePostFormOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <CreatePostForm onClose={handleCloseCreatePostForm} />
                </div>
            )}
        </div>
    );
}