"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isProfile = pathname === "/profile";
  const [selected, setSelected] = useState<"home" | "profile">("home");
  const currentAccount = useCurrentAccount();

  useEffect(() => {
    if (isHome) {
      setSelected("home");
    } else if (isProfile) {
      setSelected("profile");
    }
  }, [pathname]);

  const handleHeaderClick = (e: React.MouseEvent<HTMLElement>) => {
    // 如果点击的是链接、按钮或其他交互元素，不执行跳转
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    // 点击空白处跳转到首页
    router.push('/');
  };

  return (
    <div className="flex flex-col bg-black">
      <header 
        className="flex items-center justify-center relative px-4 py-4 pb-0 bg-white cursor-pointer"
        onClick={handleHeaderClick}
      >
      {/* <Image src="/logo/wal_2.png" alt="Seer" width={40} height={40} className="rounded-full"/> */}
        <div 
          className="flex items-center gap-24"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href="/"
            className={`font-cbyg text-3xl px-4 py-2 rounded-t-[12px] transition-colors ${
              selected === "home"
                ? "text-white bg-black shadow-sm"
                : "text-black bg-white shadow-sm"
            }`}
          >
            Home
          </Link>
          <Link
            href="/profile"
            className={`font-cbyg text-3xl px-4 py-2 rounded-t-[12px] transition-colors ${
              selected === "profile"
                ? "text-white bg-black shadow-sm"
                : "text-black bg-white shadow-sm"
            }`}
          >
            Profile
          </Link>
        </div>
        <div 
          className="absolute right-4 flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {currentAccount ? (
            <button className="font-cbyg text-3xl px-4 py-2 rounded-t-[12px] text-black bg-[#D9D9D9] shadow-sm">
              {`${currentAccount.address.slice(
                0,
                10
              )}..${currentAccount.address.slice(-2)}`}
            </button>
          ) : (
            <div className="relative group">
              <ConnectButton
                connectText="Connect Wallet"
                className="relative overflow-hidden bg-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-md"
                style={{
                  background: "#000000",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "20px",
                  fontFamily: "var(--font-cbyg)",
                  fontWeight: "400",
                  borderRadius: "12px",
                  padding: "10px 20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              />
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
