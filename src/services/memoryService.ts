/**
 * 记忆服务 — 从现有数据聚合生成 UserMemory
 *
 * 数据来源：
 *   interviews.aiReview → strengths / weaknesses / interviewPatterns
 *   AIAnalysis (capability_profile) → dimensions / 趋势
 *   tasks → learningGoals 进度
 *   userProfile → targetRoles / projects
 */

import type {
  Interview,
  AIAnalysis,
  Task,
  UserProfile,
  UserMemory,
  InterviewPattern,
  LearningGoal,
  CapabilityProfileResult,
  GrowthRecommendation,
} from "../_shared/InterviewContext";

// ============================================================
// 公开 API
// ============================================================

/**
 * 从现有数据自动聚合生成 UserMemory
 */
export function generateUserMemory(
  interviews: Interview[],
  aiAnalyses: AIAnalysis[],
  tasks: Task[],
  userProfile?: UserProfile,
): UserMemory {
  return {
    strengths: extractStrengths(interviews, aiAnalyses),
    weaknesses: extractWeaknesses(interviews, aiAnalyses),
    targetRoles: userProfile?.targetRoles ?? [],
    projects: userProfile?.projects ?? [],
    interviewPatterns: extractInterviewPatterns(interviews),
    learningGoals: extractLearningGoals(interviews, aiAnalyses, tasks),
    aiSummary: buildAISummary(interviews, aiAnalyses, tasks, userProfile),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 内部：strengths / weaknesses
// ============================================================

/** 从 interviews.aiReview + capabilityProfile 中聚合去重 strengths */
function extractStrengths(
  interviews: Interview[],
  aiAnalyses: AIAnalysis[],
): string[] {
  const freq = new Map<string, number>();

  // 来源 1：面试 AIReview
  for (const iv of interviews) {
    for (const s of iv.aiReview?.strengths ?? []) {
      freq.set(s, (freq.get(s) ?? 0) + 1);
    }
  }

  // 来源 2：能力画像
  const profile = getLatestCapabilityProfile(aiAnalyses);
  if (profile) {
    for (const s of profile.strengths) {
      freq.set(s, (freq.get(s) ?? 0) + 1);
    }
  }

  // 按频率降序取 top 6
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k);
}

/** 从 interviews.aiReview + capabilityProfile 中聚合去重 weaknesses */
function extractWeaknesses(
  interviews: Interview[],
  aiAnalyses: AIAnalysis[],
): string[] {
  const freq = new Map<string, number>();

  for (const iv of interviews) {
    for (const w of iv.aiReview?.weaknesses ?? []) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  const profile = getLatestCapabilityProfile(aiAnalyses);
  if (profile) {
    for (const w of profile.weaknesses) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k);
}

// ============================================================
// 内部：interviewPatterns
// ============================================================

/** 维度关键词 → 能力名映射 */
const DIMENSION_KEYWORDS: Record<string, string> = {
  产品: "产品设计",
  设计: "产品设计",
  方案: "产品设计",
  数据: "数据分析",
  量化: "数据分析",
  指标: "数据分析",
  技术: "技术理解",
  AI: "技术理解",
  ML: "技术理解",
  算法: "技术理解",
  沟通: "沟通表达",
  表达: "沟通表达",
  协作: "沟通表达",
  项目: "项目经验",
  推动: "项目经验",
  落地: "项目经验",
};

/** 按能力维度分组，识别重复出现的 weakness 模式 */
function extractInterviewPatterns(
  interviews: Interview[],
): InterviewPattern[] {
  // 按能力维度收集 weakness
  const dimMap = new Map<string, { evidence: string[] }>();

  for (const iv of interviews) {
    const source = `${iv.company} ${iv.position} (${iv.status})`;
    const wk = iv.aiReview?.weaknesses ?? [];
    for (const w of wk) {
      const dim = classifyWeakness(w);
      if (!dimMap.has(dim)) dimMap.set(dim, { evidence: [] });
      dimMap.get(dim)!.evidence.push(`${source}：${w}`);
    }
  }

  // 只保留 ≥2 次出现的维度
  const patterns: InterviewPattern[] = [];
  dimMap.forEach((data, dim) => {
    if (data.evidence.length >= 2) {
      patterns.push({
        pattern: `在 ${data.evidence.length} 次面试中「${dim}」被识别为短板`,
        frequency: data.evidence.length,
        evidence: data.evidence.slice(0, 4),
      });
    }
  });

  // 按频率降序
  patterns.sort((a, b) => b.frequency - a.frequency);

  return patterns.slice(0, 5);
}

/** 将 weakness 文本分类到能力维度 */
function classifyWeakness(text: string): string {
  for (const [kw, dim] of Object.entries(DIMENSION_KEYWORDS)) {
    if (text.includes(kw)) return dim;
  }
  return "综合能力";
}

// ============================================================
// 内部：learningGoals
// ============================================================

/** 从 growthRecommendations + tasks 生成 learningGoals */
function extractLearningGoals(
  interviews: Interview[],
  aiAnalyses: AIAnalysis[],
  tasks: Task[],
): LearningGoal[] {
  const goals: LearningGoal[] = [];

  // 来源 1：能力画像的 growthRecommendations
  const profile = getLatestCapabilityProfile(aiAnalyses);
  if (profile?.growthRecommendations) {
    for (const rec of profile.growthRecommendations) {
      goals.push({
        goal: rec.action.slice(0, 40),
        priority: rec.priority,
        source: `AI 成长建议（${rec.capability}）`,
        progress: computeGoalProgress(rec, tasks),
      });
    }
  }

  // 来源 2：AIReview 的 suggestions
  for (const iv of getRecentInterviews(interviews)) {
    for (const sug of iv.aiReview?.suggestions ?? []) {
      // 避免重复
      if (!goals.some((g) => g.goal === sug.slice(0, 40))) {
        goals.push({
          goal: sug.slice(0, 40),
          priority: "medium",
          source: `${iv.company} 面试复盘`,
          progress: computeSuggestionProgress(sug, tasks),
        });
      }
    }
  }

  // 高优先级在前
  const order = { high: 0, medium: 1, low: 2 };
  goals.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));

  return goals.slice(0, 6);
}

