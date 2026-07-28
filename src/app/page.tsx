"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useInterviews,
  formatDate,
  type Interview,
  type Task,
  type CapabilityProfileResult,
} from "../_shared/InterviewContext";
import {
  getPhaseInfo,
  getNextBattle,
  generateAbilityProfile,
} from "../services/interviewService";
import { getLatestProfile } from "../services/abilityProfileService";
import { ScheduleCalendar } from "../components/calendar/ScheduleCalendar";
import { getSchedules, type ScheduleEvent } from "../services/scheduleService";
import {
  CalendarCheck,
  Robot,
  Lightbulb,
  Target,
  CheckCircle,
  Lightning,
  ClipboardText,
  Rocket,
  Confetti,
  Plant,
  Clock,
  ArrowRight,
  ChatCircle,
  Plus,
  Warning,
  Alarm,
  Sparkle,
  Fire,
  ChartBar,
  X,
  Sword,
} from "@phosphor-icons/react";

// ============================================================
// 类型定义
// ============================================================

// ============================================================
// 演示数据（全部迁移至 InterviewContext）
// ============================================================

// ============================================================
// 工具函数
// ============================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "早上好";
  if (hour >= 12 && hour < 18) return "下午好";
  return "晚上好";
}

function getPriorityLabel(p: Task["priority"]): string {
  if (p === "high") return "高优";
  if (p === "medium") return "普通";
  return "低优";
}

function getPriorityColor(p: Task["priority"]): string {
  if (p === "high") return "bg-red-50 text-red-600 border-red-200";
  if (p === "medium") return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-brand-50 text-brand-600 border-brand-200";
}

/** 距某日期还剩多少天 */
function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

/** 从 href 中提取 interviewId（用于去重匹配） */
function extractInterviewId(href: string): string | null {
  const match = href.match(/^\/interviews\/(.+)$/);
  return match ? match[1] : null;
}

/** 检查某个 action/advice 的链接是否指向与 nextBattle 相同的面试 */
function targetsSameInterview(href: string, nextBattleId: string): boolean {
  return extractInterviewId(href) === nextBattleId;
}

// ============================================================
// 今日AI建议 — 规则引擎
// ============================================================

