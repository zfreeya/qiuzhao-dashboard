/**
 * 实体类型定义 — 独立于 React Context
 *
 * 所有数据层（Repository、dataService）从本文件导入类型，
 * 避免 InterviewContext.tsx 的循环依赖。
 */

// ============================================================
// 基础类型
// ============================================================

export type QuestionCategory = "技术" | "行为" | "综合";

export interface Question {
  id: string;
  question: string;
  answer: string;
  category: QuestionCategory;
}

export interface Recording {
  id: string;
  name: string;
  createdAt: string; // ISO
}

/** AI 面试诊断结果 */
export interface AIReview {
  generatedAt: string;
  matchScore: number;
  summary: string;
  interviewerPerspective?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  modelVersion?: string;
}

// ============================================================
// 实体 1：公司（Company）
// ============================================================

export interface Company {
  id: string;
  name: string;
  industry: string;
  tags: string[];
  website?: string;
  notes?: string;
}

// ============================================================
// 实体 2：投递（Application）
// ============================================================

export type ApplicationStatus =
  | "未投递"
  | "已投递"
  | "笔试中"
  | "已笔试"
  | "面试中"
  | "已Offer"
  | "已拒绝";

export interface Application {
  id: string;
  companyId: string;
  /** @deprecated 冗余字段，优先从关联 Company 读取 */
  company: string;
  position: string;
  department?: string;
  status: ApplicationStatus;
  applyDate: string;
  updatedAt: string;
  notes?: string;
}

// ============================================================
// 实体 3：面试（Interview）
// ============================================================

export type InterviewResult = "未开始" | "准备中" | "待面试" | "一面完成" | "二面完成" | "已通过" | "未通过";

export type InterviewRound = "一面" | "二面" | "三面" | "HR面" | "终面" | "其他";

export interface Interview {
  id: string;
  applicationId: string;
  round: InterviewRound;
  interviewDate: string;
  location?: string;
  link?: string;
  updatedAt: string;
  /** @deprecated 冗余字段，优先从关联 Application 读取 */
  company: string;
  /** @deprecated 冗余字段，优先从关联 Application 读取 */
  position: string;
  status: InterviewResult;
  /** @deprecated 冗余字段，优先从关联 Application 读取 */
  companyId?: string;
  jd: string;
  questions: Question[];
  recordings: Recording[];
  summary: string;
  aiReview?: AIReview;
}

// ============================================================
// 实体 4：AI 分析（AIAnalysis）
// ============================================================

export type AIAnalysisTargetType = "company" | "application" | "interview" | "user";

export interface AIAnalysisInput {
  summary: string;
  jdText?: string;
  qa?: { question: string; answer: string }[];
  userSummary?: string;
  dimensions?: { name: string; score: number }[];
}

export interface JDInsightResult {
  requirements: { label: string; stars: number }[];
  focusAreas: string[];
  interviewFocus?: string[];
  matchAdvice?: string;
  candidateMatch?: {
    strengths: string[];
    gaps: string[];
    suggestions: string[];
  };
}

export interface InterviewReviewResult {
  matchScore: number;
  summary: string;
  interviewerPerspective?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface CapabilityEvidence {
  capability: string;
  evidence: string;
  source: string;
  confidence: number;
}

export interface GrowthRecommendation {
  capability: string;
  problem: string;
  evidence: string[];
  action: string;
  estimatedTime: string;
  priority: "high" | "medium" | "low";
}

export interface CapabilityProfileResult {
  overallScore: number;
  scoreBreakdown: {
    interviewScore: number;
    aiDiagnosisScore: number;
    taskScore: number;
    profileScore: number;
  };
  evidenceList: CapabilityEvidence[];
  dimensions: {
    name: string;
    score: number;
    evidence: string[];
    reasons: string[];
    trend?: "up" | "stable" | "down";
    trendReason?: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  growthRecommendations?: GrowthRecommendation[];
  summary: string;
  generatedAt?: string;
}

export type AIAnalysisResult =
  | JDInsightResult
  | InterviewReviewResult
  | CapabilityProfileResult;

export type AIAnalysisType = "jd_insight" | "interview_review" | "capability_profile";

export interface AIAnalysis {
  id: string;
  type: AIAnalysisType;
  targetType: AIAnalysisTargetType;
  targetId: string;
  result: AIAnalysisResult;
  input: AIAnalysisInput;
  promptVersion: string;
  modelVersion: string;
  createdAt: string;
}

// ============================================================
// 实体 5：用户画像（UserProfile）
// ============================================================

export interface UserProject {
  name: string;
  role: string;
  description: string;
  outcome: string;
  skills: string[];
}

export interface UserProfile {
  targetRoles: string[];
  projects: UserProject[];
  skills: string[];
  background: string;
  goals: string[];
}

// ============================================================
// 实体 6：任务（Task）
// ============================================================

export type TaskSource = "user" | "ai";
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "completed" | "ignored";
export type FeedbackStatus = "pending" | "submitted" | "analyzed";

export interface TaskFeedbackAnalysis {
  taskId: string;
  output: string;
  extractedEvidence: CapabilityEvidence[];
  capabilityImpact: {
    capability: string;
    scoreChange: number;
  };
}

export interface Task {
  id: string;
  content: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  aiAnalysisId?: string;
  applicationId?: string;
  relatedCapability?: string;
  sourceId?: string;
  createdAt: string;
  completedAt?: string;
  feedback?: string;
  feedbackStatus?: FeedbackStatus;
  feedbackAnalysis?: TaskFeedbackAnalysis;
}

// ============================================================
// 能力成长事件
// ============================================================

export interface CapabilityGrowthEvent {
  capability: string;
  beforeScore: number;
  afterScore: number;
  evidenceAdded: string;
  reason: string;
  timestamp: string;
}

// ============================================================
// 状态流转
// ============================================================

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  "未投递": ["已投递", "已拒绝"],
  "已投递": ["笔试中", "已拒绝"],
  "笔试中": ["已笔试", "已拒绝"],
  "已笔试": ["面试中", "已拒绝"],
  "面试中": ["已Offer", "已拒绝"],
  "已Offer": [],
  "已拒绝": [],
};

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// UserMemory — AI 长期记忆
// ============================================================

export interface InterviewPattern {
  pattern: string;
  frequency: number;
  evidence: string[];
}

export interface LearningGoal {
  goal: string;
  priority: "high" | "medium" | "low";
  source: string;
  progress: number;
}

export interface UserMemory {
  strengths: string[];
  weaknesses: string[];
  targetRoles: string[];
  projects: UserProject[];
  interviewPatterns: InterviewPattern[];
  learningGoals: LearningGoal[];
  aiSummary: string;
  updatedAt: string;
}
