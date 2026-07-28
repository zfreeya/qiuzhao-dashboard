"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInterviews, type ApplicationStatus } from "../../../_shared/InterviewContext";

// ============================================================
// 常量
// ============================================================

const STATUS_OPTIONS: ApplicationStatus[] = [
  "未投递",
  "已投递",
  "笔试中",
  "已笔试",
  "面试中",
  "已Offer",
  "已拒绝",
];

function getStatusIcon(s: ApplicationStatus): string {
  switch (s) {
    case "未投递": return "📋";
    case "已投递": return "📮";
    case "笔试中": return "📝";
    case "已笔试": return "✅";
    case "面试中": return "💬";
    case "已Offer": return "🎉";
    case "已拒绝": return "🚫";
  }
}

// ============================================================
// 页面
// ============================================================

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewApplicationForm />
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
      </div>
    </div>
  );
}

function NewApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrated, addApplication, addApplicationWithCompany, companies } = useInterviews();

  const prefillCompanyId = searchParams.get("companyId") ?? "";
  const prefillCompanyName = searchParams.get("company") ?? "";

  const company = prefillCompanyId
    ? companies.find((c) => c.id === prefillCompanyId)
    : null;
  const isPreFilled = !!company;

  const [companyName, setCompanyName] = useState(prefillCompanyName);
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("已投递");
  const [applyDate, setApplyDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const existingNames = companies.map((c) => c.name);
  const isExisting = !isPreFilled && companyName.trim() && existingNames.includes(companyName.trim());

  const canSave = (isPreFilled || companyName.trim()) && position.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      let companyId: string;
      if (isPreFilled) {
        // 关联已有公司，直接创建 Application
        companyId = company!.id;
        await addApplication({
          companyId: company!.id,
          company: company!.name,
          position: position.trim(),
          department: department.trim() || undefined,
          status,
          applyDate: applyDate ? new Date(applyDate).toISOString() : new Date().toISOString(),
          notes: notes.trim() || undefined,
        });
        router.push(`/companies/${companyId}`);
      } else {
        // 新公司流程：先查找/创建 Company，再创建 Application
        const result = await addApplicationWithCompany({
          companyName: companyName.trim(),
          position: position.trim(),
          department: department.trim() || undefined,
          status,
          applyDate: applyDate ? new Date(applyDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        });
        companyId = result.companyId;
        router.push(`/companies/${companyId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请重试");
      setSubmitting(false);
    }
  }

  if (!hydrated) return <Spinner />;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href={isPreFilled ? `/companies/${company!.id}` : "/companies"}
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {isPreFilled ? `返回 ${company!.name}` : "返回公司库"}
      </Link>

      <h1 className="text-2xl font-bold text-gray-800">📮 新增投递</h1>
      <p className="mt-1 text-sm text-gray-500">
        {isPreFilled ? `为 ${company!.name} 添加新的岗位投递` : "记录一次新的岗位投递机会"}
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* 公司 — 已确定时只读展示 */}
        {isPreFilled ? (
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-400">公司</p>
            <p className="text-base font-semibold text-gray-800">{company!.name}</p>
            {company!.industry && (
              <p className="text-sm text-gray-400">{company!.industry}</p>
            )}
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              公司名称 <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="如：字节跳动"
              list="existing-companies"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5
                         text-sm outline-none transition
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              autoFocus
            />
            <datalist id="existing-companies">
              {existingNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {isExisting && (
              <p className="mt-1 text-xs text-emerald-600">✅ 已存在，将关联到已有公司</p>
            )}
            {companyName.trim() && !isExisting && (
              <p className="mt-1 text-xs text-blue-500">🆕 将自动创建新公司</p>
            )}
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            岗位名称 <span className="text-red-400">*</span>
          </span>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="如：产品经理"
            className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5
                       text-sm outline-none transition
                       focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            autoFocus={isPreFilled}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">业务线</span>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="如：抖音商城（可选）"
            className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5
                       text-sm outline-none transition
                       focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">状态</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{getStatusIcon(s)} {s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">投递日期</span>
            <input
              type="date"
              value={applyDate}
              onChange={(e) => setApplyDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">备注</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="如：内推人、JD链接…"
            rows={2}
            className="mt-1.5 block w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5
                       text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <Link
            href={isPreFilled ? `/companies/${company!.id}` : "/companies"}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm
                       font-medium text-gray-600 transition hover:bg-gray-50"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={!canSave || submitting}
            className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white
                       transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "创建中..." : "创建投递"}
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
