/**
 * POST /api/ai/ability-profile
 *
 * AI 能力画像生成
 * 调用 DeepSeek API，输出严格符合 CapabilityProfileResult 的 JSON
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAbilityProfilePrompt } from "../../../../prompts/abilityProfilePrompt";

// ============================================================
// LLM 客户端
// ============================================================

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("未配置 DEEPSEEK_API_KEY");
    }
    _client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }
  return _client;
}

// ============================================================
// JSON 解析 + 校验
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

function validateProfile(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  const sb = o.scoreBreakdown as Record<string, unknown> | undefined;
  return (
    typeof o.overallScore === "number" &&
    Array.isArray(o.dimensions) &&
    o.dimensions.length >= 3 &&
    Array.isArray(o.strengths) &&
    Array.isArray(o.weaknesses) &&
    Array.isArray(o.nextActions) &&
    typeof o.summary === "string" &&
    sb !== undefined &&
    typeof sb.interviewScore === "number" &&
    typeof sb.aiDiagnosisScore === "number" &&
    typeof sb.taskScore === "number" &&
    typeof sb.profileScore === "number"
  );
}

// ============================================================
// POST handler
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { interviews, tasks, userMemory } = body;

    if (!interviews) {
      return NextResponse.json(
        { error: "缺少必填字段：interviews" },
        { status: 400 },
      );
    }

    const { systemPrompt, userMessage } = buildAbilityProfilePrompt({
      interviews: interviews ?? [],
      applications: [],
      tasks: tasks ?? { completed: 0, total: 0 },
      userMemory,
    });

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const parsed = parseJSON(text);

    if (!validateProfile(parsed)) {
      return NextResponse.json(
        { error: "LLM 返回格式不符合预期", raw: text },
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
