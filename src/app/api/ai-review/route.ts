/**
 * POST /api/ai-review
 *
 * 接收 AIInput，委托 llm-provider 生成诊断，
 * 返回 AIReview JSON。
 *
 * 当前 mock 实现，连接真实 LLM 时只需改 provider 层。
 */

import { NextResponse } from "next/server";
import { generateDiagnosis, validateAIReview, type AIInput } from "../../../server/llm-provider";

export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "请求格式错误，无法解析 JSON" },
        { status: 400 },
      );
    }

    // 2. 校验必填字段
    if (!isAIInput(body)) {
      return NextResponse.json(
        { error: "缺少必填字段：position" },
        { status: 400 },
      );
    }

    // 3. 调用 LLM Provider
    const result = await generateDiagnosis(body);

    // 4. 校验输出
    if (!validateAIReview(result)) {
      return NextResponse.json(
        { error: "AI 返回内容格式不符合预期，请重试" },
        { status: 502 },
      );
    }

    // 5. 返回
    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "未知服务端错误";
    console.error("[ai-review] 生成失败:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** 简易输入校验 */
function isAIInput(v: unknown): v is AIInput {
  return (
    typeof v === "object" &&
    v !== null &&
    "position" in v &&
    typeof (v as Record<string, unknown>).position === "string"
  );
}
