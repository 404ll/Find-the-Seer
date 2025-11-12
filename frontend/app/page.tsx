"use client";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSeer } from "@/contracts/query";

export default function Home() {
  const currentAccount = useCurrentAccount();
  const router = useRouter();


  useEffect(() => {
      getSeer().then((response) => {
        console.log(response);
    });
  }, []);


  useEffect(() => {
    // 当钱包连接成功后，跳转到 home 页面
    if (currentAccount) {
      router.push('/home');
    }
  }, [currentAccount, router]);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <div className="flex-grow flex flex-col items-center p-8 justify-center">
        <h1 className="text-8xl font-cbyg text-white mb-24">Find The Seer</h1>
        <h3 className="text-4xl font-cbyg text-white mb-24 tracking-wider">
          No real prophets, just consensus
        </h3>

        <div className="flex justify-center pb-8">
          <div className="relative group">
            <ConnectButton
              connectText="Connect Wallet"
              className="relative overflow-hidden bg-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-md"
              style={{
                background: "#FFFFFF",
                border: "none",
                color: "#000000",
                fontSize: "24px",
                fontFamily: "var(--font-cbyg)",
                fontWeight: "600",
                borderRadius: "12px",
                padding: "10px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            />
          </div>
        </div>
        <div className='grid grid-cols-4 gap-6 justify-center items-center'>
          <Image src="/logo/wal_1.png" alt="Seer" width={400} height={400} />
          <Image src="/logo/wal_2.png" alt="Seer" width={400} height={400} />
          <Image src="/logo/wal_5.png" alt="Seer" width={400} height={400} />
          <Image src="/logo/wal_4.png" alt="Seer" width={400} height={400} />
        </div>
      </div>
    </div>
  );
}
