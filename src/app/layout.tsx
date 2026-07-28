import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "./_components/Navbar";
import { InterviewProvider } from "../_shared/InterviewContext";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
      <body className={`${plusJakartaSans.className} min-h-screen text-brand-900 antialiased`}>
        <InterviewProvider>
          <Navbar />
          <main>{children}</main>
        </InterviewProvider>
      </body>
    </html>
  );
}
