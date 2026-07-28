/**
 * LLM Provider — DeepSeek API
 *
 * 架构：
 *   generateDiagnosis()
 *     ├─ callLLM()        ← DeepSeek OpenAI-compatible API
 *     ├─ parseAIReview()  ← JSON 提取 + 清理
 *     └─ validateAIReview() ← 结构校验
 */

import OpenAI from "openai";
import type { AIReview } from "../_shared/InterviewContext";

// ============================================================
// 类型
// ============================================================

export interface AIInput {
  position: string;
  jd: string;
  qa: {
    question: string;
    answer: string;
    category: "技术" | "行为" | "综合";
  }[];
  userSummary: string;
}

interface LLMResponse {
  text: string;
}

// ============================================================
// 输出校验
// ============================================================

export function validateAIReview(obj: unknown): obj is AIReview {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.matchScore === "number" &&
    o.matchScore >= 0 &&
    o.matchScore <= 100 &&
    typeof o.summary === "string" &&
    o.summary.length > 0 &&
    Array.isArray(o.strengths) &&
    o.strengths.length >= 3 &&
    Array.isArray(o.weaknesses) &&
    o.weaknesses.length >= 3 &&
    Array.isArray(o.suggestions) &&
    o.suggestions.length >= 3
  );
}

// ============================================================
// Prompt 模板
// ============================================================

const SYSTEM_PROMPT = `你是一位资深产品经理面试官，拥有 10 年以上互联网大厂面试经验。
你面试过 500+ 候选人，深谙产品经理面试的评价标准和隐性规则。

## 你的角色
你正在帮助一位秋招候选人复盘他们的面试表现。

## 输出格式
严格输出以下 JSON，不要包含 \`\`\`json 标记或任何额外文字：

{
  "matchScore": <0-100 整数>,
  "interviewerPerspective": "<150-200字，以'面试官可能在思考：'开头，模拟面试官的内心判断和顾虑>",
  "summary": "<150-250字面试表现总评>",
  "strengths": ["<3条优势>"],
  "weaknesses": ["<3条不足>"],
  "suggestions": ["<4条改进建议>"]
}

## 字段写作要求
- interviewerPerspective：以面试官第一人称内心独白，揭示 TA 在听到这些回答时的隐性判断标准、顾虑和关注点
- strengths：每条必须有具体依据，引用候选人回答中的内容
- weaknesses：每条必须解释为什么这个缺失是重要的
- suggestions：每条必须可操作（"做XX"而非"注意XX"）
- summary：给出明确的水平定位`;

function buildUserMessage(input: AIInput): string {
  const isAI =
    input.position.toLowerCase().includes("ai") ||
    input.position.includes("人工智能");

  const qaText =
    input.qa.length > 0
      ? input.qa
          .map(
            (item, i) =>
              `Q${i + 1} [${item.category}]：${item.question}\nA${i + 1}：${item.answer || "（未回答）"}`,
          )
          .join("\n\n")
      : "（暂无面试问答记录）";

  return `## 岗位信息
- 岗位名称：${input.position}
${input.jd ? `- 岗位JD：${input.jd}` : "- 岗位JD：（未提供）"}

## 面试问答
${qaText}

${input.userSummary ? `## 候选人的自我总结\n${input.userSummary}\n` : ""}
## 评价维度

### 产品能力（通用，权重 40%）
- 用户需求分析：是否从用户场景出发？是否展示了需求拆解过程？
- 产品设计思维：是否使用了系统化的产品方法论？
- 逻辑与表达：回答是否有清晰的结构？是否自洽？

${isAI ? `### AI 产品能力（权重 30%）
- 技术理解深度：对 AI 模型的理解是否准确？是否能区分技术和产品问题？
- AI 产品落地认知：是否理解 AI 产品的特殊性（数据、评估、迭代）？
- 模型能力边界判断：是否体现出对"AI 能做什么、不能做什么"的理解？
` : ""}### STAR 表达分析（权重 20%）
- 情境（Situation）：是否交代了背景和上下文？
- 任务（Task）：是否明确了要解决的问题和自己的角色？
- 行动（Action）：是否描述了具体做了什么？
- 结果（Result）：是否有量化结果？是否有反思？

### 数据意识（权重 20%）
- 是否用数据支撑观点？是否提到具体指标？

### 项目深度（权重 20%）
- 项目描述是否足够具体？是否体现了独立思考？

请基于以上信息，按照系统指令中的格式要求，生成面试诊断报告。
记住：每条评价都要具体、有依据、可执行。`;
}

// ============================================================
// 核心管道
// ============================================================

export async function generateDiagnosis(input: AIInput): Promise<AIReview> {
  const response = await callLLM(input);
  const parsed = parseAIReview(response.text);

  if (!validateAIReview(parsed)) {
    throw new Error("LLM 返回内容格式不符合预期");
  }

  return {
    ...(parsed as AIReview),
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================
// LLM 调用 — DeepSeek API
// ============================================================

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error(
        "未配置 DEEPSEEK_API_KEY，请在项目根目录 .env.local 中设置：\n" +
        "DEEPSEEK_API_KEY=sk-your-key",
      );
    }
    _client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }
  return _client;
}

async function callLLM(input: AIInput): Promise<LLMResponse> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    temperature: 0.3,
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(input) },
    ],
  });

  return {
    text: response.choices[0]?.message?.content ?? "",
  };
}

// ============================================================
// JSON 解析
// ============================================================

function parseAIReview(text: string): unknown {
  let clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(clean);
}
