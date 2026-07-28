import type { Metadata } from "next";
import Navbar from "./_components/Navbar";
import { InterviewProvider } from "../_shared/InterviewContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "秋招复盘工具",
  description: "记录和追踪秋招投递、面试、Offer 进度",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-brand-900 antialiased">
        <InterviewProvider>
          <Navbar />
          <main>{children}</main>
        </InterviewProvider>
      </body>
    </html>
  );
}
