import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const firaSans = Fira_Sans({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-fira-sans',
});

const firaCode = Fira_Code({ 
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-fira-code',
});

export const metadata: Metadata = {
  title: "Voice AI Workbench",
  description: "All-in-One 语音 AI 工作台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${firaSans.variable} ${firaCode.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 transition-all duration-300">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