/** 计算 recommendation 对应的 task 完成进度 */
function computeGoalProgress(rec: GrowthRecommendation, tasks: Task[]): number {
  const related = tasks.filter((t) =>
    t.relatedCapability === rec.capability ||
    t.content.includes(rec.capability),
  );
  if (related.length === 0) return 0;
  const done = related.filter((t) => t.status === "completed").length;
  return Math.round((done / related.length) * 100);
}

function computeSuggestionProgress(sug: string, tasks: Task[]): number {
  // 检查是否有类似内容的任务被完成
  const key = sug.slice(0, 10);
  const related = tasks.filter((t) => t.content.includes(key));
  if (related.length === 0) return 0;
  const done = related.filter((t) => t.status === "completed").length;
  return Math.round((done / related.length) * 100);
}

// ============================================================
// 内部：helpers
// ============================================================

/** 获取最新的能力画像结果 */
function getLatestCapabilityProfile(
  aiAnalyses: AIAnalysis[],
): CapabilityProfileResult | undefined {
  const profiles = aiAnalyses
    .filter((a) => a.type === "capability_profile")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  if (profiles.length === 0) return undefined;
  return profiles[0].result as CapabilityProfileResult;
}

/** 获取有 AIReview 的面试，按时间降序 */
function getRecentInterviews(interviews: Interview[]): Interview[] {
  return interviews
    .filter((iv) => iv.aiReview)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);
}

/** 生成 aiSummary 模板 */
function buildAISummary(
  interviews: Interview[],
  aiAnalyses: AIAnalysis[],
  _tasks: Task[],
  userProfile?: UserProfile,
): string {
  const total = interviews.length;
  const passed = interviews.filter((iv) =>
    iv.status.includes("通过"),
  ).length;
  const pending = interviews.filter((iv) =>
    iv.status === "待面试" || iv.status === "准备中",
  ).length;
  const roles =
    userProfile?.targetRoles?.join("、") ||
    "产品经理";
  const strengths = extractStrengths(interviews, aiAnalyses);
  const weaknesses = extractWeaknesses(interviews, aiAnalyses);

  const para = [
    `候选人目标岗位为 ${roles}，迄今为止共经历 ${total} 次面试，其中 ${passed} 次已通过，${pending} 次待面试。`,
    strengths.length > 0
      ? `核心优势集中在：${strengths.slice(0, 3).join("、")}。`
      : "",
    weaknesses.length > 0
      ? `主要待提升领域：${weaknesses.slice(0, 3).join("、")}。`
      : "",
    "以上画像基于历史面试数据、AI 诊断和能力画像自动生成，随每次面试和分析更新。",
  ]
    .filter(Boolean)
    .join("");

  return para;
}
