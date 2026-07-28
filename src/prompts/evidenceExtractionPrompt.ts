/**
 * 能力证据提取 Prompt
 *
 * 输入：用户画像、面试复盘、项目经历、任务
 * 输出：CapabilityEvidence[] JSON
 */

export interface EvidencePromptInput {
  userProfile?: {
    projects: { name: string; description: string; skills: string[] }[];
    skills: string[];
  };
  interviews: {
    company: string;
    questions: { question: string; answer: string }[];
    aiReview?: { matchScore: number; strengths: string[]; weaknesses: string[] };
  }[];
  tasks: { content: string; status: string }[];
}

const SYSTEM_PROMPT = `你是一位人才评估专家，擅长从候选人的项目经历和面试表现中提取能力证据。

## 你的任务
从提供的候选人数据中提取 5 个核心能力维度的具体证据。

## 5 个能力维度
1. 产品设计 — 用户需求分析、功能设计、产品方案
2. 数据分析 — 数据驱动决策、指标定义、实验设计
3. 技术理解 — AI/技术原理理解、技术方案评估
4. 沟通表达 — 逻辑清晰度、STAR 表达、面试表现
5. 项目经验 — 项目复杂度、独立负责能力、成果量化

## 输出格式
严格输出以下 JSON，不要包含 \`\`\`json 标记：

{
  "evidenceList": [
    {
      "capability": "产品设计",
      "evidence": "在字节面试中展示了智能客服机器人的产品设计方案，准确率提升至89%",
      "source": "字节跳动AI产品经理面试",
      "confidence": 0.85
    }
  ]
}

## 提取规则
- 每条 evidence 必须引用具体数据（公司名、数字、项目名）
- capability 必须是上述 5 个维度之一
- source 标注证据来源（面试公司/项目名/任务内容）
- confidence 0-1 表示证据可信度（有数据支撑≥0.8，推断<0.6）
- 每个维度至少 1 条，有充分数据的维度可到 3 条
- 不要编造数据，只从提供的材料中提取`;

export function buildEvidencePrompt(input: EvidencePromptInput) {
  const projectText =
    input.userProfile?.projects
      .map((p) => `- ${p.name}：${p.description}（技能：${p.skills.join("、")}）`)
      .join("\n") ?? "（无项目经历）";

  const interviewText = input.interviews
    .map(
      (iv, i) =>
        `${i + 1}. ${iv.company}${
          iv.aiReview ? ` [匹配度=${iv.aiReview.matchScore}]` : ""
        }\n   Q&A：${iv.questions
          .map((q) => `${q.question} → ${q.answer.slice(0, 100)}`)
          .join("；")}${
          iv.aiReview
            ? `\n   优势：${iv.aiReview.strengths.join("；")}\n   不足：${iv.aiReview.weaknesses.join("；")}`
            : ""
        }`,
    )
    .join("\n");

  const taskText =
    input.tasks.length > 0
      ? input.tasks.map((t) => `- [${t.status}] ${t.content}`).join("\n")
      : "（无任务记录）";

  const userMessage = `## 项目经历
${projectText}

## 面试记录
${interviewText || "（暂无面试记录）"}

## 任务记录
${taskText}

请按照系统指令要求，提取 5 个能力维度的具体证据。`;

  return { systemPrompt: SYSTEM_PROMPT, userMessage };
}
