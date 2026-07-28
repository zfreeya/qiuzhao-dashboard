/**
 * Interview 业务逻辑
 * — 面试阶段判断、日程筛选、下一场战役查找
 */

import type {
  Interview,
  AIAnalysis,
  Task,
  CapabilityProfileResult,
  CapabilityEvidence,
  GrowthRecommendation,
  CapabilityGrowthEvent,
  InterviewReviewResult,
  UserProfile,
} from "../_shared/InterviewContext";

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ============================================================
// 阶段信息
// ============================================================

export interface PhaseInfo {
  phase: string;
  label: string;
  value: number;
  valueSuffix: string;
}

export function getPhaseInfo(
  interviews: Interview[],
  nextBattle: Interview | null,
): PhaseInfo {
  if (interviews.length === 0) {
    return {
      phase: "秋招准备期",
      label: "已投递",
      value: 0,
      valueSuffix: "家公司",
    };
  }

  const offers = interviews.filter((i) => i.status === "已通过").length;
  if (offers > 0) {
    return {
      phase: "Offer选择期",
      label: "已获得",
      value: offers,
      valueSuffix: "个Offer",
    };
  }

  const now = Date.now();
  const hasUpcoming = interviews.some((i) => {
    const diff = Math.ceil(
      (new Date(i.interviewDate).getTime() - now) / 86_400_000,
    );
    return diff >= 0 && diff <= 7 && i.status !== "未通过";
  });

  if (hasUpcoming && nextBattle) {
    const d = daysUntil(nextBattle.interviewDate);
    return {
      phase: "面试冲刺中",
      label: "距离下一场面试",
      value: Math.max(0, d),
      valueSuffix: "天",
    };
  }

  if (hasUpcoming) {
    return {
      phase: "面试冲刺中",
      label: "已投递",
      value: interviews.length,
      valueSuffix: "家公司",
    };
  }

  return {
    phase: "投递积累期",
    label: "已投递",
    value: interviews.length,
    valueSuffix: "家公司",
  };
}

// ============================================================
// 日程与战役
// ============================================================

export function getUpcomingInterviews(
  interviews: Interview[],
  limit = 5,
): Interview[] {
  const now = Date.now();
  return interviews
    .filter((i) => new Date(i.interviewDate).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.interviewDate).getTime() -
        new Date(b.interviewDate).getTime(),
    )
    .slice(0, limit);
}

export function getNextBattle(
  interviews: Interview[],
): Interview | null {
  const now = Date.now();
  return (
    interviews
      .filter(
        (i) =>
          new Date(i.interviewDate).getTime() > now &&
          i.status !== "未通过",
      )
      .sort(
        (a, b) =>
          new Date(a.interviewDate).getTime() -
          new Date(b.interviewDate).getTime(),
      )[0] ?? null
  );
}

// ============================================================
// 关键指标
// ============================================================

export interface InterviewStats {
  total: number;
  upcoming: number;
  offers: number;
}

export function getInterviewStats(interviews: Interview[]): InterviewStats {
  const now = Date.now();
  return {
    total: interviews.length,
    upcoming: interviews.filter(
      (i) =>
        new Date(i.interviewDate).getTime() > now && i.status !== "未通过",
    ).length,
    offers: interviews.filter((i) => i.status === "已通过").length,
  };
}

// ============================================================
// 候选人画像生成
// ============================================================

/**
 * 从面试数据生成结构化候选人画像
 * 用于 LLM 个性化岗位匹配
 */
export function buildCandidateProfile(
  currentInterview: Interview,
  allInterviews: Interview[],
): string {
  const parts: string[] = [];

  // 1. 项目经历（从当前面试的问答中提取）
  const answeredQuestions = currentInterview.questions.filter(
    (q) => q.answer.trim(),
  );
  if (answeredQuestions.length > 0) {
    parts.push("### 项目经历");
    for (const q of answeredQuestions.slice(0, 3)) {
      // 截取前150字作为摘要
      const summary =
        q.answer.length > 150 ? q.answer.slice(0, 150) + "..." : q.answer;
      parts.push(`- Q: ${q.question}\n  A: ${summary}`);
    }
  }

  // 2. 历史面试表现（从 AI 诊断中提取）
  const reviewedInterviews = allInterviews.filter((i) => i.aiReview);
  if (reviewedInterviews.length > 0) {
    parts.push("\n### 历史面试表现");
    for (const iv of reviewedInterviews.slice(0, 3)) {
      const r = iv.aiReview!;
      parts.push(
        `- ${iv.company} ${iv.position}：匹配度 ${r.matchScore}/100，${r.summary.slice(0, 100)}`,
      );
    }
  }

  // 3. 自我评估（从 summary 提取）
  if (currentInterview.summary.trim()) {
    parts.push("\n### 自我评估");
    parts.push(currentInterview.summary.slice(0, 300));
  }

  // 4. 汇总统计
  const completed = allInterviews.filter(
    (i) => i.status.includes("完成") || i.status === "已通过" || i.status === "未通过",
  ).length;
  const passed = allInterviews.filter((i) => i.status === "已通过").length;
  parts.push(
    `\n### 秋招统计\n已参加 ${completed} 场面试，通过 ${passed} 场`,
  );

  return parts.join("\n");
}

