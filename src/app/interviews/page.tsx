"use client";

import Link from "next/link";
import {
  useInterviews,
  relativeTime,
  formatDate,
} from "../../_shared/InterviewContext";

// ============================================================
// 面试记录列表页 — 按投递（Application）分组
// ============================================================

export default function InterviewsPage() {
  const { interviews, applications, hydrated, loadDemoData, deleteInterview } = useInterviews();

  async function handleDelete(id: string, label: string) {
    if (!window.confirm(`确认删除「${label}」的面试复盘记录？\n\n面试问题和回答将一并删除，AI 分析记录保留。`)) return;
    await deleteInterview(id);
  }

  if (!hydrated) return <Spinner />;

  // 按 applicationId 分组
  const grouped = new Map<string, typeof interviews>();
  const orphaned: typeof interviews = [];

  for (const iv of interviews) {
    if (iv.applicationId) {
      if (!grouped.has(iv.applicationId)) grouped.set(iv.applicationId, []);
      grouped.get(iv.applicationId)!.push(iv);
    } else {
      orphaned.push(iv);
    }
  }

  // 按组内最新更新时间排序
  const sortedGroups = Array.from(grouped.entries()).sort(([, a], [, b]) => {
    const aMax = Math.max(...a.map((iv) => new Date(iv.updatedAt).getTime()));
    const bMax = Math.max(...b.map((iv) => new Date(iv.updatedAt).getTime()));
    return bMax - aMax;
  });

  const totalCount = interviews.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ── 页头 ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💬 面试复盘</h1>
          <p className="mt-1 text-sm text-gray-500">
            按投递岗位分组，追踪每一轮的面试表现
          </p>
        </div>
        <Link
          href="/interviews/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-500
                     px-4 py-2.5 text-sm font-medium text-white shadow-sm transition
                     hover:bg-blue-600 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新增面试
        </Link>
      </div>

      {/* ── 空状态 ── */}
      {totalCount === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-4 text-sm text-gray-500">还没有面试记录</p>
          <p className="mt-1 text-xs text-gray-400">
            先创建投递，然后为每个投递添加面试复盘
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/applications/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500
                         px-5 py-2.5 text-sm font-medium text-white shadow-sm transition
                         hover:bg-blue-600"
            >
              新增投递
            </Link>
            <button
              onClick={loadDemoData}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400
                         transition hover:bg-gray-100 hover:text-gray-600"
            >
              加载示例数据
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── 按 Application 分组 ── */}
          {sortedGroups.map(([appId, ivs]) => {
            const app = applications.find((a) => a.id === appId);
            const label = app
              ? `${app.company} - ${app.position}`
              : "未关联投递";
            return (
              <section key={appId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">
                      {app ? (
                        <Link
                          href={`/companies/${app.companyId}`}
                          className="hover:text-blue-600 transition"
                        >
                          {app.company}
                        </Link>
                      ) : (
                        label
                      )}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {app?.position ?? ""}
                      {app?.department ? ` · ${app.department}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/interviews/new?applicationId=${appId}&company=${encodeURIComponent(app?.company ?? "")}&position=${encodeURIComponent(app?.position ?? "")}`}
                    className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600
                               transition hover:bg-blue-100"
                  >
                    + 面试
                  </Link>
                </div>

                {/* 面试卡片 */}
                <div className="space-y-2">
                  {ivs
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((iv) => (
                      <Link
                        key={iv.id}
                        href={`/interviews/${iv.id}`}
                        className="flex items-center gap-4 rounded-xl bg-gray-50 px-4 py-3
                                   transition hover:bg-blue-50 group"
                      >
                        {/* 轮次 */}
                        <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-sm font-semibold text-gray-700 shadow-sm">
                          {iv.round}
                        </span>

                        {/* 信息 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {iv.interviewDate && (
                              <span className="text-xs text-gray-400">{formatDate(iv.interviewDate)}</span>
                            )}
                            {iv.location && (
                              <span className="text-xs text-gray-400">📍 {iv.location}</span>
                            )}
                          </div>
                        </div>

                        {/* 问题数 + 删除 */}
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {iv.questions.length > 0 ? `${iv.questions.length} 题` : ""}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(iv.id, `${iv.company} ${iv.position} ${iv.round}`);
                            }}
                            className="rounded p-1 text-xs text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                            title="删除"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <span className="text-xs text-gray-400">
                            {relativeTime(iv.updatedAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </section>
            );
          })}

          {/* ── 未关联投递的面试 ── */}
          {orphaned.length > 0 && (
            <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-500">未关联投递</h2>
              <div className="space-y-2">
                {orphaned
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((iv) => (
                    <Link
                      key={iv.id}
                      href={`/interviews/${iv.id}`}
                      className="flex items-center gap-4 rounded-xl bg-gray-50 px-4 py-3
                                 transition hover:bg-blue-50 group"
                    >
                      <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-sm font-semibold text-gray-500 shadow-sm">
                        {iv.round}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-gray-500">
                          {iv.company} · {iv.position}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(iv.id, `${iv.company} ${iv.position}`);
                        }}
                        className="rounded p-1 text-xs text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </Link>
                  ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── 底部统计 ── */}
      {totalCount > 0 && (
        <footer className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
          共 {sortedGroups.length} 个岗位 · {totalCount} 场面试
        </footer>
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
