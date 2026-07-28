"use client";

import { useState } from "react";
import Link from "next/link";
import { useInterviews } from "../../_shared/InterviewContext";
import { generateUserMemory } from "../../services/memoryService";
import type {
  InterviewPattern,
  LearningGoal,
} from "../../_shared/InterviewContext";

// ============================================================
// AI 长期记忆页面
// ============================================================

export default function MemoryPage() {
  const {
    interviews,
    aiAnalyses,
    tasks,
    userProfile,
    userMemory,
    updateUserMemory,
    hydrated,
  } = useInterviews();

  const [generating, setGenerating] = useState(false);

  if (!hydrated) return <Spinner />;

  function handleRegenerate() {
    setGenerating(true);
    // 给 UI 一点时间反映加载状态
    setTimeout(() => {
      const memory = generateUserMemory(
        interviews,
        aiAnalyses,
        tasks,
        userProfile,
      );
      updateUserMemory(memory);
      setGenerating(false);
    }, 300);
  }

  const memory = userMemory;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
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

      {/* 标题区 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧠 记忆中心</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI 长期记忆，基于历史数据自动生成，每次 AI 分析时优先读取
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={generating}
          className="rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-medium text-white
                     transition hover:bg-purple-600 disabled:opacity-40"
        >
          {generating ? "生成中..." : "🔄 重新生成记忆"}
        </button>
      </div>

      {/* 空状态 */}
      {!memory && (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
          <p className="text-4xl">🧠</p>
          <p className="mt-3 text-sm font-medium text-gray-600">暂无记忆数据</p>
          <p className="mt-1 text-xs text-gray-400">
            点击「重新生成记忆」从现有面试、AI 分析、任务数据中自动生成长期记忆
          </p>
        </div>
      )}

      {memory && (
        <div className="mt-8 space-y-5">
          {/* 核心优势 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">💪 核心优势</h2>
            {memory.strengths?.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {memory.strengths.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">暂无数据，完成更多面试复盘后自动生成</p>
            )}
          </section>

          {/* 待提升能力 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">📈 待提升能力</h2>
            {memory.weaknesses?.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {memory.weaknesses.map((w, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-700"
                  >
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">暂无数据</p>
            )}
          </section>

          {/* 面试模式 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">🔁 面试模式</h2>
            {memory.interviewPatterns?.length > 0 ? (
              <div className="mt-3 space-y-3">
                {memory.interviewPatterns.map((p: InterviewPattern, i: number) => (
                  <PatternCard key={i} pattern={p} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">
                暂无跨面试的模式数据，完成 2 次以上面试复盘后可见
              </p>
            )}
          </section>

          {/* 学习目标 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">🎯 学习目标</h2>
            {memory.learningGoals?.length > 0 ? (
              <div className="mt-3 space-y-3">
                {memory.learningGoals.map((g: LearningGoal, i: number) => (
                  <GoalCard key={i} goal={g} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">
                暂无学习目标，完成能力画像生成后自动提取
              </p>
            )}
          </section>

          {/* AI 综合画像 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">📝 AI 综合画像</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {memory.aiSummary || "暂无数据"}
            </p>
          </section>

          {/* 更新时间 */}
          <p className="text-center text-xs text-gray-400">
            最后更新：{new Date(memory.updatedAt).toLocaleString("zh-CN")}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================

function PatternCard({ pattern }: { pattern: InterviewPattern }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800">
          {pattern.pattern}
        </span>
        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
          {pattern.frequency}次
        </span>
      </div>
      {pattern.evidence?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {(pattern.evidence ?? []).map((e, i) => (
            <li key={i} className="text-xs text-gray-500">
              • {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: LearningGoal }) {
  const priorityColors: Record<string, string> = {
    high: "bg-red-50 text-red-600 border-red-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    low: "bg-gray-50 text-gray-500 border-gray-200",
  };

  const priorityLabels: Record<string, string> = {
    high: "高优",
    medium: "中优",
    low: "低优",
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800">{goal.goal}</p>
          <p className="mt-0.5 text-xs text-gray-400">{goal.source}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityColors[goal.priority] ?? priorityColors.medium}`}
        >
          {priorityLabels[goal.priority] ?? goal.priority}
        </span>
      </div>
      {/* 进度条 */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{goal.progress}%</span>
      </div>
    </div>
  );
}

// ============================================================
// 加载占位
// ============================================================

function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
    </div>
  );
}
