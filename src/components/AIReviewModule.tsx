"use client";

import { useEffect, useState } from "react";
import { type AIReview, type Question } from "../_shared/InterviewContext";
import { generateAIReview } from "../services/ai-service";

// ============================================================
// 常量
// ============================================================

/** loading 阶段轮播文案 */
const LOADING_STEPS = [
  "正在分析 JD 与岗位要求…",
  "正在对比面试问题与回答…",
  "正在评估匹配度…",
  "正在生成改进建议…",
];

// ============================================================
// 组件
// ============================================================

export default function AIReviewModule({
  aiReview,
  position,
  jd,
  questions,
  userSummary,
  onGenerate,
}: {
  aiReview?: AIReview;
  position: string;
  jd: string;
  questions: Question[];
  userSummary: string;
  onGenerate: (review: AIReview) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const canGenerate = !!(jd.trim() || questions.length > 0);

  // loading 文案轮播
  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1) % LOADING_STEPS.length);
    }, 800);
    return () => clearInterval(timer);
  }, [loading]);

  async function handleGenerate() {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError(null);
    setStepIndex(0);

    try {
      const review = await generateAIReview({
        position,
        jd,
        qa: questions.map((q) => ({
          question: q.question,
          answer: q.answer,
          category: q.category,
        })),
        userSummary,
      });
      onGenerate(review);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "AI 服务异常，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  }

  // ── 加载态 ──
  if (loading) {
    return (
      <section className="mb-6 rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-800">
          🤖 AI 面试诊断
        </h2>
        <div className="flex flex-col items-center py-10">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-3 border-purple-200 border-t-purple-500" />
          <p className="text-sm font-medium text-purple-600">
            {LOADING_STEPS[stepIndex]}
          </p>
          <p className="mt-1 text-xs text-gray-400">预计需要 2–3 秒</p>
        </div>
      </section>
    );
  }

  // ── 错误态 ──
  if (error) {
    return (
      <section className="mb-6 rounded-2xl border border-red-200 bg-red-50/30 p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          🤖 AI 面试诊断
        </h2>
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          ❌ {error}
        </div>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5
                     text-sm font-medium text-white shadow-sm transition
                     hover:bg-purple-600 active:scale-95 disabled:opacity-40"
        >
          重新生成
        </button>
      </section>
    );
  }

  // ── 结果态 ──
  if (aiReview) {
    return (
      <section className="mb-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            🤖 AI 面试诊断
          </h2>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="rounded-lg px-3 py-1 text-xs font-medium text-purple-600
                       transition hover:bg-purple-100 disabled:opacity-40"
          >
            重新生成
          </button>
        </div>

        {/* 匹配度评分 */}
        <div className="mb-5 flex items-center gap-4 rounded-xl bg-white/80 p-4">
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={aiReview.matchScore >= 80 ? "#10b981" : aiReview.matchScore >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${(aiReview.matchScore / 100) * 176} 176`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
              {aiReview.matchScore}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">匹配度评分</p>
            <p className="text-xs text-gray-500">
              {aiReview.matchScore >= 80 ? "高度匹配" : aiReview.matchScore >= 60 ? "较为匹配" : "有待提升"}
            </p>
          </div>
        </div>

        {/* 面试官视角 */}
        {aiReview.interviewerPerspective && (
          <div className="mb-4 rounded-xl bg-purple-100/60 p-4">
            <h3 className="mb-1.5 text-sm font-semibold text-purple-800">
              👀 面试官可能在思考
            </h3>
            <p className="text-sm leading-relaxed text-purple-700">
              {aiReview.interviewerPerspective}
            </p>
          </div>
        )}

        {/* 总结 */}
        <div className="mb-4 rounded-xl bg-white/80 p-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-700">📊 面试表现总结</h3>
          <p className="text-sm leading-relaxed text-gray-600">{aiReview.summary}</p>
        </div>

        {/* 优势 + 不足 并排 */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-emerald-700">✅ 优势分析</h3>
            <ul className="space-y-1.5">
              {(aiReview.strengths ?? []).map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 shrink-0 text-emerald-400">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-amber-700">⚠️ 不足分析</h3>
            <ul className="space-y-1.5">
              {(aiReview.weaknesses ?? []).map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 shrink-0 text-amber-400">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 建议 */}
        <div className="rounded-xl bg-white/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-blue-700">💡 改进建议</h3>
          <ol className="space-y-2">
            {(aiReview.suggestions ?? []).map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="shrink-0 text-sm font-medium text-blue-400">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 底部标注 */}
        <p className="mt-4 text-center text-xs text-gray-400">
          ⚡ 由 AI 生成，仅供参考
          {aiReview.modelVersion && (
            <span className="ml-1 text-gray-300">· {aiReview.modelVersion}</span>
          )}
        </p>
      </section>
    );
  }

  // ── 空态 ──
  return (
    <section className="mb-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/30 p-6 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
        🤖 AI 面试诊断
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        基于你的 JD、面试问题和回答，AI 自动分析面试表现，
        生成匹配度评分、优势/不足分析和改进建议。
      </p>
      {!canGenerate ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-600">
          请先填写 JD 或添加至少一个面试问题后再生成
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5
                     text-sm font-medium text-white shadow-sm transition
                     hover:bg-purple-600 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          生成诊断
        </button>
      )}
    </section>
  );
}
