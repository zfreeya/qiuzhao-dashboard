/**
 * POST /api/ai/analyze-jd
 *
 * AI 岗位 JD 分析
 * 调用 DeepSeek API，输出严格符合 JDInsightResult 的 JSON
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildJDAnalysisPrompt } from "../../../../prompts/jdAnalysisPrompt";

// ============================================================
// LLM 客户端（与 llm-provider.ts 相同模式）
// ============================================================

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error(
        "未配置 DEEPSEEK_API_KEY，请在 .env.local 中设置"
      );
    }
    _client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }
  return _client;
}

// ============================================================
// JSON 解析（与 llm-provider.ts 复用逻辑）
// ============================================================

function parseJSON(text: string): unknown {
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

// ============================================================
// 输出校验
// ============================================================

function validateResult(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  const valid =
    Array.isArray(o.requirements) &&
    o.requirements.length >= 3 &&
    Array.isArray(o.focusAreas) &&
    o.focusAreas.length >= 2 &&
    Array.isArray(o.interviewFocus) &&
    o.interviewFocus.length >= 2 &&
    typeof o.matchAdvice === "string" &&
    o.matchAdvice.length > 0;
  // candidateMatch 可选，但如果存在则校验
  if (o.candidateMatch !== undefined) {
    const cm = o.candidateMatch as Record<string, unknown>;
    return (
      valid &&
      Array.isArray(cm.strengths) &&
      Array.isArray(cm.gaps) &&
      Array.isArray(cm.suggestions)
    );
  }
  return valid;
}

// ============================================================
// POST handler
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, position, jdText, candidateProfile, userMemory } = body;

    if (!company || !position || !jdText) {
      return NextResponse.json(
        { error: "缺少必填字段：company, position, jdText" },
        { status: 400 },
      );
    }

    const { systemPrompt, userMessage } = buildJDAnalysisPrompt({
      company,
      position,
      jdText,
      candidateProfile,
      userMemory,
    });

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const parsed = parseJSON(text);

    if (!validateResult(parsed)) {
      return NextResponse.json(
        { error: "LLM 返回内容格式不符合预期", raw: text },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ...parsed,
      modelVersion: "deepseek-chat",
      promptVersion: "v1",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    if (message.includes("DEEPSEEK_API_KEY")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
