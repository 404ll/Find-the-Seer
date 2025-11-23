"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
export default function Navbar() {  
    const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isProfile = pathname === "/profile";
  const [selected, setSelected] = useState<"home" | "profile">("home");

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
          <div className="flex flex-col w-full z-50">
      <header 
        className="flex items-center justify-center relative px-4 py-6 bg-transparent cursor-pointer"
        onClick={handleHeaderClick}
      >
      {/* <Image src="/logo/wal_2.png" alt="Seer" width={40} height={40} className="rounded-full"/> */}
        <div 
          className="flex items-center gap-16 md:gap-24 bg-black/40 backdrop-blur-md px-8 py-2 rounded-full border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href="/home"
            className={`font-cbyg text-2xl md:text-3xl px-4 py-1 transition-all duration-300 relative group ${
              selected === "home"
                ? "text-white scale-110"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Home
            {selected === "home" && (
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
            )}
          </Link>
          <Link
            href="/profile"
            className={`font-cbyg text-2xl md:text-3xl px-4 py-1 transition-all duration-300 relative group ${
              selected === "profile"
                ? "text-white scale-110"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Profile
            {selected === "profile" && (
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
            )}
          </Link>
        </div>
        <div 
          className="absolute right-4 md:right-8 flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
        
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-200 pointer-events-none"></div>
              <ConnectButton
                connectText="Connect"
                className="relative z-10"
                style={{
                  background: "black",
                  border: "1px solid #333",
                  color: "white",
                  fontSize: "18px",
                  fontFamily: "var(--font-cbyg)",
                  fontWeight: "400",
                  borderRadius: "8px",
                  padding: "8px 20px",
                  position: "relative",
                }}
              />
            </div>
          
        </div>
      </header>
        </div>
    );
}