interface AdviceResult {
  emoji: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

interface ActionItem {
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  duration: string;
  actionLabel: string;
  actionHref: string;
}

function generateTodayAdvice(opts: {
  phase: string;
  nextBattle: Interview | null;
  latestAIInterview: Interview | null;
  pendingTaskCount: number;
  totalApplyCount: number;
}): AdviceResult {
  const { phase, nextBattle, latestAIInterview, pendingTaskCount, totalApplyCount } = opts;

  // 规则 1：3 天内有面试 → 紧急备战
  if (nextBattle && daysUntil(nextBattle.interviewDate) <= 3) {
    return {
      emoji: "⚡",
      title: "紧急备战",
      body: `${nextBattle.company} ${nextBattle.position} 面试就在 ${daysUntil(nextBattle.interviewDate)} 天后！建议立即复习 JD 要点、准备 3 个 STAR 案例，并模拟自我介绍。`,
      actionLabel: "去准备面试",
      actionHref: `/interviews/${nextBattle.id}`,
    };
  }

  // 规则 2：AI 诊断有不足 → 针对性改进
  if (latestAIInterview?.aiReview?.weaknesses?.length) {
    const topWeakness = latestAIInterview.aiReview.weaknesses[0];
    return {
      emoji: "🎯",
      title: "针对性改进",
      body: `上次 ${latestAIInterview.company} 的 AI 诊断发现：${topWeakness} 建议今天花 30 分钟针对性练习，下次面试前补上这个短板。`,
      actionLabel: "查看诊断详情",
      actionHref: `/interviews/${latestAIInterview.id}`,
    };
  }

  // 规则 3：有待办未完成
  if (pendingTaskCount > 0) {
    return {
      emoji: "📋",
      title: "清空待办",
      body: `还有 ${pendingTaskCount} 项待办未完成。建议按优先级逐个击破，每完成一项都会让你离 Offer 更近一步。`,
      actionLabel: "查看待办",
      actionHref: "#tasks",
    };
  }

  // 规则 4：投递数量偏少
  if (totalApplyCount < 10) {
    return {
      emoji: "🚀",
      title: "扩大投递面",
      body: `目前仅投递 ${totalApplyCount} 家公司，${phase}阶段建议广撒网。今天再去公司库看看，投递 3-5 家匹配度高的岗位。`,
      actionLabel: "去公司库",
      actionHref: "/companies",
    };
  }

  // 规则 5：默认 — 阶段建议
  if (phase.includes("Offer")) {
    return {
      emoji: "🎉",
      title: "Offer选择期",
      body: "恭喜获得 Offer！建议从薪资、成长空间、团队氛围、业务前景四个维度对比评估，做出最适合自己的选择。",
      actionLabel: "查看面试复盘",
      actionHref: "/interviews",
    };
  }
  if (phase.includes("冲刺")) {
    return {
      emoji: "⚡",
      title: "面试冲刺中",
      body: "面试密集期，保持状态：每场面试后用 AI 诊断复盘薄弱环节，针对性改进后迎接下一场。",
      actionLabel: "查看面试复盘",
      actionHref: "/interviews",
    };
  }
  if (phase.includes("投递")) {
    return {
      emoji: "🚀",
      title: "扩大投递面",
      body: "投递积累期，建议优先投递有内推通道的公司。每投递一家后记录 JD 要点，方便后续面试准备。",
      actionLabel: "去公司库",
      actionHref: "/companies",
    };
  }

  return {
    emoji: "🌱",
    title: "秋招准备期",
    body: "秋招刚开始，建议先完善简历和项目经历，浏览公司库确定目标公司清单，有计划地开始投递。",
    actionLabel: "去公司库",
    actionHref: "/companies",
  };
}

// ============================================================
// 今日作战计划 — 规则引擎
// ============================================================

function generateActionPlan(opts: {
  nextBattle: Interview | null;
  latestAIInterview: Interview | null;
  pendingTasks: Task[];
  totalApplyCount: number;
  phase: string;
}): ActionItem[] {
  const items: ActionItem[] = [];
  const { nextBattle, latestAIInterview, pendingTasks, totalApplyCount, phase } = opts;

  // 规则 1：3 天内有面试 → P0 备战
  if (nextBattle && daysUntil(nextBattle.interviewDate) <= 3) {
    const days = daysUntil(nextBattle.interviewDate);
    items.push({
      priority: "high",
      title: `准备 ${nextBattle.company} ${nextBattle.position} 面试`,
      reason: `距离面试还有${days <= 0 ? "不到1" : days}天，优先完成 JD 分析和模拟问答`,
      duration: "45分钟",
      actionLabel: "开始准备 →",
      actionHref: `/interviews/${nextBattle.id}`,
    });
  }

  // 规则 2：AI 诊断有不足 → P1 针对性改进
  if (latestAIInterview?.aiReview?.weaknesses?.length) {
    items.push({
      priority: "medium",
      title: "改善 AI 复盘发现的问题",
      reason: latestAIInterview.aiReview.weaknesses[0],
      duration: "30分钟",
      actionLabel: "查看诊断 →",
      actionHref: `/interviews/${latestAIInterview.id}`,
    });
  }

  // 规则 3：有未完成待办 → P1/P2 清空待办
  const pendingCount = pendingTasks.filter((t) => t.status === "todo").length;
  if (pendingCount > 0) {
    items.push({
      priority: pendingCount >= 3 ? "medium" : "low",
      title: "完成今日待办",
      reason: `还有 ${pendingCount} 项任务未完成，按优先级逐个击破`,
      duration: `${pendingCount * 15}分钟`,
      actionLabel: "查看待办 →",
      actionHref: "#tasks",
    });
  }

  // 规则 4：投递数量少 → P2 扩大投递
  if (totalApplyCount < 10) {
    items.push({
      priority: "low",
      title: "增加岗位投递",
      reason: `当前仅投递 ${totalApplyCount} 家公司，${phase}阶段建议扩大机会池`,
      duration: "30分钟",
      actionLabel: "去公司库 →",
      actionHref: "/companies",
    });
  }

  return items.slice(0, 3);
}

// ============================================================
// 小型子组件
// ============================================================

/** 迷你圆环评分 (用于 AI 诊断摘要卡) */
function MiniScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-sm font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

// ============================================================
// 主页面组件
// ============================================================

export default function Home() {
  // ── 面试 Context ──
  const { interviews, applications, aiAnalyses, tasks, userProfile, hydrated, loadDemoData, addTask, toggleTask, deleteTask, updateTask } = useInterviews();

  // ── 待办表单状态 ──
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");

  // ── 任务反馈状态 ──
  const [feedbackTaskId, setFeedbackTaskId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // ── 独立日程 ──
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  useEffect(() => { setSchedules(getSchedules()); }, []);

  // ── 首页统计 ──
  const homeStats = useMemo(() => {
    if (!hydrated) return { applied: 0, totalInterviews: 0, offers: 0 };
    return {
      applied: applications.length,
      totalInterviews: interviews.length,
      offers: applications.filter((a) => a.status === "已Offer").length,
    };
  }, [applications, interviews, hydrated]);

  // ============================================================
  // 派生数据
  // ============================================================

  const greeting = getGreeting();

  const todayLabel = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // ── 下一场战役 ──
  const nextBattle = useMemo(
    () => hydrated ? getNextBattle(interviews) : null,
    [interviews, hydrated],
  );

  // ── 阶段信息（基于真实数据动态判断） ──
  const phaseInfo = useMemo(
    () => getPhaseInfo(interviews, nextBattle),
    [interviews, nextBattle],
  );

  // ── 最新 AI 诊断 ──
  const latestAIInterview = useMemo(() => {
    if (!hydrated) return null;
    return (
      interviews
        .filter((i) => i.aiReview)
        .sort(
          (a, b) =>
            new Date(b.aiReview!.generatedAt).getTime() -
            new Date(a.aiReview!.generatedAt).getTime(),
        )[0] ?? null
    );
  }, [interviews, hydrated]);

  // ── 今日 AI 建议 ──
  const todayAdvice = useMemo(() => {
    if (!hydrated) return null;
    return generateTodayAdvice({
      phase: phaseInfo.phase,
      nextBattle,
      latestAIInterview,
      pendingTaskCount: tasks.filter((t) => t.status === "todo").length,
      totalApplyCount: applications.length,
    });
  }, [hydrated, phaseInfo, nextBattle, latestAIInterview, tasks, applications.length]);

  // ── 去重标记：AI 建议是否与 NextBattleCard 重复 ──
  const adviceDupedWithNextBattle =
    todayAdvice && nextBattle && targetsSameInterview(todayAdvice.actionHref, nextBattle.id);

  // ── 能力画像（AI 优先 → 规则降级） ──
  const aiProfile = useMemo(
    () => getLatestProfile(aiAnalyses),
    [aiAnalyses],
  );

  const abilityProfile = useMemo(() => {
    if (aiProfile) return aiProfile;
    if (!hydrated || interviews.length === 0) return null;
    return generateAbilityProfile(interviews, aiAnalyses, tasks, userProfile);
  }, [aiProfile, hydrated, interviews, aiAnalyses, tasks, userProfile]);

  // ── 今日作战计划（展示层去重：过滤与 nextBattle 重复的面试准备任务） ──
  const actionPlan = useMemo(() => {
    if (!hydrated) return [] as ActionItem[];
    const raw = generateActionPlan({
      nextBattle,
      latestAIInterview,
      pendingTasks: tasks,
      totalApplyCount: applications.length,
      phase: phaseInfo.phase,
    });
    // 去重：如果作战计划中某条行动指向 nextBattle 已展示的同一面试，移除
    // （NextBattleCard 已提供该面试的准备入口，不需要在作战计划中重复）
    if (nextBattle) {
      return raw.filter((item) => !targetsSameInterview(item.actionHref, nextBattle.id));
    }
    return raw;
  }, [hydrated, nextBattle, latestAIInterview, tasks, applications.length, phaseInfo.phase]);

  // ── 待办排序 ──
  const sortedTasks = useMemo(() => {
    const order: Record<Task["priority"], number> = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      const aDone = a.status === "completed" || a.status === "ignored";
      const bDone = b.status === "completed" || b.status === "ignored";
      if (aDone !== bDone) return aDone ? 1 : -1;
      return order[a.priority] - order[b.priority];
    });
  }, [tasks]);

