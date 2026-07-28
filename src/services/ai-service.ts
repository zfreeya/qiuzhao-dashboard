/**
 * AI Service — 客户端调用封装
 *
 * 职责：
 * - 组装请求 → fetch POST /api/ai-review
 * - 错误分类 + 中文错误信息
 * - 返回 AIReview 或抛出可显示的错误
 *
 * UI 层只需 try/catch 并显示 error.message 即可。
 */

import type { AIReview } from "../_shared/InterviewContext";
import type { AIInput } from "../server/llm-provider";

/** 传给后端的数据结构 */
type AIReviewRequest = AIInput;

/**
 * 调用后端的 AI 面试诊断接口
 * @returns AIReview 诊断结果
 * @throws Error 中文错误信息，可直接展示给用户
 */
export async function generateAIReview(
  input: AIReviewRequest,
): Promise<AIReview> {
  let response: Response;

  // ── 网络请求 ──
  try {
    response = await fetch("/api/ai-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("网络连接失败，请检查网络后重试");
  }

  // ── HTTP 错误 ──
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const serverMsg =
      typeof body?.error === "string" ? body.error : "";

    switch (response.status) {
      case 400:
        throw new Error(serverMsg || "请求参数错误，请检查输入内容");
      case 429:
        throw new Error("请求过于频繁，请稍后重试");
      case 502:
        throw new Error(serverMsg || "AI 返回格式异常，请重新生成");
      case 500:
        throw new Error(serverMsg || "AI 服务暂时不可用，请稍后重试");
      default:
        throw new Error(
          serverMsg || `服务异常 (${response.status})，请稍后重试`,
        );
    }
  }

  // ── JSON 解析 ──
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error("AI 返回格式异常，请重新生成");
  }

  // ── 快速校验 ──
  if (!isAIReview(json)) {
    throw new Error("AI 返回内容不完整，请重新生成");
  }

  return json;
}

/** 客户端简易校验（与服务端 validateAIReview 保持一致） */
function isAIReview(v: unknown): v is AIReview {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.matchScore === "number" &&
    o.matchScore >= 0 &&
    o.matchScore <= 100 &&
    typeof o.summary === "string" &&
    o.summary.length > 0 &&
    Array.isArray(o.strengths) &&
    Array.isArray(o.weaknesses) &&
    Array.isArray(o.suggestions)
  );
}
