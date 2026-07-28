"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useInterviews,
  type Company,
} from "../../_shared/InterviewContext";

// ============================================================
// 常量
// ============================================================

const INDUSTRY_OPTIONS = [
  "互联网",
  "金融",
  "制造",
  "教育",
  "医疗",
  "消费品",
  "咨询",
  "房地产",
  "其他",
];

/** 空表单 */
function emptyForm() {
  return {
    name: "",
    industry: "互联网",
    tags: [] as string[],
    website: "",
    notes: "",
  };
}

// ============================================================
// 子组件：单张公司卡片
// ============================================================

function CompanyCard({
  company,
  applicationCount,
  interviewCount,
  onEdit,
  onDelete,
}: {
  company: Company;
  applicationCount: number;
  interviewCount: number;
  onEdit: (c: Company) => void;
  onDelete: (c: Company) => void;
}) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="group relative flex flex-col rounded-2xl border border-gray-200
                 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      {/* 顶部：行业标签 */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          {company.industry}
        </span>

        {/* 操作按钮：hover 才显示 */}
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(company); }}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title="编辑"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(company); }}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            title="删除"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 公司名 */}
      <h3 className="text-lg font-bold text-gray-800">{company.name}</h3>

      {/* Tags */}
      {(company.tags ?? []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(company.tags ?? []).map((tag) => (
            <span key={tag} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 关联信息 */}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        <span>📮 {applicationCount} 个岗位</span>
        <span>💬 {interviewCount} 次面试</span>
      </div>

      {/* 备注 */}
      {company.notes && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-gray-400">
          📌 {company.notes}
        </p>
      )}

      {/* 官网链接 */}
      {company.website && (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-blue-500"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          官网
        </a>
      )}

      {/* 跳转面试复盘 */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <Link
          href={`/applications/new?company=${encodeURIComponent(company.name)}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg
                     bg-blue-50 py-2 text-xs font-medium text-blue-600
                     transition hover:bg-blue-100"
        >
          新增投递 →
        </Link>
      </div>
    </Link>
  );
}

// ============================================================
// 子组件：添加 / 编辑弹窗
// ============================================================

function CompanyModal({
  form,
  onChange,
  onSave,
  onClose,
  title,
}: {
  form: ReturnType<typeof emptyForm>;
  onChange: (f: ReturnType<typeof emptyForm>) => void;
  onSave: () => void;
  onClose: () => void;
  title: string;
}) {
  const canSave = form.name.trim() !== "";
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    onChange({ ...form, tags: [...form.tags, t] });
    setTagInput("");
  }

  function removeTag(tag: string) {
    onChange({ ...form, tags: form.tags.filter((t) => t !== tag) });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 公司名称 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              公司名称 <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="如：字节跳动"
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              autoFocus
            />
          </label>

          {/* 行业 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">行业</span>
            <select
              value={form.industry}
              onChange={(e) => onChange({ ...form, industry: e.target.value })}
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400"
            >
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </label>

          {/* 标签 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">标签</span>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="输入后回车添加"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                           outline-none transition focus:border-blue-400"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
              >
                +
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </label>

          {/* 官网链接 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">官网链接</span>
            <input
              type="url"
              value={form.website}
              onChange={(e) => onChange({ ...form, website: e.target.value })}
              placeholder="https://"
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 备注 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">备注</span>
            <textarea
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              placeholder="如：内推人、投递时间、特殊要求…"
              rows={3}
              className="mt-1 block w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5
                         text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 按钮 */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium
                         text-gray-600 transition hover:bg-gray-50"
            >
              取消
            </button>
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
    </div>
  );
}

// ============================================================
// 页面主体
// ============================================================

export default function CompaniesPage() {
  const {
    companies,
    applications,
    interviews,
    hydrated,
    addCompany,
    updateCompany,
    deleteCompany,
    loadDemoData,
  } = useInterviews();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleting, setDeleting] = useState(false);

  // ── 迁移旧数据（qiuzhao_company_library → qiuzhao_companies）──
  const didMigrate = useRef(false);

  useEffect(() => {
    if (!hydrated || didMigrate.current) return;
    didMigrate.current = true;

    // 如果已有 Context companies，跳过迁移
    if (companies.length > 0) return;

    // 尝试从旧 key 迁移
    try {
      const raw = localStorage.getItem("qiuzhao_company_library");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      // 旧格式: {id: number, name, position, industry, website, status, notes}
      for (const old of parsed) {
        if (!old.name) continue;
        addCompany({
          name: String(old.name),
          industry: String(old.industry || "互联网"),
          tags: [],
          website: old.website ? String(old.website) : undefined,
          notes: old.notes ? String(old.notes) : undefined,
        });
      }
      // 迁移后清除旧数据
      localStorage.removeItem("qiuzhao_company_library");
    } catch {
      // 静默失败
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) return <Spinner />;

  // ========== 计算每家公司的关联数据 ==========

  const companyStats = new Map<string, { appCount: number; ivCount: number }>();
  for (const c of companies) {
    const apps = applications.filter((a) => a.companyId === c.id);
    const appIds = new Set(apps.map((a) => a.id));
    const ivCount = interviews.filter((iv) => appIds.has(iv.applicationId)).length;
    companyStats.set(c.id, { appCount: apps.length, ivCount });
  }

  // ========== 搜索过滤 ==========

  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? companies.filter(
        (c) =>
          c.name.toLowerCase().includes(keyword) ||
          c.industry.toLowerCase().includes(keyword) ||
          (c.tags ?? []).some((t) => t.toLowerCase().includes(keyword)),
      )
    : companies;

  // ========== 操作函数 ==========

  function openAdd() {
    setEditingCompany(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(company: Company) {
    setEditingCompany(company);
    setForm({
      name: company.name,
      industry: company.industry,
      tags: [...(company.tags ?? [])],
      website: company.website ?? "",
      notes: company.notes ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCompany(null);
  }

  function handleSave() {
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    if (editingCompany) {
      updateCompany(editingCompany.id, {
        name: trimmedName,
        industry: form.industry,
        tags: form.tags,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    } else {
      addCompany({
        name: trimmedName,
        industry: form.industry,
        tags: form.tags,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    }

    closeModal();
  }

  async function handleDelete(company: Company) {
    if (deleting) return;
    const stats = companyStats.get(company.id);
    const appCount = stats?.appCount ?? 0;
    const ivCount = stats?.ivCount ?? 0;

    let msg = `确认删除「${company.name}」？`;
    if (appCount > 0 || ivCount > 0) {
      msg += `\n\n⚠️ 将同时删除：\n- ${appCount} 条投递记录\n- ${ivCount} 条面试复盘`;
      msg += "\n\nAI 分析记录和独立日程不受影响。";
    }
    if (!window.confirm(msg)) return;

    setDeleting(true);
    try {
      await deleteCompany(company.id);
    } finally {
      setDeleting(false);
    }
  }

  // ========== 渲染 ==========

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ── 页头：标题 + 添加按钮 ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏢 公司库</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理你的目标公司，追踪每一家的投递进度
          </p>
        </div>
        <div className="flex items-center gap-2">
          {companies.length === 0 && (
            <button
              onClick={loadDemoData}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400
                         transition hover:bg-gray-100 hover:text-gray-600"
            >
              加载示例数据
            </button>
          )}
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5
                       text-sm font-medium text-white shadow-sm transition
                       hover:bg-blue-600 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            添加公司
          </button>
        </div>
      </div>

      {/* ── 搜索栏 ── */}
      <div className="relative mb-6">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索公司名、行业或标签…"
          className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4
                     text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {keyword && (
          <p className="mt-2 text-xs text-gray-400">
            找到 {filtered.length} 家公司
          </p>
        )}
      </div>

      {/* ── 卡片网格 ── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-sm text-gray-400">
            {keyword ? "没有匹配的公司" : "还没有添加公司"}
          </p>
          <button
            onClick={openAdd}
            className="mt-3 text-sm font-medium text-blue-500 transition hover:text-blue-600"
          >
            + 添加第一家
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => {
            const stats = companyStats.get(company.id);
            return (
              <CompanyCard
                key={company.id}
                company={company}
                applicationCount={stats?.appCount ?? 0}
                interviewCount={stats?.ivCount ?? 0}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      {/* ── 底部统计 ── */}
      <footer className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
        共 {companies.length} 家公司
        {INDUSTRY_OPTIONS.map((ind) => {
          const count = companies.filter((c) => c.industry === ind).length;
          return count > 0 ? (
            <span key={ind} className="ml-2.5">
              {ind} {count}
            </span>
          ) : null;
        })}
      </footer>

      {/* ── 添加/编辑弹窗 ── */}
      {modalOpen && (
        <CompanyModal
          form={form}
          onChange={setForm}
          onSave={handleSave}
          onClose={closeModal}
          title={editingCompany ? "编辑公司" : "添加公司"}
        />
      )}

      {/* 删除中提示 */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white px-6 py-4 shadow-lg text-sm text-gray-600">
            正在删除...
          </div>
        </div>
      )}
    </div>
  );
}

/** hydration 完成前的占位 */
function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}
