/**
 * 能力证据提取服务
 *
 * 优先调用 LLM 从真实数据中提取证据，
 * 失败时降级为规则生成的 evidence
 */

import type {
  Interview,
  AIAnalysis,
  Task,
  UserProfile,
  CapabilityEvidence,
  InterviewReviewResult,
} from "../_shared/InterviewContext";

// ============================================================
// 类型
// ============================================================

export interface EvidenceExtractionInput {
  interviews: Interview[];
  aiAnalyses: AIAnalysis[];
  tasks: Task[];
  userProfile?: UserProfile;
}

// ============================================================
// 规则证据提取（Fallback）
// ============================================================

const DIMENSIONS = ["产品设计", "数据分析", "技术理解", "沟通表达", "项目经验"];

function extractRuleEvidence(
  input: EvidenceExtractionInput,
): CapabilityEvidence[] {
  const evidenceList: CapabilityEvidence[] = [];
  const { interviews, aiAnalyses, userProfile } = input;

  for (const dim of DIMENSIONS) {
    // 1. 从面试提取
    for (const iv of interviews) {
      if (iv.aiReview) {
        const allText = [
          iv.aiReview.summary,
          ...iv.aiReview.strengths,
          ...iv.aiReview.weaknesses,
        ].join(" ");
        if (allText.includes(dim) || allText.includes(dim.slice(0, 2))) {
          evidenceList.push({
            capability: dim,
            evidence: `${iv.company} 面试中：${iv.aiReview.strengths.find((s) => s.includes(dim) || s.includes(dim.slice(0, 2))) ?? iv.aiReview.summary.slice(0, 80)}`,
            source: `${iv.company} ${iv.position} 面试`,
            confidence: 0.7,
          });
        }
      }
      // 从问答提取
      for (const q of iv.questions) {
        if (
          q.answer &&
          (q.answer.includes(dim) || q.answer.includes(dim.slice(0, 2)))
        ) {
          evidenceList.push({
            capability: dim,
            evidence: q.answer.slice(0, 100),
            source: `${iv.company} 面试问答`,
            confidence: 0.5,
          });
        }
      }
    }

    // 2. 从 AI 诊断提取
    for (const a of aiAnalyses) {
      if (a.type === "interview_review") {
        const r = a.result as InterviewReviewResult;
        for (const s of r.strengths) {
          if (s.includes(dim) || s.includes(dim.slice(0, 2))) {
            evidenceList.push({
              capability: dim,
              evidence: s,
              source: "AI 诊断",
              confidence: 0.75,
            });
          }
        }
      }
    }

    // 3. 从画像提取
    if (userProfile) {
      for (const p of userProfile.projects) {
        if (
          p.description.includes(dim) ||
          p.skills.some((s) => s.includes(dim) || dim.includes(s))
        ) {
          evidenceList.push({
            capability: dim,
            evidence: `${p.name}：${p.description.slice(0, 80)}`,
            source: `项目：${p.name}`,
            confidence: 0.65,
          });
        }
      }
    }
  }

  return evidenceList;
}

// ============================================================
// LLM 证据提取
// ============================================================

export async function extractEvidenceWithAI(
  input: EvidenceExtractionInput,
): Promise<CapabilityEvidence[]> {
  try {
    const { interviews, tasks, userProfile } = input;
    const response = await fetch("/api/ai/extract-evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userProfile: userProfile
          ? {
              projects: userProfile.projects.map((p) => ({
                name: p.name,
                description: p.description,
                skills: p.skills,
              })),
              skills: userProfile.skills,
            }
          : undefined,
        interviews: interviews.map((iv) => ({
          company: iv.company,
          questions: iv.questions.map((q) => ({
            question: q.question,
            answer: q.answer,
          })),
          aiReview: iv.aiReview
            ? {
                matchScore: iv.aiReview.matchScore,
                strengths: iv.aiReview.strengths,
                weaknesses: iv.aiReview.weaknesses,
              }
            : undefined,
        })),
        tasks: tasks.map((t) => ({ content: t.content, status: t.status })),
      }),
    });

    if (!response.ok) throw new Error(`API ${response.status}`);

    const data = await response.json();
    return data.evidenceList as CapabilityEvidence[];
  } catch (err) {
    console.warn("AI 证据提取失败，降级为规则提取:", err);
    return extractRuleEvidence(input);
  }
}

/** 将证据按维度聚合 */
export function groupEvidenceByCapability(
  evidenceList: CapabilityEvidence[],
): Record<string, CapabilityEvidence[]> {
  const grouped: Record<string, CapabilityEvidence[]> = {};
  for (const e of evidenceList) {
    if (!grouped[e.capability]) grouped[e.capability] = [];
    grouped[e.capability].push(e);
  }
  return grouped;
}