  const doneCount = tasks.filter((t) => t.status === "completed").length;


  if (!hydrated) return <HomeSkeleton />;

  // ============================================================
  // 操作函数
  // ============================================================

  function handleAddTask() {
    const trimmed = newTask.trim();
    if (!trimmed) return;
    addTask({ content: trimmed, status: "todo", priority: newPriority, source: "user" });
    setNewTask("");
  }

  function handleToggleTask(id: string) {
    toggleTask(id);
  }

  function handleDeleteTask(id: string) {
    deleteTask(id);
  }

  // ── 任务反馈处理 ──

  async function handleSubmitFeedback(taskId: string) {
    if (!feedbackText.trim()) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setFeedbackLoading(true);
    try {
      const resp = await fetch("/api/ai/analyze-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskContent: task.content,
          feedback: feedbackText.trim(),
          capability: task.relatedCapability ?? "综合",
          currentScore: 50,
        }),
      });
      if (resp.ok) {
        const analysis = await resp.json();
        updateTask(taskId, {
          feedback: feedbackText.trim(),
          feedbackStatus: "analyzed",
          feedbackAnalysis: analysis,
        });
      }
    } finally {
      setFeedbackLoading(false);
      setFeedbackTaskId(null);
      setFeedbackText("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAddTask();
  }

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ═══════════════════════════════════════════
          HERO 区：秋招作战驾驶舱
          ═══════════════════════════════════════════ */}
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white shadow-sm">
        <div className="p-6 sm:p-8">
          {/* 第一行：日期 + 问候 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-100">{todayLabel}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {greeting}，同学！
              </h1>
            </div>
            {/* 阶段徽章 */}
            <div className="hidden rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm sm:block">
              <p className="text-xs text-brand-100">当前阶段</p>
              <p className="text-sm font-bold">{phaseInfo.phase}</p>
            </div>
          </div>

          {/* 副标题 */}
          <p className="mt-2 max-w-lg text-sm text-brand-100/80">
            每一次投递都值得被记录，每一个 Offer 都始于行动
          </p>

          {/* 第二行：阶段 + 倒计时 + 关键数字 */}
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* 移动端阶段 */}
            <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm sm:hidden">
              <p className="text-xs text-brand-100">{phaseInfo.phase}</p>
            </div>

            {/* 倒计时 */}
            <div className="flex items-baseline gap-2 rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <span className="text-xs text-brand-100">{phaseInfo.label}</span>
              <span className="text-2xl font-bold tabular-nums">{phaseInfo.value}</span>
              <span className="text-sm text-brand-100">{phaseInfo.valueSuffix}</span>
            </div>

            {/* 分隔线 */}
            <div className="hidden h-8 w-px bg-white/20 sm:block" />

            {/* 关键数字 */}
            <div className="flex gap-4 sm:gap-6">
              <StatBadge label="已投递" value={homeStats.applied} />
              <StatBadge label="总面试" value={homeStats.totalInterviews} accent />
              <StatBadge label="Offer" value={homeStats.offers} highlight />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5 秒扫描区：三张关键信息卡
          ═══════════════════════════════════════════ */}
      <div className="mb-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* ── 卡片 1：下一场战役卡 ── */}
        <NextBattleCard interview={nextBattle} onLoadDemo={loadDemoData} />

        {/* ── 卡片 2：AI 诊断摘要 ── */}
        <AIDiagnosisCard interview={latestAIInterview} />

        {/* ── 卡片 3：今日 AI 建议（与 NextBattle 指向同一面试时隐藏） ── */}
        {!adviceDupedWithNextBattle && (
          <TodayAdviceCard advice={todayAdvice} />
        )}
      </div>

      {/* ═══════════════════════════════════════════
          今日作战计划
          ═══════════════════════════════════════════ */}
      {actionPlan.length > 0 && <ActionCenter items={actionPlan} />}

      {/* ═══════════════════════════════════════════
          面试日程（全宽）
          ═══════════════════════════════════════════ */}
      <section className="card mb-6 p-6">
        <ScheduleCalendar
          schedules={schedules}
          onRefresh={() => {
            try {
              setSchedules(getSchedules());
            } catch { /* ignore */ }
          }}
        />
      </section>

      {/* ═══════════════════════════════════════════
          今日待办
          ═══════════════════════════════════════════ */}
      <section
        id="tasks"
        className="card p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-800">
            <CheckCircle size={22} weight="duotone" className="text-brand-500" />
            今日待办
          </h2>
          <span className="text-xs text-brand-400">
            {doneCount}/{tasks.length} 已完成
          </span>
        </div>

        {/* 添加任务行 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入新任务，按回车添加…"
            className="input-base min-w-0 flex-[2]"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
            className="flex-[0.7] rounded-xl border border-brand-200 bg-white px-3 py-2.5
                       text-sm outline-none transition focus:border-brand-400"
          >
            <option value="high">高优</option>
            <option value="medium">普通</option>
            <option value="low">低优</option>
          </select>
          <button
            onClick={handleAddTask}
            className="btn-primary flex-[0.6]"
          >
            <Plus size={14} weight="bold" />
            添加
          </button>
        </div>

        {/* 任务列表 */}
        {tasks.length === 0 ? (
          <p className="flex items-center justify-center gap-1.5 py-8 text-center text-sm text-brand-400">
            <Sparkle size={16} weight="duotone" />
            还没有任务，来添加第一个吧
          </p>
        ) : (
          <ul className="space-y-1">
            {sortedTasks.map((task) => (
              <Fragment key={task.id}>
                <li
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-brand-50/50 ${
                  task.status !== "todo" ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  id={`task-${task.id}`}
                  checked={task.status === "completed"}
                  onChange={() => handleToggleTask(task.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={`min-w-0 flex-1 truncate text-sm cursor-pointer ${
                    task.status !== "todo" ? "text-brand-400 line-through" : "text-brand-700"
                  }`}
                >
                  {task.content}
                </label>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}
                >
                  {/* 移动端缩写 */}
                  <span className="sm:hidden">
                    {task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}
                  </span>
                  <span className="hidden sm:inline">{getPriorityLabel(task.priority)}</span>
                </span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="shrink-0 text-brand-300 transition-colors duration-150 hover:text-red-500"
                  title="删除"
                  aria-label="删除任务"
                >
                  <X size={14} weight="bold" />
                </button>
              </li>
              {/* AI 任务反馈 */}
              {task.source === "ai" &&
                task.status === "completed" &&
                task.feedbackStatus !== "analyzed" && (
                  <li className="ml-7 rounded-lg border border-dashed border-brand-200 bg-brand-50/30 px-3 py-2">
                    {feedbackTaskId === task.id ? (
                      <div className="flex gap-2">
                        <input
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="简述你的完成成果..."
                          className="flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmitFeedback(task.id);
                            if (e.key === "Escape") setFeedbackTaskId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSubmitFeedback(task.id)}
                          disabled={feedbackLoading || !feedbackText.trim()}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs text-white hover:bg-brand-600 disabled:opacity-40"
                        >
                          {feedbackLoading ? "..." : "提交"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setFeedbackTaskId(task.id)}
                        className="inline-flex items-center gap-1 text-xs text-brand-500 transition-colors duration-150 hover:text-brand-700"
                      >
                        <ChatCircle size={12} weight="regular" />
                        反馈成果（提升能力评分）
                      </button>
                    )}
                  </li>
                )}
              {/* 已分析反馈 */}
              {task.feedbackAnalysis && (
                <li className="ml-7 rounded-lg bg-emerald-50/50 px-3 py-1.5">
                  <p className="text-xs text-emerald-700">
                    <Robot size={12} weight="fill" className="mr-1 inline align-[-1px]" />
                    {task.feedbackAnalysis.output}
                    {task.feedbackAnalysis.capabilityImpact && (
                      <span className="ml-1 font-medium">
                        {task.feedbackAnalysis.capabilityImpact.capability}
                        +{task.feedbackAnalysis.capabilityImpact.scoreChange}分
                      </span>
                    )}
                  </p>
                </li>
              )}
              </Fragment>
            ))}
          </ul>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          能力画像
          ═══════════════════════════════════════════ */}
      {abilityProfile && (
        <AbilityProfileCard
          profile={abilityProfile}
          source={aiProfile ? "ai" : "rule"}
        />
      )}
    </div>
  );
}

