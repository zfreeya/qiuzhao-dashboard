"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/companies", label: "公司库" },
  { href: "/interviews", label: "面试复盘" },
  { href: "/profile", label: "能力画像" },
];

/**
 * 顶部导航栏
 * - Logo + 4 个导航项
 * - 当前页面高亮
 * - 毛玻璃背景 + 吸顶
 */
export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-200/50 bg-white/75 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-brand-800 transition-colors duration-150 hover:text-brand-600"
        >
          <Briefcase size={24} weight="duotone" className="text-brand-500" />
          <span className="hidden sm:inline">秋招复盘</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-brand-600/70 hover:bg-brand-50/50 hover:text-brand-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