// ============================================================
// 能力成长事件计算
// ============================================================

export function computeGrowthEvents(
  tasks: Task[],
  currentProfile: CapabilityProfileResult,
  previousProfile?: CapabilityProfileResult,
): CapabilityGrowthEvent[] {
  const events: CapabilityGrowthEvent[] = [];

  // 1. 从已完成的 AI 任务提取成长事件
  const completedAITasks = tasks.filter(
    (t) => t.source === "ai" && t.status === "completed" && t.relatedCapability && t.completedAt,
  );

  for (const task of completedAITasks) {
    const cap = task.relatedCapability!;
    const currDim = currentProfile.dimensions.find((d) => d.name === cap);
    const prevDim = previousProfile?.dimensions.find((d) => d.name === cap);

    // 有反馈分析 → 使用分析结果
    if (task.feedbackAnalysis) {
      const fa = task.feedbackAnalysis;
      events.push({
        capability: cap,
        beforeScore: prevDim?.score ?? currDim?.score ?? 50,
        afterScore: Math.min(100, (prevDim?.score ?? currDim?.score ?? 50) + (fa.capabilityImpact?.scoreChange ?? 3)),
        evidenceAdded: fa.extractedEvidence?.[0]?.evidence ?? task.content,
        reason: fa.output,
        timestamp: task.completedAt!,
      });
    } else {
      // Fallback: 简单任务完成事件
      events.push({
        capability: cap,
        beforeScore: prevDim?.score ?? currDim?.score ?? 50,
        afterScore: currDim?.score ?? (prevDim?.score ?? 50) + 3,
        evidenceAdded: task.content,
        reason: `完成AI任务：${task.content.slice(0, 40)}`,
        timestamp: task.completedAt!,
      });
    }
  }

  // 2. 从两次画像对比提取分数变化
  if (previousProfile) {
    for (const dim of currentProfile.dimensions) {
      const prev = previousProfile.dimensions.find((d) => d.name === dim.name);
      if (prev && dim.score !== prev.score) {
        const alreadyRecorded = events.some(
          (e) => e.capability === dim.name && Math.abs(e.afterScore - e.beforeScore) === Math.abs(dim.score - prev.score),
        );
        if (!alreadyRecorded && dim.score > prev.score) {
          events.push({
            capability: dim.name,
            beforeScore: prev.score,
            afterScore: dim.score,
            evidenceAdded: dim.evidence[0] ?? "",
            reason: `能力评估提升 ${dim.score - prev.score} 分`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  // 去重并按时间倒序
  return events
    .filter((e, i, arr) => arr.findIndex((x) => x.reason === e.reason) === i)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

// ============================================================
// 成长建议生成
// ============================================================

function generateGrowthRecommendations(
  dimensions: { name: string; score: number }[],
  evidenceList: CapabilityEvidence[],
): GrowthRecommendation[] {
  const recommendations: GrowthRecommendation[] = [];
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);

  for (const dim of sorted.slice(0, 3)) {
    const dimEvidence = evidenceList.filter((e) => e.capability === dim.name);
    const weaknessEvidence = dimEvidence.filter(
      (e) => e.evidence.includes("不足") || e.evidence.includes("缺少") || e.confidence < 0.7,
    );

    const problem = dim.score < 50
      ? `${dim.name}能力严重不足，需要系统性提升`
      : `${dim.name}得分偏低，存在提升空间`;

    const action = generateSpecificAction(dim.name, dimEvidence, dim.score);

    recommendations.push({
      capability: dim.name,
      problem,
      evidence: weaknessEvidence.length > 0
        ? weaknessEvidence.slice(0, 2).map((e) => e.evidence)
        : dimEvidence.slice(0, 1).map((e) => e.evidence),
      action,
      estimatedTime: dim.score < 50 ? "60分钟" : "30分钟",
      priority: dim.score < 50 ? "high" : dim.score < 65 ? "medium" : "low",
    });
  }

  return recommendations;
}

function generateSpecificAction(
  capability: string,
  evidence: CapabilityEvidence[],
  score: number,
): string {
  const evidenceText = evidence.map((e) => e.evidence).join(" ");
  const lowScore = score < 50;

  switch (capability) {
    case "产品设计":
      return evidenceText.includes("方案") || evidenceText.includes("设计")
        ? `完善产品方案文档：补充用户场景分析和竞品对比，形成完整PRD`
        : `完成1个产品设计练习：从用户需求出发设计功能方案并输出PRD`;
    case "数据分析":
      return evidenceText.includes("指标") || evidenceText.includes("数据")
        ? `补充1个项目指标拆解案例：包含核心指标定义、埋点方案和A/B实验设计`
        : `完成1个费米问题练习 + 学习SQL窗口函数，提升数据量化能力`;
    case "技术理解":
      return evidenceText.includes("AI") || evidenceText.includes("模型")
        ? `深入理解1个AI模型原理：输出技术文档，包含适用场景和局限性分析`
        : `学习LLM基础概念：完成1篇技术总结，覆盖Transformer、RAG、Agent`;
    case "沟通表达":
      return `录制1次模拟面试：使用STAR法则回答3个高频问题，回看并优化表达`;
    case "项目经验":
      return lowScore
        ? `补充1个完整的项目复盘：包含背景、目标、个人贡献、量化结果和反思`
        : `完善项目描述：为每个项目补充可量化的成果指标（如提升X%、节省Y天）`;
    default:
      return lowScore
        ? `针对性学习${capability}相关知识，完成1个实践练习`
        : `补充${capability}相关的实践案例或证书`;
  }
}

// ============================================================
// 能力画像生成（本地计算 + 未来 LLM 增强）
// ============================================================

// ============================================================
// 能力评分模型 — 加权计算
// ============================================================

/** 权重常量 */
const WEIGHTS = {
  interview: 0.4,
  aiDiagnosis: 0.3,
  task: 0.1,
  profile: 0.2,
} as const;

/** 计算单个维度的子得分（0-100） */
function computeSubScore(
  name: string,
  interviews: Interview[],
  aiAnalyses: AIAnalysis[],
  tasks: Task[],
  userProfile?: UserProfile,
  evidenceList?: CapabilityEvidence[],
): {
  interviewScore: number;
  aiDiagnosisScore: number;
  taskScore: number;
  profileScore: number;
  evidence: string[];
  reasons: string[];
} {
  const reasons: string[] = [];
  const dimEvidence = evidenceList?.filter((e) => e.capability === name) ?? [];

  // 使用 evidence 替代关键词匹配
  if (dimEvidence.length > 0) {
    // Evidence 驱动模式
    const highConfidence = dimEvidence.filter((e) => e.confidence >= 0.7);
    const interviewsEv = dimEvidence.filter((e) => e.source.includes("面试"));
    const aiEv = dimEvidence.filter((e) => e.source.includes("AI"));
    const projectEv = dimEvidence.filter((e) => e.source.includes("项目"));

    const interviewScore = interviewsEv.length > 0
      ? Math.round(60 + highConfidence.filter((e) => e.source.includes("面试")).length * 10)
      : 40;

    const aiDiagnosisScore = aiEv.length > 0
      ? Math.round(60 + highConfidence.filter((e) => e.source.includes("AI")).length * 10)
      : 40;

    const taskScore = 50; // Evidence 不直接反映任务完成率

    const profileScore = projectEv.length > 0
      ? Math.round(60 + highConfidence.filter((e) => e.source.includes("项目")).length * 10)
      : 40;

    reasons.push(`基于 ${dimEvidence.length} 条证据`);
    if (highConfidence.length > 0) reasons.push(`${highConfidence.length} 条高置信度证据`);
    if (interviewsEv.length > 0) reasons.push(`${interviewsEv.length} 条来自面试`);
    if (projectEv.length > 0) reasons.push(`${projectEv.length} 条来自项目`);

    return {
      interviewScore: Math.min(100, interviewScore),
      aiDiagnosisScore: Math.min(100, aiDiagnosisScore),
      taskScore: Math.min(100, taskScore),
      profileScore: Math.min(100, profileScore),
      evidence: dimEvidence.slice(0, 2).map((e) => e.evidence),
      reasons: reasons.slice(0, 4),
    };
  }

  // Fallback: 关键词匹配模式
  const evidence: string[] = [];

  let interviewScore = 0;
  const reviewed = interviews.filter((i) => i.aiReview);
  if (reviewed.length > 0) {
    const avgMatch = reviewed.reduce((s, iv) => s + (iv.aiReview?.matchScore ?? 50), 0) / reviewed.length;
    let keywordBonus = 0;
    for (const iv of reviewed) {
      const r = iv.aiReview!;
      if ([r.summary, ...r.strengths, ...r.weaknesses].some((t) => t.includes(name))) {
        keywordBonus += 5;
        evidence.push(`${iv.company} 面试中体现了${name}`);
      }
    }
    interviewScore = Math.round(avgMatch + Math.min(keywordBonus, 15));
    reasons.push(`${reviewed.length} 场面试平均匹配度 ${Math.round(avgMatch)}`);
  } else {
    interviewScore = 30;
    reasons.push("暂无 AI 诊断数据");
  }

  let aiDiagnosisScore = 0;
  const reviews = aiAnalyses.filter((a) => a.type === "interview_review");
  let positiveMatch = 0;
  let negativeMatch = 0;
  for (const a of reviews) {
    const r = a.result as InterviewReviewResult;
    if (r.strengths.some((s) => s.includes(name) || s.includes(name.slice(0, 2)))) { positiveMatch++; evidence.push(`AI 诊断识别到${name}优势`); }
    if (r.weaknesses.some((w) => w.includes(name) || w.includes(name.slice(0, 2)))) { negativeMatch++; evidence.push(`AI 诊断指出${name}不足`); }
  }
  aiDiagnosisScore = reviews.length > 0
    ? Math.round(60 + (positiveMatch / reviews.length) * 30 - (negativeMatch / reviews.length) * 20)
    : 30;
  if (reviews.length > 0) reasons.push(`${reviews.length} 条 AI 诊断，${positiveMatch} 优/${negativeMatch} 缺`);

  let taskScore = 0;
  const relatedTasks = tasks.filter((t) => t.content.includes(name) || t.content.includes(name.slice(0, 2)));
  if (relatedTasks.length > 0) {
    const completed = relatedTasks.filter((t) => t.status === "completed").length;
    const rate = completed / relatedTasks.length;
    taskScore = Math.round(40 + rate * 50);
    reasons.push(`${name}相关任务完成率 ${Math.round(rate * 100)}%`);
    if (completed > 0) evidence.push(`完成 ${completed}/${relatedTasks.length} 项${name}任务`);
  } else { taskScore = 50; }

  let profileScore = 0;
  if (userProfile) {
    const hasSkill = userProfile.skills.some((s) => s.includes(name) || name.includes(s));
    const hasProject = userProfile.projects.some((p) => p.name.includes(name) || p.skills.some((s) => s.includes(name) || name.includes(s)));
    const hasRole = userProfile.targetRoles.some((r) => r.includes(name) || name.includes(r));
    profileScore = hasSkill && hasProject ? 85 : hasSkill ? 65 : (hasProject || hasRole) ? 50 : 35;
    if (hasSkill) reasons.push("用户自评技能包含此项");
    if (hasProject) reasons.push("用户项目经历涉及此项");
    if (hasRole) reasons.push("目标岗位要求此项能力");
  } else { profileScore = 30; }

  return {
    interviewScore: Math.min(100, Math.max(0, interviewScore)),
    aiDiagnosisScore: Math.min(100, Math.max(0, aiDiagnosisScore)),
    taskScore: Math.min(100, Math.max(0, taskScore)),
    profileScore: Math.min(100, Math.max(0, profileScore)),
    evidence: evidence.slice(0, 2),
    reasons: reasons.slice(0, 4),
  };
}

const PROFILE_DIMENSIONS = [
  "产品设计",
  "数据分析",
  "技术理解",
  "沟通表达",
  "项目经验",
];

// ============================================================
// 趋势计算
// ============================================================

function computeTrend(
  dimensionName: string,
  currentScore: number,
  previousProfile?: CapabilityProfileResult,
): { trend: "up" | "stable" | "down"; trendReason: string } {
  if (!previousProfile) {
    return { trend: "stable", trendReason: "首次评估，暂无趋势数据" };
  }

  const prevDim = previousProfile.dimensions.find((d) => d.name === dimensionName);
  if (!prevDim) {
    return { trend: "stable", trendReason: "首次评估该维度" };
  }

  const diff = currentScore - prevDim.score;
  if (diff > 5) {
    return { trend: "up", trendReason: `较上次提升 ${diff} 分，继续保持` };
  } else if (diff < -5) {
    return { trend: "down", trendReason: `较上次下降 ${Math.abs(diff)} 分，需关注` };
  }
  return { trend: "stable", trendReason: `与上次持平（变化 ${diff} 分）` };
}

// ============================================================
// 能力画像生成
// ============================================================

export function generateAbilityProfile(
  interviews: Interview[],
  aiAnalyses: AIAnalysis[],
  tasks: Task[],
  userProfile?: UserProfile,
  previousProfile?: CapabilityProfileResult,
  evidenceList?: CapabilityEvidence[],
): CapabilityProfileResult {
  // 每个维度只计算一次子得分（evidence 优先 → 关键词 fallback）
  const dimensionScores = PROFILE_DIMENSIONS.map((name) => ({
    name,
    subs: computeSubScore(name, interviews, aiAnalyses, tasks, userProfile, evidenceList),
  }));

  // 加权得分
  const dimensions = dimensionScores.map(({ name, subs }) => {
    const weightedScore = Math.round(
      subs.interviewScore * WEIGHTS.interview +
      subs.aiDiagnosisScore * WEIGHTS.aiDiagnosis +
      subs.taskScore * WEIGHTS.task +
      subs.profileScore * WEIGHTS.profile,
    );
    const trendInfo = computeTrend(name, weightedScore, previousProfile);
    return {
      name,
      score: weightedScore,
      evidence: subs.evidence,
      reasons: subs.reasons,
      trend: trendInfo.trend,
      trendReason: trendInfo.trendReason,
    };
  });

  // 从已计算的子得分取平均
  const avgSubs = {
    interviewScore: Math.round(
      dimensionScores.reduce((s, d) => s + d.subs.interviewScore, 0) / dimensionScores.length,
    ),
    aiDiagnosisScore: Math.round(
      dimensionScores.reduce((s, d) => s + d.subs.aiDiagnosisScore, 0) / dimensionScores.length,
    ),
    taskScore: Math.round(
      dimensionScores.reduce((s, d) => s + d.subs.taskScore, 0) / dimensionScores.length,
    ),
    profileScore: Math.round(
      dimensionScores.reduce((s, d) => s + d.subs.profileScore, 0) / dimensionScores.length,
    ),
  };

  const overallScore = Math.round(
    avgSubs.interviewScore * WEIGHTS.interview +
    avgSubs.aiDiagnosisScore * WEIGHTS.aiDiagnosis +
    avgSubs.taskScore * WEIGHTS.task +
    avgSubs.profileScore * WEIGHTS.profile,
  );

  const strengths = dimensions
    .filter((d) => d.score >= 65)
    .map((d) => `${d.name}（${d.score}分）`)
    .slice(0, 3);

  const weaknesses = dimensions
    .filter((d) => d.score < 65)
    .map((d) => `${d.name}（${d.score}分）`)
    .slice(0, 3);

  const lowDims = dimensions.filter((d) => d.score < 70);
  const nextActions = lowDims.map((d) => `提升${d.name}：建议完成相关练习和复盘`);

  // 生成成长建议（关联具体问题和证据）
  const growthRecommendations = generateGrowthRecommendations(dimensions, evidenceList ?? []);

  const summary =
    interviews.length === 0
      ? "尚未开始秋招，建议尽早投递并记录面试经历。"
      : strengths.length >= 3
        ? `能力较为均衡，${strengths.map((s) => s.split("（")[0]).join("、")}等方面表现突出，继续保持。`
        : `整体能力有待提升，重点关注${weaknesses.map((w) => w.split("（")[0]).join("、")}等方面。`;

  return {
    overallScore,
    scoreBreakdown: avgSubs,
    evidenceList: evidenceList ?? [],
    dimensions,
    growthRecommendations,
    strengths,
    weaknesses,
    nextActions,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