// ============================================================
// Hero 区辅助组件
// ============================================================

function StatBadge({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-2xl font-bold tabular-nums ${
          highlight ? "text-amber-300" : accent ? "text-brand-100" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-brand-100/70">{label}</p>
    </div>
  );
}

// ============================================================
// 下一场战役卡
// ============================================================

function NextBattleCard({ interview, onLoadDemo }: { interview: Interview | null; onLoadDemo: () => void }) {
  // 有数据：带链接的卡
  if (interview) {
    const remaining = daysUntil(interview.interviewDate);
    const isUrgent = remaining <= 3;
    const isToday = remaining <= 0;

    return (
      <Link
        href={`/interviews/${interview.id}`}
        className={`group card block p-5 ${
          isUrgent
            ? "border-l-[3px] border-l-amber-400"
            : ""
        }`}
      >
        {/* 卡片头 */}
        <div className="mb-3 flex items-center gap-2">
          {isUrgent ? (
            <Sword size={20} weight="duotone" className="text-amber-500" />
          ) : (
            <CalendarCheck size={20} weight="duotone" className="text-brand-400" />
          )}
          <h3 className="text-sm font-semibold text-brand-800">
            {isToday ? "今日战役" : isUrgent ? "即将到来" : "下一场战役"}
          </h3>
          {isUrgent && (
            <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-500">
              {isToday ? "今天" : `${remaining}天后`}
            </span>
          )}
        </div>

        {/* 公司 + 岗位 */}
        <p className="mb-1 text-base font-bold text-brand-900 transition-colors duration-150 group-hover:text-brand-600">
          {interview.company}
        </p>
        <p className="mb-3 text-sm text-brand-500">{interview.position}</p>

        {/* 底部信息 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-400">{formatDate(interview.interviewDate)}</span>
        </div>

        {/* 紧迫提示 */}
        {isUrgent && !isToday && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-amber-700">
            <Alarm size={14} weight="fill" />
            还有 {remaining} 天，建议立即开始准备
          </div>
        )}
        {isToday && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-red-600">
            <Fire size={14} weight="fill" />
            今天就是面试日，加油！
          </div>
        )}
      </Link>
    );
  }

  // 空态
  return (
    <div className="card border-dashed border-brand-200 bg-brand-50/30 p-5">
      <div className="mb-3 flex items-center gap-2">
        <CalendarCheck size={20} weight="duotone" className="text-brand-400" />
        <h3 className="text-sm font-semibold text-brand-800">下一场战役</h3>
      </div>
      <p className="mb-3 text-sm text-brand-400">暂无即将到来的面试</p>
      <div className="flex items-center gap-3">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700"
        >
          去公司库投递 <ArrowRight size={12} weight="bold" />
        </Link>
        <button
          onClick={onLoadDemo}
          className="text-xs text-brand-400 transition-colors duration-150 hover:text-brand-600"
        >
          加载示例数据
        </button>
      </div>
    </div>
  );
}

