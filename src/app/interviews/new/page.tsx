"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useInterviews,
  type InterviewRound,
} from "../../../_shared/InterviewContext";

// ============================================================
// 新增面试记录页面
// ============================================================

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewInterviewForm />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6 h-5 w-20 animate-pulse rounded bg-gray-200" />
      <div className="mb-1 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-8 space-y-5">
        <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

const ROUND_OPTIONS: InterviewRound[] = ["一面", "二面", "三面", "HR面", "终面", "其他"];

function NewInterviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addInterview, hydrated, applications } = useInterviews();

  // 从 URL 参数预填
  const prefillAppId = searchParams.get("applicationId") ?? "";
  const prefillCompany = searchParams.get("company") ?? "";
  const prefillPosition = searchParams.get("position") ?? "";
  const isPrefilled = !!prefillAppId;

  // 表单状态
  const [company, setCompany] = useState(prefillCompany);
  const [position, setPosition] = useState(prefillPosition);
  const [interviewDate, setInterviewDate] = useState("");
  const [round, setRound] = useState<InterviewRound>("其他");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");

  // 已有投递列表（用于下拉选择）
  const appOptions = applications
    .filter((a) => prefillAppId ? a.id === prefillAppId : true)
    .sort((a, b) => a.company.localeCompare(b.company));

  if (!hydrated) return <Spinner />;

  const canSave = company.trim() !== "" && position.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    const id = await addInterview({
      applicationId: prefillAppId || undefined,
      company: company.trim(),
      position: position.trim(),
      status: "待面试",
      interviewDate: interviewDate
        ? new Date(interviewDate).toISOString()
        : "",
      companyId: undefined,
      jd: "",
      questions: [],
      recordings: [],
      summary: "",
      round,
      location: location.trim() || undefined,
      link: link.trim() || undefined,
    });

    router.push(`/interviews/${id}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/interviews"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </Link>

      <h1 className="text-2xl font-bold text-gray-800">📝 新增面试记录</h1>
      <p className="mt-1 text-sm text-gray-500">
        为已有投递添加一轮面试复盘
      </p>

      {/* 已有投递选择 */}
      {appOptions.length > 0 && !isPrefilled && (
        <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-600">
          💡 已检测到 {appOptions.length} 个投递。建议在投递详情页点击「+ 面试」来自动关联。
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {isPrefilled && (
          <div className="rounded-xl bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-700">{prefillCompany}</p>
            <p className="text-gray-500">{prefillPosition}</p>
          </div>
        )}
        {!isPrefilled && (
          <>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                公司名称 <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="如：字节跳动"
                className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5
                           text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                岗位名称 <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="如：AI产品经理"
                className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5
                           text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </>
        )}

        {/* 轮次 */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">面试轮次</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {ROUND_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRound(r)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  round === r
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </label>

        {/* 面试时间 */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">面试时间</span>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white
                         px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
            />
          </label>
        </div>

        {/* 地点 + 链接 */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">地点</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：XX大厦（可选）"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">会议链接</span>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="（可选）"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400"
            />
          </label>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/interviews"
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm
                       font-medium text-gray-600 transition hover:bg-gray-50"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={!canSave}
            className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white
                       transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            创建记录
          </button>
        </div>
      </form>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}
