"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef } from "react";
import Link from "next/link";
import {
  getInterviews,
  getApplications,
  getTasks,
  getAIAnalyses,
  getUserProfile,
  getUserMemory,
  getCompanies,
  saveInterviews,
  saveApplications,
  saveTasks,
  saveAIAnalyses,
  saveUserProfile,
  saveUserMemory,
  saveCompanies,
  cleanupOrphanData,
} from "../../services/dataService";

// ============================================================
// 导出数据格式
// ============================================================

interface ExportData {
  version: 1;
  exportedAt: string;
  data: {
    interviews: unknown[];
    applications: unknown[];
    companies: unknown[];
    tasks: unknown[];
    aiAnalyses: unknown[];
    userProfile: unknown;
    userMemory: unknown;
  };
}

// ============================================================
// 数据导入/导出页面
// ============================================================

export default function DataPage() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- 导出 ----
  async function handleExport() {
    try {
      const [interviews, applications, companies, tasks, aiAnalyses, userProfile, userMemory] =
        await Promise.all([
          getInterviews(),
          getApplications(),
          getCompanies(),
          getTasks(),
          getAIAnalyses(),
          getUserProfile(),
          getUserMemory(),
        ]);

      const exportData: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          interviews,
          applications,
          companies,
          tasks,
          aiAnalyses,
          userProfile: userProfile ?? null,
          userMemory: userMemory ?? null,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qiuzhao-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "✅ 数据导出成功" });
    } catch (err) {
      setMessage({
        type: "error",
        text: `❌ 导出失败: ${err instanceof Error ? err.message : "未知错误"}`,
      });
    }
  }

  // ---- 导入 ----
  async function handleImport(file: File) {
    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportData;

      // 基础校验
      if (!parsed.version || !parsed.data) {
        throw new Error("文件格式不正确：缺少 version 或 data 字段");
      }

      const { data } = parsed;

      // 逐项恢复
      if (Array.isArray(data.interviews)) {
        await saveInterviews(data.interviews as any[]);
      }
      if (Array.isArray(data.applications)) {
        await saveApplications(data.applications as any[]);
      }
      if (Array.isArray(data.companies)) {
        await saveCompanies(data.companies as any[]);
      }
      if (Array.isArray(data.tasks)) {
        await saveTasks(data.tasks as any[]);
      }
      if (Array.isArray(data.aiAnalyses)) {
        await saveAIAnalyses(data.aiAnalyses as any[]);
      }
      if (data.userProfile && typeof data.userProfile === "object") {
        await saveUserProfile(data.userProfile as any);
      }
      if (data.userMemory && typeof data.userMemory === "object") {
        await saveUserMemory(data.userMemory as any);
      }

      const counts = [
        data.interviews?.length || 0,
        data.applications?.length || 0,
        data.tasks?.length || 0,
        data.aiAnalyses?.length || 0,
      ];
      const total = counts.reduce((a, b) => a + b, 0);

      setMessage({
        type: "success",
        text: `✅ 导入成功！恢复 ${total} 条记录（面试 ${counts[0]} · 投递 ${counts[1]} · 任务 ${counts[2]} · AI分析 ${counts[3]}）`,
      });

      // 重置文件选择器
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: `❌ 导入失败: ${err instanceof Error ? err.message : "未知错误"}`,
      });
    } finally {
      setImporting(false);
    }
  }

  // ---- 渲染 ----
  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:py-8">
      {/* 返回 */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      {/* 标题 */}
      <h1 className="text-2xl font-bold text-gray-800">📦 数据管理</h1>
      <p className="mt-1 text-sm text-gray-500">导出 / 导入全部求职数据</p>

      {/* 消息 */}
      {message && (
        <div
          className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 卡片区 */}
      <div className="mt-8 space-y-5">
        {/* 导出 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">📤 导出数据</h2>
          <p className="mt-1 text-sm text-gray-500">
            将所有数据（面试、投递、任务、AI分析、个人画像）导出为 JSON 文件，用于备份或迁移。
          </p>
          <button
            onClick={handleExport}
            className="mt-4 w-full rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white
                       transition hover:bg-blue-600"
          >
            导出 JSON
          </button>
        </section>

        {/* 导入 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">📥 导入数据</h2>
          <p className="mt-1 text-sm text-gray-500">
            从之前导出的 JSON 文件恢复全部数据。
            <br />
            <span className="text-orange-500">⚠️ 导入将覆盖当前所有数据。</span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
            className="mt-4 block w-full text-sm text-gray-500
                       file:mr-4 file:rounded-xl file:border-0
                       file:bg-gray-100 file:px-4 file:py-2
                       file:text-sm file:font-medium file:text-gray-700
                       hover:file:bg-gray-200"
          />

          {importing && (
            <p className="mt-3 text-sm text-gray-400">正在导入...</p>
          )}
        </section>

        {/* 数据清理 */}
        <section className="rounded-2xl border border-red-200 bg-red-50/30 p-6">
          <h2 className="text-lg font-semibold text-gray-800">🧹 数据清理</h2>
          <p className="mt-1 text-sm text-gray-500">
            清理孤立的投递记录（无关联公司）和面试记录（无关联投递）。
            <br />
            系统每次启动时会自动运行一次。
          </p>
          <button
            onClick={async () => {
              if (!confirm("确定要清理孤立数据？此操作不可撤销。")) return;
              setCleaning(true);
              try {
                const result = await cleanupOrphanData();
                setMessage({
                  type: "success",
                  text: `✅ 清理完成！移除 ${result.removedApplications} 个孤立投递、${result.removedInterviews} 个孤立面试`,
                });
              } catch (err) {
                setMessage({
                  type: "error",
                  text: `❌ 清理失败: ${err instanceof Error ? err.message : "未知错误"}`,
                });
              } finally {
                setCleaning(false);
              }
            }}
            disabled={cleaning}
            className="mt-4 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white
                       transition hover:bg-red-600 disabled:opacity-40"
          >
            {cleaning ? "清理中..." : "清理孤立数据"}
          </button>
        </section>
      </div>
    </div>
  );
}