// ============================================================
// AI 诊断摘要卡
// ============================================================

function AIDiagnosisCard({ interview }: { interview: Interview | null }) {
  if (interview?.aiReview) {
    const review = interview.aiReview;
    return (
      <Link
        href={`/interviews/${interview.id}`}
        className="group card block border-l-[3px] border-l-purple-400 p-5"
      >
        {/* 卡片头 */}
        <div className="mb-4 flex items-center gap-2">
          <Robot size={20} weight="duotone" className="text-purple-500" />
          <h3 className="text-sm font-semibold text-brand-800">最新 AI 诊断</h3>
          <span className="ml-auto text-xs text-brand-400">
            {(() => {
              const d = new Date(review.generatedAt);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            })()}
          </span>
        </div>

        {/* 评分 + 公司 */}
        <div className="mb-3 flex items-center gap-3">
          <MiniScoreRing score={review.matchScore} />
          <div>
            <p className="text-sm font-bold text-brand-900 transition-colors duration-150 group-hover:text-brand-600">
              {interview.company}
            </p>
            <p className="text-xs text-brand-500">{interview.position}</p>
          </div>
        </div>

        {/* 一句话摘要 */}
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-brand-600">
          {review.summary}
        </p>

        {/* 优势 / 不足 micro 版 */}
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-emerald-100/70 px-2 py-0.5 text-emerald-700">
            <CheckCircle size={12} weight="fill" className="mr-1 inline align-[-1px]" />
            {review.strengths.length} 条优势
          </span>
          <span className="rounded-full bg-amber-100/70 px-2 py-0.5 text-amber-700">
            <Warning size={12} weight="fill" className="mr-1 inline align-[-1px]" />
            {review.weaknesses.length} 条不足
          </span>
        </div>
      </Link>
    );
  }

  // 空态
  return (
    <div className="card border-dashed border-purple-200 bg-purple-50/30 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Robot size={20} weight="duotone" className="text-purple-400" />
        <h3 className="text-sm font-semibold text-brand-800">AI 诊断摘要</h3>
      </div>
      <p className="mb-3 text-sm text-brand-400">
        完成面试复盘后，让 AI 帮你诊断表现
      </p>
      <Link
        href="/interviews"
        className="inline-flex items-center gap-1 text-xs font-medium text-purple-500 transition-colors duration-150 hover:text-purple-600"
      >
        去面试复盘 <ArrowRight size={12} weight="bold" />
      </Link>
    </div>
  );
}

