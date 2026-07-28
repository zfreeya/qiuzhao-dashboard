/**
 * 能力画像服务
 *
 * 优先调用 LLM API 生成画像，失败时降级为规则计算
 */

import type {
  Interview,
  AIAnalysis,
  Task,
  UserProfile,
  CapabilityProfileResult,
} from "../_shared/InterviewContext";
import { generateAbilityProfile } from "./interviewService";

// ============================================================
// 类型
// ============================================================

export interface ProfileGenerationInput {
  interviews: Interview[];
  aiAnalyses: AIAnalysis[];
  tasks: Task[];
  userProfile?: UserProfile;
  /** AI 长期记忆 */
  userMemory?: {
    strengths?: string[];
    weaknesses?: string[];
    interviewPatterns?: { pattern: string; frequency: number }[];
    learningGoals?: { goal: string; priority: string; progress: number }[];
    aiSummary?: string;
  };
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 生成能力画像（AI 优先，规则降级）
 *
 * 流程：
 *  1. 调用 /api/ai/ability-profile (LLM)
 *  2. 成功 → 返回 AI 生成的 CapabilityProfileResult
 *  3. 失败 → 降级为本地规则计算
 */
export async function generateAbilityProfileWithAI(
  input: ProfileGenerationInput,
): Promise<CapabilityProfileResult> {
  try {
    const response = await fetch("/api/ai/ability-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildAIInput(input)),
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    return data as CapabilityProfileResult;
  } catch (err) {
    console.warn(
      "AI 能力画像生成失败，降级为规则计算:",
      err instanceof Error ? err.message : err,
    );
    return generateAbilityProfile(
      input.interviews,
      input.aiAnalyses,
      input.tasks,
      input.userProfile,
    );
  }
}

// ============================================================
// 输入构建
// ============================================================

function buildAIInput(input: ProfileGenerationInput) {
  const { interviews, tasks, userProfile, userMemory } = input;

  return {
    interviews: interviews.map((iv) => ({
      company: iv.company,
      position: iv.position,
      status: iv.status,
      matchScore: iv.aiReview?.matchScore,
      strengths: iv.aiReview?.strengths,
      weaknesses: iv.aiReview?.weaknesses,
      summary: iv.aiReview?.summary,
    })),
    tasks: {
      completed: tasks.filter((t) => t.status === "completed").length,
      total: tasks.length,
    },
    userProfile: userProfile
      ? {
          targetRoles: userProfile.targetRoles,
          skills: userProfile.skills,
          projects: userProfile.projects.map((p) => p.name),
          background: userProfile.background,
          goals: userProfile.goals,
        }
      : undefined,
    userMemory,
  };
}

/**
 * 从 AIAnalysis 读取最新的能力画像结果
 */
export function getLatestProfile(
  aiAnalyses: AIAnalysis[],
): CapabilityProfileResult | undefined {
  const analysis = aiAnalyses
    .filter(
      (a) => a.type === "capability_profile" && a.targetType === "user",
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

  if (!analysis) return undefined;
  return analysis.result as CapabilityProfileResult;
}
