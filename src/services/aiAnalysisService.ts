/**
 * AIAnalysis 业务逻辑
 * — 分析记录查询、类型守卫、AI → Task 闭环
 */

import type {
  AIAnalysis,
  AIAnalysisType,
  AIAnalysisResult,
  JDInsightResult,
  InterviewReviewResult,
  CapabilityProfileResult,
  Task,
} from "../_shared/InterviewContext";

// ============================================================
// 类型守卫
// ============================================================

export function isJDInsightResult(r: AIAnalysisResult): r is JDInsightResult {
  return "requirements" in r && "focusAreas" in r;
}

export function isInterviewReviewResult(r: AIAnalysisResult): r is InterviewReviewResult {
  return "matchScore" in r && "strengths" in r;
}

export function isCapabilityProfileResult(r: AIAnalysisResult): r is CapabilityProfileResult {
  return "overallScore" in r && "dimensions" in r;
}

// ============================================================
// 查询
// ============================================================

export function getLatestByType(analyses: AIAnalysis[], type: AIAnalysisType): AIAnalysis | undefined {
  return analyses
    .filter((a) => a.type === type)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function getByTarget(analyses: AIAnalysis[], targetType: string, targetId: string): AIAnalysis[] {
  return analyses
    .filter((a) => a.targetType === targetType && a.targetId === targetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================
// AI 闭环：从分析结果生成 Task
// ============================================================

/** 从 AI 分析记录生成可执行的 Task */
export function generateTasksFromAnalyses(analyses: AIAnalysis[]): Omit<Task, "id" | "createdAt">[] {
  const tasks: Omit<Task, "id" | "createdAt">[] = [];

  for (const analysis of analyses) {
    switch (analysis.type) {
      case "interview_review": {
        const r = analysis.result as InterviewReviewResult;
        for (const w of r.weaknesses.slice(0, 3)) {
          tasks.push({
            content: `改进面试不足：${w}`,
            status: "todo",
            priority: "high",
            source: "ai",
            aiAnalysisId: analysis.id,
          });
        }
        for (const s of r.suggestions.slice(0, 2)) {
          tasks.push({
            content: `练习：${s}`,
            status: "todo",
            priority: "medium",
            source: "ai",
            aiAnalysisId: analysis.id,
          });
        }
        break;
      }
      case "jd_insight": {
        const r = analysis.result as JDInsightResult;
        for (const area of r.focusAreas) {
          tasks.push({
            content: `准备方向：${area}`,
            status: "todo",
            priority: "medium",
            source: "ai",
            aiAnalysisId: analysis.id,
          });
        }
        break;
      }
      case "capability_profile": {
        const r = analysis.result as CapabilityProfileResult;
        for (const d of r.dimensions.filter((d) => d.score < 60)) {
          tasks.push({
            content: `提升${d.name}`,
            status: "todo",
            priority: "medium",
            source: "ai",
            aiAnalysisId: analysis.id,
          });
        }
        break;
      }
    }
  }

  return tasks;
}

/** 去重合并：避免重复 AI 生成任务 */
export function mergeAITasks(
  existingTasks: Task[],
  newTasks: Omit<Task, "id" | "createdAt">[],
): Omit<Task, "id" | "createdAt">[] {
  const existingKeys = new Set(
    existingTasks.filter((t) => t.source === "ai").map((t) => `${t.aiAnalysisId}:${t.content}`),
  );
  return newTasks.filter((t) => !existingKeys.has(`${t.aiAnalysisId}:${t.content}`));
}