// ============================================================
// 今日 AI 建议卡
// ============================================================

function TodayAdviceCard({ advice }: { advice: ReturnType<typeof generateTodayAdvice> | null }) {
  /** 根据 advice emoji 映射到 Phosphor 图标 */
  function getAdviceIcon(emoji: string) {
    const map: Record<string, React.ReactNode> = {
      "⚡": <Lightning size={20} weight="duotone" className="text-amber-500" />,
      "🎯": <Target size={20} weight="duotone" className="text-purple-500" />,
      "📋": <ClipboardText size={20} weight="duotone" className="text-brand-500" />,
      "🚀": <Rocket size={20} weight="duotone" className="text-blue-500" />,
      "🎉": <Confetti size={20} weight="duotone" className="text-pink-500" />,
      "🌱": <Plant size={20} weight="duotone" className="text-emerald-500" />,
    };
    return map[emoji] ?? <Lightbulb size={20} weight="duotone" className="text-brand-500" />;
  }

  // 加载中
  if (!advice) {
    return (
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb size={20} weight="duotone" className="text-brand-400" />
          <h3 className="text-sm font-semibold text-brand-800">今日 AI 建议</h3>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-brand-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-brand-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-brand-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="card border-l-[3px] border-l-emerald-400 p-5">
      {/* 卡片头 */}
      <div className="mb-3 flex items-center gap-2">
        {getAdviceIcon(advice.emoji)}
        <h3 className="text-sm font-semibold text-brand-800">{advice.title}</h3>
      </div>

      {/* 建议正文 */}
      <p className="mb-4 text-sm leading-relaxed text-brand-700">{advice.body}</p>

      {/* 行动按钮 */}
      <Link
        href={advice.actionHref}
        className="btn-primary bg-emerald-500 text-xs hover:bg-emerald-600"
      >
        {advice.actionLabel} <ArrowRight size={12} weight="bold" />
      </Link>
    </div>
  );
}

// ============================================================
// 今日作战计划模块
// ============================================================

function ActionCenter({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="card mb-6 p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-brand-800">
        <Target size={22} weight="duotone" className="text-accent-500" />
        今日作战计划
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item, i) => (
          <ActionCard key={i} item={item} />
        ))}
      </div>
    </section>
  );
}

