/**
 * POST /api/ai/extract-evidence
 *
 * AI 能力证据提取
 * 调用 DeepSeek API 从用户数据中提取具体能力证据
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildEvidencePrompt } from "../../../../prompts/evidenceExtractionPrompt";

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

function validateEvidence(obj: unknown): obj is { evidenceList: unknown[] } {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return Array.isArray(o.evidenceList);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { systemPrompt, userMessage } = buildEvidencePrompt({
      userProfile: body.userProfile,
      interviews: body.interviews ?? [],
      tasks: body.tasks ?? [],
    });

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const parsed = parseJSON(text);

    if (!validateEvidence(parsed)) {
      return NextResponse.json(
        { error: "LLM 返回格式不符合预期", raw: text },
        { status: 502 },
      );
    }

    return NextResponse.json({
      evidenceList: parsed.evidenceList,
      modelVersion: "deepseek-chat",
      promptVersion: "v1",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
