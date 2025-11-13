import localFont from "next/font/local";

export const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// 使用本地 Geist 字体替代 Inter，避免 Google Fonts 网络请求超时
export const inter = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
  weight: "100 900",
});

export const cbyg = localFont({
  src: "./fonts/DynaPuff-Regular.ttf",
  variable: "--font-cbyg",
  weight: "400",
})
