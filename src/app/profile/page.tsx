"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useInterviews,
  type CapabilityProfileResult,
  type CapabilityEvidence,
  type Interview,
} from "../../_shared/InterviewContext";
import { generateAbilityProfile, computeGrowthEvents } from "../../services/interviewService";
import {
  getLatestProfile,
  generateAbilityProfileWithAI,
} from "../../services/abilityProfileService";

// ============================================================
// 能力画像详情页
// ============================================================

export default function ProfilePage() {
  const {
    interviews,
    applications,
    aiAnalyses,
    tasks,
    userProfile,
    userMemory,
    hydrated,
    addAIAnalysis,
    updateUserProfile,
    addTask,
  } = useInterviews();

  const [loading, setLoading] = useState(false);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // ── 画像编辑状态 ──
  const [editRoles, setEditRoles] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editProjects, setEditProjects] = useState("");
  const [editBackground, setEditBackground] = useState("");
  const [editGoals, setEditGoals] = useState("");

  const aiProfile = useMemo(() => getLatestProfile(aiAnalyses), [aiAnalyses]);

  // 上一次画像（用于趋势对比）
  const previousProfile = useMemo(() => {
    const history = aiAnalyses
      .filter((a) => a.type === "capability_profile")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return history.length >= 2
      ? (history[1].result as CapabilityProfileResult)
      : undefined;
  }, [aiAnalyses]);

  const abilityProfile = useMemo(() => {
    if (aiProfile) return aiProfile;
    if (!hydrated || interviews.length === 0) return null;
    return generateAbilityProfile(interviews, aiAnalyses, tasks, userProfile, previousProfile);
  }, [aiProfile, hydrated, interviews, aiAnalyses, tasks, userProfile, previousProfile]);

  // ── 成长事件 ──
  const growthEvents = useMemo(() => {
    if (!abilityProfile) return [];
    return computeGrowthEvents(tasks, abilityProfile, previousProfile);
  }, [tasks, abilityProfile, previousProfile]);

  // ── 历史趋势（多条 capability_profile 记录） ──
  const profileHistory = useMemo(() => {
    return aiAnalyses
      .filter((a) => a.type === "capability_profile")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((a) => ({
        date: a.createdAt,
        score: (a.result as CapabilityProfileResult).overallScore,
      }));
  }, [aiAnalyses]);

  if (!hydrated) return <Spinner />;

  async function handleGenerateGrowth() {
    setGrowthLoading(true);
    try {
      const response = await fetch("/api/ai/growth-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: {
            targetRoles: userProfile.targetRoles,
            skills: userProfile.skills,
            background: userProfile.background,
          },
          dimensions: abilityProfile?.dimensions.map((d) => ({
            name: d.name,
            score: d.score,
            reasons: d.reasons,
          })) ?? [],
          evidenceList: abilityProfile?.evidenceList ?? [],
          targetRole: userProfile.targetRoles[0],
          interviews: interviews.map((iv) => ({
            company: iv.company,
            position: iv.position,
            status: iv.status,
          })),
          userMemory: userMemory
            ? {
                strengths: userMemory.strengths,
                weaknesses: userMemory.weaknesses,
                interviewPatterns: userMemory.interviewPatterns,
                learningGoals: userMemory.learningGoals,
                aiSummary: userMemory.aiSummary,
              }
            : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (abilityProfile) {
          abilityProfile.growthRecommendations = data.recommendations;
        }
      }
    } finally {
      setGrowthLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateAbilityProfileWithAI({
        interviews,
        aiAnalyses,
        tasks,
        userMemory: userMemory
          ? {
              strengths: userMemory.strengths,
              weaknesses: userMemory.weaknesses,
              interviewPatterns: userMemory.interviewPatterns,
              learningGoals: userMemory.learningGoals,
              aiSummary: userMemory.aiSummary,
            }
          : undefined,
      });
      addAIAnalysis({
        type: "capability_profile",
        targetType: "user",
        targetId: "user",
        result,
        input: {
          summary: `${interviews.length} 场面试 · ${applications.length} 个投递 · ${tasks.filter((t) => t.status === "completed").length}/${tasks.length} 任务完成`,
        },
        promptVersion: "v2",
        modelVersion: "deepseek-chat",
      });
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    setEditRoles(userProfile.targetRoles.join("、"));
    setEditSkills(userProfile.skills.join("、"));
    setEditProjects(
      userProfile.projects
        .map((p) => `${p.name} | ${p.role} | ${p.description} | ${p.outcome} | ${p.skills.join(",")}`)
        .join("\n"),
    );
    setEditBackground(userProfile.background);
    setEditGoals(userProfile.goals.join("\n"));
    setEditing(true);
  }

  function saveProfile() {
    const projects = editProjects
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        return {
          name: parts[0] ?? "",
          role: parts[1] ?? "",
          description: parts[2] ?? "",
          outcome: parts[3] ?? "",
          skills: (parts[4] ?? "").split(/[,，]/).map((s) => s.trim()).filter(Boolean),
        };
      });

    updateUserProfile({
      targetRoles: editRoles.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
      skills: editSkills.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
      projects,
      background: editBackground.trim(),
      goals: editGoals.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setEditing(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-600"
      >
        ← 返回首页
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-gray-800">📊 能力画像</h1>
      <p className="mb-8 text-sm text-gray-500">
        基于真实面试数据和 AI 分析的综合能力评估
      </p>

      {/* ── 用户画像编辑 ── */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">👤 我的信息</h2>
          {!editing ? (
            <button
              onClick={startEdit}
              className="rounded-lg px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              编辑
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={saveProfile}
                className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <EditField label="目标岗位" value={editRoles} onChange={setEditRoles} placeholder="AI产品经理、策略产品经理" hint="用逗号或顿号分隔" />
            <EditField label="技能标签" value={editSkills} onChange={setEditSkills} placeholder="产品设计、数据分析、SQL" hint="用逗号或顿号分隔" />
            <label className="block">
              <span className="text-xs font-medium text-gray-500">项目经历</span>
              <textarea
                value={editProjects}
                onChange={(e) => setEditProjects(e.target.value)}
                placeholder="项目名 | 角色 | 描述 | 成果 | 技能1,技能2"
                rows={3}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">教育/背景</span>
              <textarea
                value={editBackground}
                onChange={(e) => setEditBackground(e.target.value)}
                placeholder="学历、专业、实习经历等"
                rows={2}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">求职目标</span>
              <textarea
                value={editGoals}
                onChange={(e) => setEditGoals(e.target.value)}
                placeholder="每行一个目标"
                rows={2}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            {userProfile.targetRoles?.length > 0 && (
              <ProfileRow label="目标岗位" tags={userProfile.targetRoles ?? []} />
            )}
            {userProfile.skills?.length > 0 && (
              <ProfileRow label="技能" tags={userProfile.skills ?? []} />
            )}
            {userProfile.projects?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-400">项目经历</span>
                <ul className="mt-1 space-y-2">
                  {(userProfile.projects ?? []).map((p, i) => (
                    <li key={i} className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-sm font-medium text-gray-700">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.role} · {p.description}</p>
                      {p.outcome && <p className="text-xs text-emerald-600">成果：{p.outcome}</p>}
                      {p.skills?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(p.skills ?? []).map((s, j) => (
                            <span key={j} className="rounded bg-white px-1.5 py-0.5 text-xs text-gray-500">{s}</span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {userProfile.background && (
              <div>
                <span className="text-xs font-medium text-gray-400">背景</span>
                <p className="mt-0.5 text-sm text-gray-600">{userProfile.background}</p>
              </div>
            )}
            {userProfile.goals?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-400">求职目标</span>
                <ul className="mt-1 space-y-0.5">
                  {(userProfile.goals ?? []).map((g, i) => (
                    <li key={i} className="text-sm text-gray-600">· {g}</li>
                  ))}
                </ul>
              </div>
            )}
            {!userProfile.targetRoles?.length && !userProfile.skills?.length && (
              <p className="text-sm text-gray-400">点击「编辑」完善个人信息，AI 将据此生成更精准的能力画像</p>
            )}
          </div>
        )}
      </section>

      {/* ── 能力画像 ── */}
      {abilityProfile ? (
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              📊 综合评估
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                aiProfile ? "bg-purple-50 text-purple-500" : "bg-gray-100 text-gray-400"
              }`}>
                {aiProfile ? "AI" : "规则"}
              </span>
            </h2>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-lg px-3 py-1 text-xs font-medium text-purple-500
                         hover:bg-purple-50 disabled:opacity-40"
            >
              {loading ? "生成中..." : "🤖 重新生成"}
            </button>
          </div>

          {/* 总评分 */}
          <div className="mb-6 flex items-center gap-4">
            <div className="text-5xl font-bold text-indigo-500">
              {abilityProfile.overallScore}
            </div>
            <p className="text-sm text-gray-500">{abilityProfile.summary}</p>
          </div>

          {/* 评分拆解 */}
          {abilityProfile.scoreBreakdown && (
            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <h3 className="mb-3 text-xs font-semibold text-gray-600">📐 评分来源拆解</h3>
              <div className="grid grid-cols-4 gap-3 text-center">
                <ScoreSource
                  label="面试表现"
                  score={abilityProfile.scoreBreakdown.interviewScore}
                  weight={40}
                  color="text-indigo-500"
                />
                <ScoreSource
                  label="AI诊断"
                  score={abilityProfile.scoreBreakdown.aiDiagnosisScore}
                  weight={30}
                  color="text-purple-500"
                />
                <ScoreSource
                  label="任务执行"
                  score={abilityProfile.scoreBreakdown.taskScore}
                  weight={10}
                  color="text-emerald-500"
                />
                <ScoreSource
                  label="用户画像"
                  score={abilityProfile.scoreBreakdown.profileScore}
                  weight={20}
                  color="text-amber-500"
                />
              </div>
              <p className="mt-2 text-center text-xs text-gray-400">
                综合评分 = 面试×40% + AI诊断×30% + 任务×10% + 画像×20%
              </p>
            </div>
          )}

          {/* 维度评分 */}
          <div className="mb-6 space-y-3">
            {(abilityProfile.dimensions ?? []).map((d) => (
              <div key={d.name}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{d.name}</span>
                    {d.trend && (
                      <span className="text-xs">
                        {d.trend === "up" ? "📈" : d.trend === "down" ? "📉" : "➡️"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-500">{d.score}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      d.score >= 75 ? "bg-emerald-400" : d.score >= 55 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                {d.reasons?.length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {(d.reasons ?? []).join(" · ")}
                  </p>
                )}
                {!d.reasons?.length && d.evidence?.length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-400">{d.evidence[0]}</p>
                )}
                {"trendReason" in d && (d as { trendReason?: string }).trendReason && (
                  <p className="mt-0.5 text-xs text-gray-400 italic">
                    {(d as { trendReason: string }).trendReason}
                  </p>
                )}
                {/* AI 判断依据 */}
                {abilityProfile.evidenceList && (
                  <EvidenceDetail
                    evidenceList={abilityProfile.evidenceList.filter(
                      (e) => e.capability === d.name,
                    )}
                    interviews={interviews}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 历史趋势 */}
          {profileHistory.length >= 2 && (
            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <h3 className="mb-2 text-xs font-semibold text-gray-600">📈 能力趋势</h3>
              <div className="flex items-end gap-3">
                {profileHistory.map((p, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-600">{p.score}</span>
                    <div
                      className="w-8 rounded-t bg-indigo-400"
                      style={{ height: `${p.score * 0.5}px`, minHeight: 8 }}
                    />
                    <span className="text-xs text-gray-400">
                      {new Date(p.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 优势 + 短板 */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-emerald-700">✅ 核心优势</h3>
              <ul className="space-y-1">
                {(abilityProfile.strengths ?? []).map((s, i) => (
                  <li key={i} className="text-sm text-gray-600">· {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-amber-50/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-amber-700">⚠️ 待提升</h3>
              <ul className="space-y-1">
                {(abilityProfile.weaknesses ?? []).map((w, i) => (
                  <li key={i} className="text-sm text-gray-600">· {w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 行动建议 */}
          <div className="rounded-xl bg-indigo-50/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-indigo-700">💡 AI 改进建议</h3>
            <ol className="space-y-1.5">
              {(abilityProfile.nextActions ?? []).map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="font-medium text-indigo-400">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI 成长建议 */}
          {abilityProfile.growthRecommendations &&
            abilityProfile.growthRecommendations.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    🌱 AI 成长建议
                  </h3>
                  <button
                    onClick={handleGenerateGrowth}
                    disabled={growthLoading}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-purple-500
                               transition hover:bg-purple-50 disabled:opacity-40"
                  >
                    {growthLoading ? "生成中..." : "🤖 AI 重新生成"}
                  </button>
                </div>
                {abilityProfile.growthRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 bg-white p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {rec.capability}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            rec.priority === "high"
                              ? "bg-red-50 text-red-500"
                              : rec.priority === "medium"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {rec.priority === "high" ? "P0" : rec.priority === "medium" ? "P1" : "P2"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        ⏱️ {rec.estimatedTime}
                      </span>
                    </div>
                    <p className="mb-1.5 text-sm text-gray-600">
                      <span className="font-medium">问题：</span>
                      {rec.problem}
                    </p>
                    {rec.evidence?.length > 0 && (
                      <p className="mb-1.5 text-xs text-gray-400">
                        📋 依据：{(rec.evidence ?? []).join("；")}
                      </p>
                    )}
                    <p className="mb-2 text-sm font-medium text-indigo-600">
                      🎯 {rec.action}
                    </p>
                    <button
                      onClick={() => {
                        addTask({
                          content: `${rec.action}`,
                          status: "todo",
                          priority: rec.priority,
                          source: "ai",
                          relatedCapability: rec.capability,
                          sourceId: `growth_${Date.now()}`,
                        });
                      }}
                      className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white
                                 transition hover:bg-indigo-600 active:scale-95"
                    >
                      ➕ 添加到待办
                    </button>
                  </div>
                ))}
              </div>
            )}

          {/* 能力成长记录 */}
          {growthEvents.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">📈 能力成长记录</h3>
              {growthEvents.slice(0, 5).map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-emerald-50/50 px-3 py-2"
                >
                  <span className="shrink-0 text-lg">
                    {ev.beforeScore < ev.afterScore ? "📈" : "📊"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {ev.capability}
                      <span className="ml-1.5 text-xs font-bold text-emerald-600">
                        +{ev.afterScore - ev.beforeScore}分
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      新增证据：{ev.evidenceAdded.slice(0, 60)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(ev.timestamp).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-4xl">📊</p>
          <p className="mt-3 text-sm text-gray-500">暂无能力画像数据</p>
          <p className="mt-1 text-xs text-gray-400">
            完成面试并使用 AI 诊断后，系统将自动生成能力画像
          </p>
          {interviews.length > 0 && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-4 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-40"
            >
              {loading ? "生成中..." : "🤖 生成能力画像"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================

function EditField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </label>
  );
}

function ProfileRow({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span
            key={i}
            className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScoreSource({
  label,
  score,
  weight,
  color,
}: {
  label: string;
  score: number;
  weight: number;
  color: string;
}) {
  return (
    <div>
      <p className={`text-xl font-bold ${color}`}>{score}</p>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xs text-gray-300">权重 {weight}%</p>
    </div>
  );
}

function EvidenceDetail({
  evidenceList,
  interviews,
}: {
  evidenceList: CapabilityEvidence[];
  interviews: Interview[];
}) {
  if (evidenceList.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs font-medium text-gray-500">🤖 AI 判断依据</p>
      {evidenceList.map((e, i) => {
        const isHigh = e.confidence >= 0.8;
        const interview = interviews.find(
          (iv) =>
            e.source.includes(iv.company) || e.source.includes("面试"),
        );
        return (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg bg-gray-50 px-2.5 py-2"
          >
            <span
              className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-xs ${
                isHigh
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {isHigh ? "高" : "中"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600">{e.evidence}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                来源：
                {interview ? (
                  <Link
                    href={`/interviews/${interview.id}`}
                    className="text-indigo-500 hover:underline"
                  >
                    {e.source}
                  </Link>
                ) : (
                  <span>{e.source}</span>
                )}
                <span className="ml-1 text-gray-300">
                  · 置信度 {Math.round(e.confidence * 100)}%
                </span>
              </p>
            </div>
          </div>
        );
      })}
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
