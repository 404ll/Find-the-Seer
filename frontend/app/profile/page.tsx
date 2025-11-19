'use client';

import Navbar from "@/components/Navbar";
import OwnPostList from "@/components/OwnPostList";
import ProfileCard from "@/components/ProfileCard";
import NowPostModal from "@/components/NowPostModal";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ClosePostModal from "@/components/ClosePostModal";
import CreatePostForm from "@/components/CreatePostForm";
import Image from "next/image";
import { Post } from "@/types/display";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useUser } from "@/context/UserContext";
import { createAccountAndPost, createPost } from "@/contracts/call";
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx";
import { toast } from "sonner";



export default function ProfilePage() {
    const currentAccount = useCurrentAccount();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreatePostFormOpen, setIsCreatePostFormOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const { user, isLoading, error, refreshUser } = useUser();
    
    // 当 currentAccount 变化时，自动获取账户信息
    useEffect(() => {
        if (currentAccount) {
            refreshUser(currentAccount.address);
        }
    }, [currentAccount]);
    
    const {handleSignAndExecuteTransaction: createPostTx} = useBetterSignAndExecuteTransaction({ tx: createPost});
    const {handleSignAndExecuteTransaction: createAccountAndPostTx} = useBetterSignAndExecuteTransaction({ tx: createAccountAndPost});

    const handleCreatePost = (blobId: string, lastingTime: number, predictedTrueBp: number) => {
        if (!currentAccount) {
            console.error("Current account not found");
            return;
        }
        if (!user) {
            createAccountAndPostTx({ address: currentAccount.address, blobId, lastingTime, predictedTrueBp }).onSuccess(() => {
                console.log("Account and post created successfully");
                refreshUser(currentAccount.address);
                toast.success("Account and post created successfully");
            }).onError((error) => {
                console.error(error);
                toast.error("Account and post creation failed");
            }).execute();
            return;
        }
        console.log("user.id", user.id);
        createPostTx({ address: currentAccount.address, blobId, lastingTime, predictedTrueBp, accountId: user.id }).onSuccess(() => {
            console.log("Post created successfully");
            refreshUser(currentAccount.address);
            toast.success("Post created successfully");
        }).onError((error) => {
            console.error(error);
            toast.error("Post creation failed");
        }).execute();
    };

    const handleOpenModal = (post: Post) => {
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
        <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
            {/* 背景装饰元素 */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* 左上角装饰 */}
                <div className="absolute top-20 left-10 opacity-60">
                    <Image src="/logo/wal_1.png" alt="Decoration" width={150} height={150} className="object-contain" />
                </div>
                {/* 右上角装饰 */}
                <div className="absolute top-32 right-20 opacity-60">
                    <Image src="/logo/wal_3.png" alt="Decoration" width={120} height={120} className="object-contain" />
                </div>
                {/* 左下角装饰 */}
                <div className="absolute bottom-40 left-16 opacity-60">
                    <Image src="/logo/wal_4.png" alt="Decoration" width={100} height={100} className="object-contain" />
                </div>
                {/* 中间右侧装饰 */}
                <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-60">
                    <Image src="/logo/wal_5.png" alt="Decoration" width={130} height={130} className="object-contain" />
                </div>
                {/* 渐变效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30"></div>
            </div>

            <div className="relative z-10">
                <Navbar />
            </div>

            <div className="flex flex-row items-center justify-center px-8 pt-20 gap-12 relative z-10">
                <ProfileCard user={user} />
                <OwnPostList 
                    posts={user?.ownedPosts ?? []} 
                    onPostClick={(post) => handleOpenModal(post)}
                />
            </div>
           

            <div className="flex flex-row items-center justify-end px-8 relative z-10">
            <Image src="/logo/wal_2.png" alt="Seer" width={200} height={200} />
                <Button onClick={handleOpenCreatePostForm} className="bg-white text-black rounded-[12px] p-2 font-cbyg text-4xl">Create New</Button>
            </div>

            {selectedPost && (
                <>
                    {selectedPost.status === 'Closed' ? (
                        <ClosePostModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                            post={selectedPost}
                        />
                    ) : (
                        <NowPostModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                            post={selectedPost}
                        />
                    )}
                </>
            )}
            {isCreatePostFormOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <CreatePostForm onClose={handleCloseCreatePostForm} onCreate={handleCreatePost} />
                </div>
            )}
        </div>
    );
}