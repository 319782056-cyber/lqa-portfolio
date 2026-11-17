import "./globals.css";
import "./dashboard.css";

export const metadata = {
  title: "刘庆安｜经营数据分析作品集",
  description: "使用脱敏模拟数据展示经营总览、产品分析、门店分析、区域分析、数据质量和销售情景测算。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
