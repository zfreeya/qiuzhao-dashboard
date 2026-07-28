"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useInterviews, type ApplicationStatus } from "../../../../_shared/InterviewContext";

// ============================================================
// 编辑投递页面
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

export default function EditApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { applications, hydrated, updateApplication } = useInterviews();

  const app = applications.find((a) => a.id === id);

  const [position, setPosition] = useState(app?.position ?? "");
  const [department, setDepartment] = useState(app?.department ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(app?.status ?? "已投递");
  const [applyDate, setApplyDate] = useState(app?.applyDate.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(app?.notes ?? "");

  if (!hydrated) return <Spinner />;
  if (!app) notFound();
  // TypeScript narrow: after notFound(), app is non-null
  const a = app!;

  const canSave = position.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    updateApplication(id, {
      position: position.trim(),
      department: department.trim() || undefined,
      status,
      applyDate: new Date(applyDate).toISOString(),
      notes: notes.trim() || undefined,
    });

    router.push(`/companies/${a.companyId}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href={`/companies/${a.companyId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回公司详情
      </Link>

      <h1 className="text-2xl font-bold text-gray-800">✏️ 编辑投递</h1>
      <p className="mt-1 text-sm text-gray-500">
        {a.company} · 修改岗位信息
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            岗位名称 <span className="text-red-400">*</span>
          </span>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5
                       text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            autoFocus
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
                       text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                <option key={s} value={s}>{s}</option>
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
            href={`/companies/${a.companyId}`}
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
            保存
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
