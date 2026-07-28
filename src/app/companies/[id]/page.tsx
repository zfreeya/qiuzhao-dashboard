"use client";

import { useState } from "react";

export function generateStaticParams() {
  return [];
}
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useInterviews, type Application } from "../../../_shared/InterviewContext";

// ============================================================
// 公司详情页
// ============================================================

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { companies, applications, interviews, hydrated, deleteApplication, deleteInterview } = useInterviews();

  if (!hydrated) return <Spinner />;

  const company = companies.find((c) => c.id === id);
  if (!company) notFound();

  // 该公司下的所有投递
  const companyApps = applications.filter((a) => a.companyId === id);

  // 每个投递的面试数
  const appInterviewCounts = new Map<string, number>();
  for (const app of companyApps) {
    appInterviewCounts.set(
      app.id,
      interviews.filter((iv) => iv.applicationId === app.id).length,
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      {/* 返回 */}
      <Link
        href="/companies"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回公司库
      </Link>

      {/* 公司信息 */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                {company.industry}
              </span>
              {(company.tags ?? []).map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/applications/new?companyId=${company.id}&company=${encodeURIComponent(company.name)}`}
            className="shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium
                       text-white shadow-sm transition hover:bg-blue-600"
          >
            + 新增投递
          </Link>
        </div>

        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {company.website}
          </a>
        )}
        {company.notes && (
          <p className="mt-2 text-sm text-gray-500">📌 {company.notes}</p>
        )}
      </div>

      {/* 岗位列表 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            岗位投递 ({companyApps.length})
          </h2>
        </div>

        {companyApps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-2 text-sm text-gray-500">暂无投递记录</p>
            <Link
              href={`/applications/new?companyId=${company.id}&company=${encodeURIComponent(company.name)}`}
              className="mt-3 inline-block text-sm font-medium text-blue-500 hover:text-blue-600"
            >
              + 新增第一个投递
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {companyApps.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                interviewCount={appInterviewCounts.get(app.id) ?? 0}
                interviews={interviews.filter((iv) => iv.applicationId === app.id)}
                onEdit={(a) => router.push(`/applications/${a.id}/edit`)}
                onDelete={async (a) => {
                  if (confirm(`删除「${a.position}」岗位后，关联的面试记录也将删除。确认？`)) {
                    await deleteApplication(a.id);
                  }
                }}
                onDeleteInterview={(ivId, label) => {
                  if (confirm(`确认删除面试「${label}」？`)) {
                    deleteInterview(ivId);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 投递卡片
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  "未投递": "bg-gray-50 text-gray-500 border-gray-200",
  "已投递": "bg-blue-50 text-blue-600 border-blue-200",
  "笔试中": "bg-amber-50 text-amber-600 border-amber-200",
  "已笔试": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "面试中": "bg-indigo-50 text-indigo-600 border-indigo-200",
  "已Offer": "bg-purple-50 text-purple-600 border-purple-200",
  "已拒绝": "bg-red-50 text-red-500 border-red-200",
};

function ApplicationCard({
  app,
  interviewCount,
  interviews,
  onEdit,
  onDelete,
  onDeleteInterview,
}: {
  app: Application;
  interviewCount: number;
  interviews: { id: string; round: string; status: string; interviewDate: string; company: string }[];
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onDeleteInterview: (interviewId: string, label: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    setConfirming(true);
  }

  function confirmDelete() {
    onDelete(app);
    setConfirming(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">{app.position}</h3>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status] ?? STATUS_COLORS["未投递"]}`}
            >
              {app.status}
            </span>
          </div>
          {app.department && (
            <p className="mt-0.5 text-sm text-gray-400">{app.department}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            投递于 {new Date(app.applyDate).toLocaleDateString("zh-CN")}
          </p>
          {app.notes && (
            <p className="mt-1 text-xs text-gray-400 line-clamp-1">{app.notes}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(app)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title="编辑"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            title="删除"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <Link
            href={`/interviews/new?applicationId=${app.id}&company=${encodeURIComponent(app.company)}&position=${encodeURIComponent(app.position)}`}
            className="rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-600
                       transition hover:bg-blue-100"
          >
            + 面试
          </Link>
        </div>
      </div>

      {/* 删除确认 */}
      {confirming && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">
            ⚠️ 删除该岗位后，关联的 {interviewCount} 场面试记录也将一并删除。
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
            >
              确认删除
            </button>
          </div>
        </div>
      )}

      {/* 面试列表 */}
      {interviewCount > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="mb-2 text-xs font-medium text-gray-500">面试记录 ({interviewCount})</p>
          <div className="space-y-1.5">
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="group flex items-center rounded-lg bg-gray-50 px-3 py-2
                           text-sm transition hover:bg-gray-100"
              >
                <Link
                  href={`/interviews/${iv.id}`}
                  className="flex flex-1 items-center justify-between"
                >
                  <span className="font-medium text-gray-700">{iv.round}</span>
                  <span className="text-xs text-gray-400">
                    {iv.interviewDate ? new Date(iv.interviewDate).toLocaleDateString("zh-CN") : "未定"}
                  </span>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); onDeleteInterview(iv.id, iv.round); }}
                  className="ml-2 shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition
                             hover:text-red-500 group-hover:opacity-100"
                  title="删除面试"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
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
