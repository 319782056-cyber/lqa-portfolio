import "./globals.css";
import "./dashboard.css";

export const metadata = {
  title: "刘庆安｜经营数据分析作品集",
  description: "使用虚构模拟数据展示经营总览、产品、门店、区域、利润、用户、库存、渠道、数据质量和销售情景分析。",
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
