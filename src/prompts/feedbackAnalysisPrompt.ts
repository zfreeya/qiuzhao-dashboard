/**
 * 任务反馈分析 Prompt
 *
 * 输入：任务内容、用户反馈、能力维度
 * 输出：TaskFeedbackAnalysis JSON
 */

export interface FeedbackPromptInput {
  taskContent: string;
  feedback: string;
  capability: string;
  currentScore: number;
}

const SYSTEM_PROMPT = `你是一位能力评估专家，擅长从用户的实践产出中提取能力证据。

## 你的任务
用户完成了一个 AI 建议的练习任务并提交了成果描述。请分析这个产出对能力提升的贡献。

## 输出格式
严格输出以下 JSON：

{
  "output": "对用户产出的简要评价（1-2句）",
  "extractedEvidence": [
    {
      "capability": "数据分析",
      "evidence": "用户完成了费米问题练习，展示了数据拆解和估算能力",
      "source": "任务反馈",
      "confidence": 0.85
    }
  ],
  "capabilityImpact": {
    "capability": "数据分析",
    "scoreChange": 5
  }
}

## 评分规则
- scoreChange 范围 1-10
- 具体产出 + 量化结果 → +7~10
- 完成练习但无量化 → +3~6
- 简单描述 → +1~2
- 每个维度最多 +10`;

export function buildFeedbackPrompt(input: FeedbackPromptInput) {
  const userMessage = `## 任务内容
${input.taskContent}

## 用户反馈
${input.feedback}

## 关联能力
${input.capability}（当前评分：${input.currentScore}分）

请分析用户的任务完成情况，提取证据并评估能力提升。`;

  return { systemPrompt: SYSTEM_PROMPT, userMessage };
}