function ActionCard({ item }: { item: ActionItem }) {
  const config: Record<
    ActionItem["priority"],
    { label: string; bg: string; badge: string; dot: string }
  > = {
    high: {
      label: "P0",
      bg: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-600",
      dot: "bg-red-400",
    },
    medium: {
      label: "P1",
      bg: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-600",
      dot: "bg-amber-400",
    },
    low: {
      label: "P2",
      bg: "bg-brand-50 border-brand-200",
      badge: "bg-brand-100 text-brand-600",
      dot: "bg-brand-300",
    },
  };
  const c = config[item.priority];

  return (
    <Link
      href={item.actionHref}
      className={`group flex flex-col rounded-xl border ${c.bg} p-4 transition-shadow duration-200 hover:shadow-md`}
    >
      {/* 优先级标签 + 标题 */}
      <div className="mb-2 flex items-start gap-2">
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${c.badge}`}
        >
          {c.label}
        </span>
        <h4 className="text-sm font-semibold text-brand-800 transition-colors duration-150 group-hover:text-brand-600">
          {item.title}
        </h4>
      </div>

      {/* 原因 */}
      <p className="mb-3 flex-1 text-xs leading-relaxed text-brand-600">
        {item.reason}
      </p>

      {/* 耗时 + 行动 */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-brand-400">
          <Clock size={12} weight="regular" />
          {item.duration}
        </span>
        <span className="text-xs font-medium text-brand-600 transition-colors duration-150 group-hover:text-brand-700">
          {item.actionLabel}
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// 能力画像卡片
// ============================================================

function AbilityProfileCard({
  profile,
  source,
}: {
  profile: CapabilityProfileResult;
  source: "ai" | "rule";
}) {
  const scoreColor =
    profile.overallScore >= 75
      ? "text-emerald-500"
      : profile.overallScore >= 55
        ? "text-amber-500"
        : "text-red-500";

  return (
    <section className="card mb-6 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>
            {profile.overallScore}
          </span>
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-800">
              <ChartBar size={18} weight="duotone" className="text-brand-500" />
              能力画像
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                source === "ai" ? "bg-purple-50 text-purple-500" : "bg-brand-100 text-brand-600"
              }`}>
                {source === "ai" ? "AI" : "规则"}
              </span>
            </h2>
            <p className="text-xs text-brand-400">
              {profile.strengths[0]?.split("（")[0] ?? "—"}
              {profile.weaknesses[0] ? ` · ${profile.weaknesses[0].split("（")[0]}` : ""}
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600
                     transition-colors duration-150 hover:bg-brand-50"
        >
          查看详情 <ArrowRight size={12} weight="bold" />
        </Link>
      </div>
    </section>
  );
}

