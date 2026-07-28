/**
 * JD 分析 Prompt 模板
 *
 * 输入：company, position, jdText, candidateProfile?
 * 输出：严格符合 JDInsightResult 的 JSON
 */

export interface UserMemoryBrief {
  strengths?: string[];
  weaknesses?: string[];
  interviewPatterns?: { pattern: string; frequency: number }[];
  learningGoals?: { goal: string; priority: string; progress: number }[];
  aiSummary?: string;
  targetRoles?: string[];
}

export interface JDPromptInput {
  company: string;
  position: string;
  jdText: string;
  candidateProfile?: string;
  /** AI 长期记忆，提供用户历史上下文 */
  userMemory?: UserMemoryBrief;
}

const SYSTEM_PROMPT = `你是一位资深技术招聘专家和职业规划师，拥有 10 年以上互联网大厂招聘经验。
你精通 JD（岗位描述）分析，能快速拆解岗位核心要求，并评估候选人与岗位的匹配度。

## 你的任务
分析给定的岗位 JD，输出结构化的分析结果。

## 输出格式
严格输出以下 JSON，不要包含 \`\`\`json 标记或任何额外文字：

{
  "requirements": [
    { "label": "能力名称", "stars": 4 }
  ],
  "focusAreas": [
    "准备方向 1",
    "准备方向 2",
    "准备方向 3"
  ],
  "interviewFocus": [
    "高频面试题方向 1",
    "高频面试题方向 2",
    "高频面试题方向 3"
  ],
  "matchAdvice": "150-200字的岗位匹配总评和建议",
  "candidateMatch": {
    "strengths": ["候选人与岗位的匹配优势1", "优势2"],
    "gaps": ["候选人与岗位的差距1", "差距2"],
    "suggestions": ["提升建议1", "建议2", "建议3"]
  }
}

## 字段要求
- requirements: 提取 5 项核心能力要求，stars 1-5 表示重要程度
- focusAreas: 3 条可操作的准备方向，每条 ≤30 字，动词开头
- interviewFocus: 3 个面试官可能提问的方向，每条是一个完整的问题或话题
- matchAdvice: 150-200 字，评估岗位难度，给出整体准备建议
- candidateMatch: 只有提供候选人信息时才输出此字段
  - strengths: 2-3 条匹配优势
  - gaps: 2-3 条能力差距
  - suggestions: 3 条针对性提升建议

## 分析要求
- 所有评价必须有具体依据，引用 JD 中的内容
- 建议必须可操作（"做XX"而非"注意XX"）
- 语言简洁，每条 ≤50 字`;

export function buildJDAnalysisPrompt(input: JDPromptInput) {
  const { company, position, jdText, candidateProfile, userMemory } = input;

  const memoryBlock = userMemory ? buildMemoryBlock(userMemory) : "";

  const userMessage = `## 岗位信息
- 公司：${company}
- 岗位：${position}
- JD 文本：
${jdText}
${candidateProfile ? `\n## 候选人信息\n${candidateProfile}\n` : ""}${memoryBlock}
请按照系统指令中的格式要求，生成岗位分析结果。`;

  return { systemPrompt: SYSTEM_PROMPT, userMessage };
}

/** 将 UserMemory 转换为 prompt 可用的文本块 */
function buildMemoryBlock(m: UserMemoryBrief): string {
  const lines: string[] = ["\n## 用户长期记忆"];
  if (m.strengths?.length) lines.push(`核心优势：${m.strengths.join("、")}`);
  if (m.weaknesses?.length) lines.push(`待提升能力：${m.weaknesses.join("、")}`);
  if (m.interviewPatterns?.length)
    lines.push(`面试模式：${m.interviewPatterns.map((p) => `${p.pattern}（出现${p.frequency}次）`).join("；")}`);
  if (m.learningGoals?.length)
    lines.push(`学习目标：${m.learningGoals.map((g) => `${g.goal}（${g.priority === "high" ? "高优" : g.priority === "medium" ? "中优" : "低优"}，进度${g.progress}%）`).join("；")}`);
  if (m.aiSummary) lines.push(`综合画像：${m.aiSummary}`);
  return lines.join("\n") + "\n";
}
