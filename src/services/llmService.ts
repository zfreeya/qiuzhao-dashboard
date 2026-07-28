/**
 * LLM Service — AI 能力接入层
 *
 * 架构：
 *   每个 AI 功能提供独立函数，输入标准化、输出类型化。
 *   当前为 Mock 实现，后续替换为真实 LLM 调用时：
 *   1. 替换每个函数体内的 mock 逻辑
 *   2. 调用 src/server/llm-provider.ts 中的管道
 *   3. UI 层无需任何改动
 */

import type { JDInsightResult, InterviewReviewResult } from "../_shared/InterviewContext";

// ============================================================
// 类型
// ============================================================

export interface JDAnalysisInput {
  company: string;
  position: string;
  jdText: string;
  candidateProfile?: string;
  /** AI 长期记忆 */
  userMemory?: {
    strengths?: string[];
    weaknesses?: string[];
    interviewPatterns?: { pattern: string; frequency: number }[];
    learningGoals?: { goal: string; priority: string; progress: number }[];
    aiSummary?: string;
  };
}

export interface InterviewAnalysisInput {
  company: string;
  position: string;
  jdText: string;
  qa: { question: string; answer: string }[];
  userSummary: string;
}

// ============================================================
// Mock 生成器（后续替换为 LLM 调用）
// ============================================================

function delay(ms = 800): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 根据岗位关键词生成差异化的 JD 分析 */
function generateMockJDInsight(
  company: string,
  position: string,
): JDInsightResult {
  const isAI =
    position.toLowerCase().includes("ai") ||
    position.includes("人工智能");

  if (isAI) {
    return {
      requirements: [
        { label: "AI/ML 技术理解", stars: 5 },
        { label: "产品设计能力", stars: 4 },
        { label: "数据分析", stars: 4 },
        { label: "项目推动能力", stars: 3 },
        { label: "行业认知", stars: 4 },
      ],
      focusAreas: [
        `LLM 应用理解：准备你对大模型能力边界的理解`,
        `项目指标表达：用数据量化你的 AI 项目成果`,
        `用户需求分析：展示如何从用户场景出发设计 AI 产品`,
      ],
      interviewFocus: [
        `${company} 如何用 AI 赋能现有产品矩阵`,
        "介绍你对 Transformer / RAG / Agent 的理解",
        "设计一个 AI-native 的产品功能",
      ],
      matchAdvice: `${company} 的 ${position} 岗位对 AI 技术理解要求较高，建议准备 2-3 个 AI 项目案例，重点体现你如何平衡技术可行性和用户需求。`,
    };
  }

  const isPM = position.includes("产品");
  if (isPM) {
    return {
      requirements: [
        { label: "产品设计能力", stars: 5 },
        { label: "用户需求分析", stars: 5 },
        { label: "数据分析", stars: 4 },
        { label: "逻辑与表达", stars: 4 },
        { label: "商业思维", stars: 3 },
      ],
      focusAreas: [
        `用户需求分析：准备从用户洞察到产品方案的完整案例`,
        `数据驱动决策：准备用数据支撑产品判断的真实经历`,
        `竞品分析能力：了解 ${company} 的核心产品和主要竞品`,
      ],
      interviewFocus: [
        `如何提升 ${company} 某款产品的用户体验`,
        "介绍你做过的最有挑战的产品决策",
        "估算一个感兴趣的产品的市场规模",
      ],
      matchAdvice: `${company} 的产品经理岗位重视用户洞察和数据分析能力，建议深入研究 ${company} 的产品矩阵，准备 1-2 个竞品分析案例。`,
    };
  }

  return {
    requirements: [
      { label: "岗位专业能力", stars: 4 },
      { label: "沟通表达", stars: 4 },
      { label: "项目经验", stars: 3 },
      { label: "学习能力", stars: 4 },
      { label: "团队协作", stars: 3 },
    ],
    focusAreas: [
      `深入理解 ${company} 的业务模式和产品矩阵`,
      "准备 3 个能体现核心能力的项目案例",
      "梳理个人职业规划和与岗位的匹配点",
    ],
    interviewFocus: [
      `为什么选择 ${company} 的 ${position} 岗位`,
      "介绍你最有代表性的项目经历",
      "你对这个行业未来3年的趋势怎么看",
    ],
    matchAdvice: `建议深入了解 ${company} 的业务和 ${position} 的核心要求，准备针对性的项目案例。`,
  };
}

// ============================================================
// 公开 API
// ============================================================

/**
 * JD 智能分析
 *
 * 优先调用 /api/ai/analyze-jd（DeepSeek LLM），
 * API 不可用时降级为 Mock
 */
export async function analyzeJD(input: JDAnalysisInput): Promise<JDInsightResult> {
  try {
    const response = await fetch("/api/ai/analyze-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: input.company,
        position: input.position,
        jdText: input.jdText,
        candidateProfile: input.candidateProfile,
        userMemory: input.userMemory,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "unknown" }));
      console.warn("LLM API 失败，降级为 Mock:", err.error);
      throw new Error(err.error ?? "API error");
    }

    const data = await response.json();
    return data as JDInsightResult;
  } catch {
    // 降级：LLM 不可用时使用 Mock
    console.warn("LLM 服务不可用，使用 Mock 分析结果");
    await delay(500);
    return generateMockJDInsight(input.company, input.position);
  }
}

/**
 * 面试复盘分析（Stub — 后续接入）
 */
export async function analyzeInterview(
  /* input: InterviewAnalysisInput */
): Promise<InterviewReviewResult> {
  await delay(2000);
  // Stub: 返回空结果，后续接入 LLM
  throw new Error("analyzeInterview 尚未实现，请使用现有的 AIReviewModule");
}
