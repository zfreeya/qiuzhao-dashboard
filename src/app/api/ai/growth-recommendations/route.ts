/**
 * POST /api/ai/growth-recommendations
 *
 * AI 成长建议生成
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildGrowthPrompt } from "../../../../prompts/growthPrompt";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error("未配置 DEEPSEEK_API_KEY");
    _client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }
  return _client;
}

function parseJSON(text: string): unknown {
  let clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first !== -1 && last > first) clean = clean.slice(first, last + 1);
  return JSON.parse(clean);
}

function validateRecs(obj: unknown): obj is { recommendations: unknown[] } {
  if (typeof obj !== "object" || obj === null) return false;
  return Array.isArray((obj as Record<string, unknown>).recommendations);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { systemPrompt, userMessage } = buildGrowthPrompt({
      userProfile: body.userProfile,
      dimensions: body.dimensions ?? [],
      evidenceList: body.evidenceList ?? [],
      targetRole: body.targetRole,
      interviews: body.interviews ?? [],
      userMemory: body.userMemory,
    });

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const parsed = parseJSON(text);

    if (!validateRecs(parsed)) {
      return NextResponse.json(
        { error: "LLM 返回格式不符合预期", raw: text },
        { status: 502 },
      );
    }

    return NextResponse.json({
      recommendations: parsed.recommendations,
      modelVersion: "deepseek-chat",
      promptVersion: "v1",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
