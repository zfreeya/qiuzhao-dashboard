/**
 * 成长建议 Prompt 模板
 *
 * 输入：用户画像、能力评分、证据列表、目标岗位、面试历史
 * 输出：GrowthRecommendation[] JSON
 */

export interface UserMemoryBrief {
  strengths?: string[];
  weaknesses?: string[];
  interviewPatterns?: { pattern: string; frequency: number }[];
  learningGoals?: { goal: string; priority: string; progress: number }[];
  aiSummary?: string;
  targetRoles?: string[];
}

export interface GrowthPromptInput {
  userProfile?: { targetRoles: string[]; skills: string[]; background: string };
  dimensions: { name: string; score: number; reasons: string[] }[];
  evidenceList: { capability: string; evidence: string; source: string; confidence: number }[];
  targetRole?: string;
  interviews: { company: string; position: string; status: string }[];
  /** AI 长期记忆 */
  userMemory?: UserMemoryBrief;
}

const SYSTEM_PROMPT = `你是一位顶级职业导师，专注于帮助求职者精准提升能力短板。

## 你的任务
根据候选人的能力评分和具体证据，生成 3 条可执行的成长建议。

## 核心原则
1. 每条建议必须引用具体证据，不能泛泛而谈
2. 针对用户的目标岗位给出差异化建议
3. 不生成"多看XX书籍""多练习"之类的泛泛建议
4. 每条 action 必须可执行、可度量（"完成1个XX"、"输出XX文档"）

## 输出格式
严格输出以下 JSON：

{
  "recommendations": [
    {
      "capability": "数据分析",
      "problem": "当前数据分析评分为45分，在3次面试中均未展示数据驱动决策的能力",
      "evidence": ["字节面试中缺少量化指标表达", "AI诊断指出数据量化不足"],
      "action": "完成1个完整的数据分析案例：从定义核心指标→数据采集方案→分析结论，输出2页分析报告",
      "estimatedTime": "45分钟",
      "priority": "high"
    }
  ]
}

## 字段要求
- capability: 5个维度之一
- problem: 具体说明为什么这个能力需要提升（包含分数和具体表现）
- evidence: 1-3条来自材料的真实证据
- action: 1句话可执行指令，≤50字，包含具体产出
- estimatedTime: "15分钟"/"30分钟"/"45分钟"/"60分钟"
- priority: "high"(<50分)/"medium"(50-65)/"low"(>65)

## 目标岗位适配
- AI产品经理 → 强调技术理解、模型评估能力
- 策略产品经理 → 强调数据分析、实验设计
- 通用产品经理 → 强调用户研究、需求分析`;

export function buildGrowthPrompt(input: GrowthPromptInput) {
  const dimText = input.dimensions
    .map((d) => `- ${d.name}：${d.score}分（${d.reasons.join("；")}）`)
    .join("\n");

  const evText = input.evidenceList
    .map((e) => `- [${e.capability}] ${e.evidence}（来源：${e.source}，置信度：${Math.round(e.confidence * 100)}%）`)
    .join("\n");

  const ivText = input.interviews
    .map((iv) => `- ${iv.company} ${iv.position} [${iv.status}]`)
    .join("\n");

  const role = input.targetRole || input.userProfile?.targetRoles[0] || "产品经理";

  const memoryBlock = input.userMemory ? buildMemoryBlock(input.userMemory) : "";

  const userMessage = `## 目标岗位
${role}

## 能力评分
${dimText || "暂无评分数据"}

## 证据列表
${evText || "暂无证据"}

## 面试历史
${ivText || "暂无面试记录"}

## 用户背景
${input.userProfile?.background || "未填写"}
技能：${input.userProfile?.skills.join("、") || "未填写"}${memoryBlock}

请根据以上数据，生成 3 条精准成长建议。目标岗位是 ${role}，请据此调整建议方向。`;

  return { systemPrompt: SYSTEM_PROMPT, userMessage };
}

/** 将 UserMemory 转换为 prompt 可用的文本块 */
function buildMemoryBlock(m: GrowthPromptInput["userMemory"]): string {
  if (!m) return "";
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
