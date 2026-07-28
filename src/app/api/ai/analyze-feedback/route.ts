/**
 * POST /api/ai/analyze-feedback
 *
 * AI 任务反馈分析 — 从用户产出中提取能力证据
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildFeedbackPrompt } from "../../../../prompts/feedbackAnalysisPrompt";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskContent, feedback, capability, currentScore } = body;

    if (!taskContent || !feedback || !capability) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const { systemPrompt, userMessage } = buildFeedbackPrompt({
      taskContent,
      feedback,
      capability,
      currentScore: currentScore ?? 50,
    });

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const parsed = parseJSON(text);

    return NextResponse.json({
      ...(parsed as Record<string, unknown>),
      modelVersion: "deepseek-chat",
    });
  } catch {
    // 降级：返回简单分析
    return NextResponse.json({
      output: "任务完成反馈已记录",
      extractedEvidence: [
        {
          capability: (await getRequestBody(request)).capability ?? "综合",
          evidence: `完成了任务：${(await getRequestBody(request)).taskContent?.slice(0, 60) ?? ""}`,
          source: "任务反馈",
          confidence: 0.5,
        },
      ],
      capabilityImpact: {
        capability: (await getRequestBody(request)).capability ?? "综合",
        scoreChange: 2,
      },
      modelVersion: "fallback",
    });
  }
}

async function getRequestBody(request: Request) {
  try { return await request.clone().json(); } catch { return {}; }
}
