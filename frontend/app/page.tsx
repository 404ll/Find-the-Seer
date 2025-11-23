"use client";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const currentAccount = useCurrentAccount();
  const router = useRouter();



  useEffect(() => {
    // 当钱包连接成功后，跳转到 home 页面
    if (currentAccount) {
      router.push('/home');
    }
  }, [currentAccount, router]);

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden selection:bg-purple-500/30">
      {/* Noise Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-10 mix-blend-overlay"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Background Graffiti Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-blue-900/20 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '1s'}} />
          
          {/* Floating Graffiti Elements */}
          <div className="absolute top-20 left-10 opacity-30 rotate-12 animate-float-slow">
            <Image src="/logo/wal_1.png" alt="Graffiti" width={300} height={300} className="object-contain mix-blend-screen" />
          </div>
          <div className="absolute bottom-20 right-10 opacity-30 -rotate-12 animate-float-delayed">
            <Image src="/logo/wal_3.png" alt="Graffiti" width={250} height={250} className="object-contain mix-blend-screen" />
          </div>
      </div>

      <div className="flex-grow flex flex-col items-center p-8 justify-center relative z-10">
        <div className="relative mb-16 group cursor-default">
            <h1 className="text-8xl md:text-9xl font-cbyg text-white relative z-10 mix-blend-difference tracking-tighter hover:skew-x-6 transition-transform duration-300">
              Find The Seer
            </h1>
            <div className="absolute inset-0 text-8xl md:text-9xl font-cbyg text-purple-500/50 blur-sm translate-x-2 translate-y-2 -z-10 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-300">
              Find The Seer
            </div>
            <div className="absolute inset-0 text-8xl md:text-9xl font-cbyg text-cyan-500/50 blur-sm -translate-x-2 -translate-y-2 -z-10 group-hover:-translate-x-4 group-hover:-translate-y-4 transition-transform duration-300">
              Find The Seer
            </div>
        </div>

        <h3 className="text-3xl md:text-4xl font-cbyg text-gray-400 mb-24 tracking-[0.2em] uppercase border-b-2 border-gray-800 pb-4 text-center max-w-2xl">
          No real prophets, <span className="text-white">just consensus</span>
        </h3>

        <div className="flex justify-center pb-16">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <ConnectButton
              connectText="Connect Wallet"
              className="relative"
              style={{
                background: "black",
                border: "2px solid white",
                color: "white",
                fontSize: "24px",
                fontFamily: "var(--font-cbyg)",
                fontWeight: "600",
                borderRadius: "0px",
                padding: "12px 32px",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            />
          </div>
        </div>
        
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8 justify-center items-center max-w-5xl opacity-60 grayscale hover:grayscale-0 transition-all duration-700'>
          {[1, 2, 5, 4].map((num, i) => (
             <div key={num} className="transform hover:scale-110 transition-transform duration-300 hover:rotate-3">
                <Image 
                  src={`/logo/wal_${num}.png`} 
                  alt={`Seer ${num}`} 
                  width={300} 
                  height={300} 
                  className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                />
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
