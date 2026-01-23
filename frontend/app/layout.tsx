'use client';

import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { useGlobalStore } from "@/store/useGlobalStore";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { sidebarCollapsed } = useGlobalStore();

  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <title>声音工坊 - Voice Workshop</title>
      </head>
      <body className={`${firaSans.variable} ${firaCode.variable} font-sans bg-zinc-50 text-slate-800 antialiased`}>
        {/* Breathing Ambient Blobs - Creates the "Summer Glaze" atmosphere */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {/* Pink blob - top right */}
          <div
            className="blob blob-pink hidden sm:block"
            style={{
              width: '600px',
              height: '600px',
              top: '-10%',
              right: '-5%',
            }}
          />
          {/* Yellow blob - bottom left */}
          <div
            className="blob blob-yellow hidden sm:block"
            style={{
              width: '500px',
              height: '500px',
              bottom: '-10%',
              left: '-5%',
            }}
          />
          {/* Blue blob - center right */}
          <div
            className="blob blob-blue hidden sm:block"
            style={{
              width: '450px',
              height: '450px',
              top: '40%',
              right: '20%',
            }}
          />
          {/* Violet blob - top left */}
          <div
            className="blob blob-violet hidden sm:block"
            style={{
              width: '400px',
              height: '400px',
              top: '10%',
              left: '30%',
            }}
          />
          {/* Mobile: Simplified single blob */}
          <div
            className="blob blob-pink sm:hidden"
            style={{
              width: '300px',
              height: '300px',
              top: '-5%',
              right: '-10%',
            }}
          />
        </div>

        {/* Main App Container */}
        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <main className={`
            flex-1 transition-all duration-300
            ml-0 md:ml-20
            ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
            pb-20 md:pb-0
          `}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
