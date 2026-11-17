import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./dashboard.css";
const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]});
const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});
export const metadata:Metadata={title:"刘庆安｜经营数据分析作品集",description:"使用脱敏模拟数据展示经营总览、产品分析、门店分析、区域分析、数据质量和销售情景测算。",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body className={geistSans.variable+" "+geistMono.variable+" antialiased"}>{children}</body></html>;}
