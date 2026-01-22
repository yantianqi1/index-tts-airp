import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 语音聊天",
  description: "具备语音合成能力的 LLM 聊天客户端",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
