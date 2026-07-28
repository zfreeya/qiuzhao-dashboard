/**
 * 能力画像 Prompt 模板
 *
 * 输入：面试历史、AI 诊断、任务完成、目标岗位
 * 输出：严格符合 CapabilityProfileResult 的 JSON
 */

export interface UserMemoryBrief {
  strengths?: string[];
  weaknesses?: string[];
  interviewPatterns?: { pattern: string; frequency: number }[];
  learningGoals?: { goal: string; priority: string; progress: number }[];
  aiSummary?: string;
  targetRoles?: string[];
}

export interface ProfilePromptInput {
  interviews: {
    company: string;
    position: string;
    status: string;
    matchScore?: number;
    strengths?: string[];
    weaknesses?: string[];
    summary?: string;
  }[];
  applications: {
    company: string;
    position: string;
    status: string;
  }[];
  tasks: {
    completed: number;
    total: number;
  };
  /** AI 长期记忆 */
  userMemory?: UserMemoryBrief;
}

const SYSTEM_PROMPT = `你是一位资深职业规划师和人才评估专家。
你擅长从多维度面试数据中提炼候选人的能力画像和发展建议。

## 你的任务
根据候选人的面试历史、AI 诊断记录、任务完成情况和目标岗位，生成一份结构化的能力画像。

## 输出格式
严格输出以下 JSON，不要包含 \`\`\`json 标记或任何额外文字：

{
  "overallScore": 72,
  "dimensions": [
    {
      "name": "产品设计",
      "score": 75,
      "evidence": ["字节面试中产品方案获得认可"],
      "trend": "up"
    }
  ],
  "strengths": ["产品设计（75分）- 有2次面试体现"],
  "weaknesses": ["数据分析（55分）- 缺少量化表达"],
  "nextActions": [
    "每天练习1个费米问题，提升数据敏感度",
    "在下次面试前准备3个量化项目案例"
  ],
  "summary": "150-200字的综合评估，包含整体水平定位和核心建议"
}

## 字段要求
- overallScore: 0-100 综合能力评分
- dimensions: 评估 5 个核心维度
  - name: 产品设计 / 数据分析 / 技术理解 / 沟通表达 / 项目经验
  - score: 0-100
  - evidence: 1-2 条来自数据的证据
  - trend: "up" | "stable" | "down" 能力趋势
- strengths: 3 条优势（含具体依据）
- weaknesses: 3 条不足（含改进方向）
- nextActions: 4-5 条可执行的提升行动，每条 ≤30 字
- summary: 150-200 字综合评估

## 评分依据
- 面试匹配度（matchScore）: 权重 40%
- AI 诊断的优点/不足: 权重 30%
- 任务完成率: 权重 10%
- 通过率: 权重 20%
- 多个面试之间的进步趋势

## 分析要求
- 所有评价必须有数据支撑，不能凭空猜测
- 趋势判断要基于多次面试的分数变化
- 建议必须具体可执行（"做XX"而非"注意XX"）`;

export function buildAbilityProfilePrompt(input: ProfilePromptInput) {
  const interviewText = input.interviews
    .map(
      (iv, i) =>
        `${i + 1}. ${iv.company} ${iv.position} [${iv.status}]${
          iv.matchScore ? ` 匹配度=${iv.matchScore}` : ""
        }${iv.strengths?.length ? ` 优势=${iv.strengths.join("；")}` : ""}${
          iv.weaknesses?.length ? ` 不足=${iv.weaknesses.join("；")}` : ""
        }${iv.summary ? ` 总结=${iv.summary.slice(0, 100)}` : ""}`,
    )
    .join("\n");

  const appText = input.applications
    .map((a) => `${a.company} ${a.position} [${a.status}]`)
    .join("\n");

  const taskText = `完成 ${input.tasks.completed}/${input.tasks.total} 项任务`;

  const memoryBlock = input.userMemory ? buildMemoryBlock(input.userMemory) : "";

  const userMessage = `## 面试历史
${interviewText || "（暂无面试记录）"}

## 投递记录
${appText || "（暂无投递记录）"}

## 任务完成
${taskText}${memoryBlock}

请按照系统指令中的格式要求，生成候选人能力画像。`;

  return { systemPrompt: SYSTEM_PROMPT, userMessage };
}

/** 将 UserMemory 转换为 prompt 可用的文本块 */
function buildMemoryBlock(m: ProfilePromptInput["userMemory"]): string {
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