/** hydration 完成前的骨架屏 */
function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ── Hero 骨架 ── */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-4 w-48 animate-pulse rounded-lg bg-white/20" />
            <div className="h-8 w-64 animate-pulse rounded-lg bg-white/25" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-white/20" />
          </div>
          <div className="hidden sm:block">
            <div className="h-16 w-28 animate-pulse rounded-full bg-white/15" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="h-16 w-36 animate-pulse rounded-xl bg-white/15" />
          <div className="hidden h-8 w-px bg-white/20 sm:block" />
          <div className="flex gap-4 sm:gap-6">
            <div className="h-12 w-16 animate-pulse rounded-lg bg-white/15" />
            <div className="h-12 w-16 animate-pulse rounded-lg bg-white/15" />
            <div className="h-12 w-16 animate-pulse rounded-lg bg-white/15" />
          </div>
        </div>
      </div>

      {/* ── 三卡片骨架 ── */}
      <div className="mb-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-5 animate-pulse rounded bg-brand-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-brand-100" />
            </div>
            <div className="h-5 w-32 animate-pulse rounded bg-brand-100" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-brand-50" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-brand-50" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-brand-50" />
            </div>
          </div>
        ))}
      </div>

      {/* ── 作战计划骨架 ── */}
      <div className="card mb-6 p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-brand-100" />
          <div className="h-5 w-36 animate-pulse rounded bg-brand-100" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-brand-100 bg-brand-50/30 p-4">
              <div className="h-16 animate-pulse rounded-lg bg-brand-100" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 日程骨架 ── */}
      <div className="card mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-brand-100" />
            <div className="h-5 w-28 animate-pulse rounded bg-brand-100" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-xl bg-brand-100" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-8 animate-pulse rounded bg-brand-50" />
              <div className="h-12 flex-1 animate-pulse rounded-lg border border-brand-100 bg-brand-50/30" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 待办骨架 ── */}
      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-brand-100" />
            <div className="h-5 w-28 animate-pulse rounded bg-brand-100" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-brand-50" />
        </div>
        <div className="mb-6 flex gap-2">
          <div className="h-10 flex-[2] animate-pulse rounded-xl bg-brand-100" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-brand-100" />
          <div className="h-10 w-16 animate-pulse rounded-xl bg-brand-100" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="h-4 w-4 animate-pulse rounded bg-brand-100" />
              <div className="h-4 flex-1 animate-pulse rounded bg-brand-50" />
              <div className="h-5 w-12 animate-pulse rounded-full bg-brand-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
