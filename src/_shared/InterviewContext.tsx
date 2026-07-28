"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as ds from "../services/dataService";

// ============================================================
// 类型 — 从 entityTypes 导入并重新导出（避免循环依赖）
// ============================================================

import type {
  QuestionCategory,
  Question,
  Recording,
  AIReview,
  Company,
  ApplicationStatus,
  Application,
  InterviewResult,
  InterviewRound,
  Interview,
  AIAnalysisTargetType,
  AIAnalysisInput,
  JDInsightResult,
  InterviewReviewResult,
  CapabilityEvidence,
  GrowthRecommendation,
  CapabilityProfileResult,
  AIAnalysisResult,
  AIAnalysisType,
  AIAnalysis,
  UserProject,
  UserProfile,
  TaskSource,
  TaskPriority,
  TaskStatus,
  FeedbackStatus,
  TaskFeedbackAnalysis,
  Task,
  CapabilityGrowthEvent,
  InterviewPattern,
  LearningGoal,
  UserMemory,
} from "./entityTypes";
import { APPLICATION_TRANSITIONS, isValidTransition } from "./entityTypes";

export type {
  QuestionCategory,
  Question,
  Recording,
  AIReview,
  Company,
  ApplicationStatus,
  Application,
  InterviewResult,
  InterviewRound,
  Interview,
  AIAnalysisTargetType,
  AIAnalysisInput,
  JDInsightResult,
  InterviewReviewResult,
  CapabilityEvidence,
  GrowthRecommendation,
  CapabilityProfileResult,
  AIAnalysisResult,
  AIAnalysisType,
  AIAnalysis,
  UserProject,
  UserProfile,
  TaskSource,
  TaskPriority,
  TaskStatus,
  FeedbackStatus,
  TaskFeedbackAnalysis,
  Task,
  CapabilityGrowthEvent,
  InterviewPattern,
  LearningGoal,
  UserMemory,
};
export { APPLICATION_TRANSITIONS, isValidTransition };

// ============================================================
// Context 类型
// ============================================================

interface InterviewContextType {
  interviews: Interview[];
  applications: Application[];
  companies: Company[];
  aiAnalyses: AIAnalysis[];
  tasks: Task[];
  hydrated: boolean;
  getInterview: (id: string) => Interview | undefined;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  addInterview: (data: Omit<Interview, "id" | "updatedAt" | "round" | "applicationId"> & { applicationId?: string; round?: string }) => Promise<string>;
  addApplication: (data: Omit<Application, "id" | "updatedAt">) => Promise<string>;
  /** 更新投递 */
  updateApplication: (id: string, updates: Partial<Application>) => void;
  /** 删除投递（级联删除关联面试） */
  deleteApplication: (id: string) => Promise<{ deletedInterviews: number }>;
  /** 新增投递：自动创建关联公司（如不存在） */
  addApplicationWithCompany: (data: {
    companyName: string;
    companyIndustry?: string;
    position: string;
    department?: string;
    status?: ApplicationStatus;
    applyDate?: string;
    notes?: string;
  }) => Promise<{ applicationId: string; companyId: string }>;
  /** 新增任务，返回新 ID */
  addTask: (data: Omit<Task, "id" | "createdAt">) => Promise<string>;
  /** 切换任务完成状态 */
  toggleTask: (id: string) => void;
  /** 删除任务 */
  deleteTask: (id: string) => void;
  /** 更新任务字段 */
  updateTask: (id: string, updates: Partial<Task>) => void;
  /** 新增 AI 分析记录，返回新 ID */
  addAIAnalysis: (data: Omit<AIAnalysis, "id" | "createdAt">) => Promise<string>;
  /** 用户画像 */
  userProfile: UserProfile;
  /** 更新用户画像 */
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  /** AI 长期记忆 */
  userMemory: UserMemory | undefined;
  /** 更新长期记忆 */
  updateUserMemory: (data: UserMemory) => void;
  /** 新增公司，返回新 ID */
  addCompany: (data: Omit<Company, "id">) => Promise<string>;
  /** 更新公司 */
  updateCompany: (id: string, updates: Partial<Company>) => void;
  /** 删除公司（级联），返回影响统计 */
  deleteCompany: (id: string) => Promise<{ deletedApplications: number; deletedInterviews: number }>;
  /** 删除面试记录 */
  deleteInterview: (id: string) => Promise<void>;
  /** 加载示例数据（已有用户数据时禁止覆盖） */
  loadDemoData: () => Promise<void>;
}

// ============================================================
// 常量
// ============================================================

export const INTERVIEW_STATUS_OPTIONS = [
  "未开始",
  "准备中",
  "待面试",
  "一面完成",
  "二面完成",
  "已通过",
  "未通过",
] as const;

// ============================================================
// Mock 数据
// ============================================================

const MOCK_INTERVIEWS: Interview[] = [
  {
    id: "1",
    company: "字节跳动",
    position: "AI产品经理",
    status: "一面完成",
    interviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    applicationId: "a1",
    round: "一面",
    jd: "【岗位职责】\n1. 负责AI产品功能规划与迭代\n2. 协调算法、工程团队推动产品落地\n3. 分析用户数据，优化产品体验\n\n【岗位要求】\n1. 2025届应届毕业生\n2. 有AI/ML相关项目经验优先\n3. 优秀的逻辑分析和沟通能力",
    questions: [
      {
        id: "q1",
        question: "为什么想做AI产品经理？",
        answer:
          "我在大学期间参与了两个AI相关项目，发现技术的价值需要通过产品来落地。AI产品经理正好位于技术和用户需求的交叉点，能最大化我的能力。",
        category: "行为",
      },
      {
        id: "q2",
        question: "介绍一下你做过的最有挑战的项目",
        answer:
          "我在实习期间主导了一个智能客服机器人的优化项目，将准确率从72%提升到89%。最大的挑战是平衡模型性能和响应速度，最终通过模型蒸馏解决了这个问题。",
        category: "综合",
      },
    ],
    recordings: [
      { id: "r1", name: "字节一面·全程录音", createdAt: new Date().toISOString() },
    ],
    summary:
      "本次表现：整体节奏把控较好，项目经验讲得比较清楚。\n\n不足：技术深度问题回答不够自信，需要补充AI基础知识。\n\n下一次改进：准备2-3个深度的技术案例，练习STAR法则回答问题。",
  },
  {
    id: "2",
    company: "阿里巴巴",
    position: "产品经理",
    status: "待面试",
    interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    applicationId: "a2",
    round: "一面",
    jd: "【岗位职责】\n1. 负责电商平台核心产品功能设计\n2. 深入理解用户需求，输出PRD\n3. 推动产品从设计到上线的全流程\n\n【岗位要求】\n1. 2025届应届生\n2. 有产品实习经验优先",
    questions: [],
    recordings: [],
    summary: "",
  },
  {
    id: "3",
    company: "腾讯",
    position: "产品策划",
    status: "已通过",
    interviewDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    applicationId: "a3",
    round: "二面",
    jd: "",
    questions: [
      {
        id: "q3",
        question: "设计一个00后社交产品",
        answer:
          "我从00后的三个核心需求出发：真实表达、兴趣圈子、轻量化互动。设计了以兴趣标签为核心的匹配系统，强调去中心化的社群运营。面试官认可了这个思路。",
        category: "综合",
      },
    ],
    recordings: [],
    summary:
      "本次表现：产品sense得到了面试官认可，设计方案逻辑清晰。\n\n不足：对商业模式思考不够。\n\n下一次改进：多看行业分析报告，培养商业思维。",
  },
];

const MOCK_APPLICATIONS: Application[] = [
  { id: "a1", companyId: "c1", company: "字节跳动", position: "AI产品经理", status: "面试中", applyDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a2", companyId: "c2", company: "阿里巴巴", position: "产品经理", status: "面试中", applyDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a3", companyId: "c3", company: "腾讯", position: "产品策划", status: "已Offer", applyDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a4", companyId: "c4", company: "美团", position: "产品经理", status: "笔试中", applyDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a5", companyId: "c5", company: "小红书", position: "产品经理", status: "笔试中", applyDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a6", companyId: "c6", company: "百度", position: "AI产品经理", status: "已笔试", applyDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a7", companyId: "c7", company: "京东", position: "产品经理", status: "已投递", applyDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a8", companyId: "c8", company: "拼多多", position: "产品经理", status: "已投递", applyDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a9", companyId: "c9", company: "网易", position: "产品策划", status: "已拒绝", applyDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a10", companyId: "c10", company: "快手", position: "产品经理", status: "已投递", applyDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

const MOCK_COMPANIES: Company[] = [
  { id: "c1", name: "字节跳动", industry: "互联网/短视频", tags: ["大厂", "AI", "产品"] },
  { id: "c2", name: "阿里巴巴", industry: "互联网/电商", tags: ["大厂", "电商", "产品"] },
  { id: "c3", name: "腾讯", industry: "互联网/社交", tags: ["大厂", "社交", "产品"] },
  { id: "c4", name: "美团", industry: "互联网/本地生活", tags: ["大厂", "O2O", "产品"] },
  { id: "c5", name: "小红书", industry: "互联网/社区", tags: ["独角兽", "社区", "产品"] },
  { id: "c6", name: "百度", industry: "互联网/搜索", tags: ["大厂", "AI", "产品"] },
  { id: "c7", name: "京东", industry: "互联网/电商", tags: ["大厂", "电商", "产品"] },
  { id: "c8", name: "拼多多", industry: "互联网/电商", tags: ["大厂", "电商", "产品"] },
  { id: "c9", name: "网易", industry: "互联网/游戏", tags: ["大厂", "游戏", "产品"] },
  { id: "c10", name: "快手", industry: "互联网/短视频", tags: ["大厂", "短视频", "产品"] },
];

const MOCK_AI_ANALYSES: AIAnalysis[] = [
  {
    id: "ai1",
    type: "interview_review",
    targetType: "interview",
    targetId: "1",
    result: {
      matchScore: 72,
      summary: "产品sense良好，但技术深度不足，建议补充AI基础知识",
      strengths: ["项目经验表达清晰", "STAR法则使用得当", "产品思维活跃"],
      weaknesses: ["技术深度不够", "数据量化不足", "竞品分析缺失"],
      suggestions: ["补充AI/ML基础概念", "准备量化项目指标", "研究竞品功能差异", "练习技术场景表达"],
    } satisfies InterviewReviewResult,
    input: { summary: "字节跳动 AI产品经理 一面复盘", qa: [{ question: "为什么想做AI产品经理？", answer: "大学期间参与AI项目..." }, { question: "介绍最有挑战的项目", answer: "智能客服机器人优化..." }], userSummary: "整体节奏把控较好" },
    promptVersion: "v2",
    modelVersion: "deepseek-chat",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ai2",
    type: "jd_insight",
    targetType: "application",
    targetId: "a1",
    result: {
      requirements: [
        { label: "AI/ML 技术理解", stars: 5 },
        { label: "产品设计能力", stars: 4 },
        { label: "数据分析", stars: 4 },
        { label: "项目推动", stars: 3 },
        { label: "行业认知", stars: 4 },
      ],
      focusAreas: ["LLM应用理解", "项目指标表达", "用户需求分析"],
    } satisfies JDInsightResult,
    input: { summary: "字节跳动 AI产品经理 JD", jdText: "负责AI产品功能规划与迭代..." },
    promptVersion: "v1",
    modelVersion: "deepseek-chat",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_TASKS: Task[] = [
  { id: "t1", content: "准备字节二面", status: "todo", priority: "high", source: "user", applicationId: "a1", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "t2", content: "完成美团笔试", status: "todo", priority: "high", source: "user", applicationId: "a4", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "t3", content: "更新简历项目经历", status: "completed", priority: "medium", source: "user", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "t4", content: "整理阿里面经", status: "todo", priority: "medium", source: "user", applicationId: "a2", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "t5", content: "查看腾讯 JD", status: "completed", priority: "low", source: "user", applicationId: "a3", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
];

// ============================================================
// 工具函数
// ============================================================

/** 通过关联链解析 Interview 的展示字段（替代冗余字段的过渡方案） */
export function resolveInterviewDisplay(
  interview: Interview,
  applications: Application[],
): { company: string; position: string } {
  const app = applications.find((a) => a.id === interview.applicationId);
  return app
    ? { company: app.company, position: app.position }
    : { company: interview.company, position: interview.position };
}

// ============================================================
// Context
// ============================================================

const InterviewContext = createContext<InterviewContextType | null>(null);

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [hydrated, setHydrated] = useState(false);


  const getInterview = useCallback(
    (id: string) => interviews.find((i) => i.id === id),
    [interviews],
  );

  const updateInterview = useCallback(
    (id: string, updates: Partial<Interview>) => {
      ds.updateInterview(id, updates);
      setInterviews((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, ...updates, updatedAt: new Date().toISOString() }
            : i,
        ),
      );
    },
    [],
  );

  // ── 数据持久化（通过 dataService 抽象层）──

  useEffect(() => {
    let cancelled = false;
    const TIMEOUT_MS = 5000;

    async function hydrate() {
      console.log("[hydration] 开始数据加载...");

      const withTimeout = <T,>(promise: Promise<T>, label: string): Promise<T | undefined> =>
        Promise.race([
          promise,
          new Promise<undefined>((resolve) =>
            setTimeout(() => {
              console.warn(`[hydration] ${label} 超时 (${TIMEOUT_MS}ms)，跳过`);
              resolve(undefined);
            }, TIMEOUT_MS),
          ),
        ]);

      const results = await Promise.allSettled([
        withTimeout(ds.getInterviews(), "getInterviews"),
        withTimeout(ds.getApplications(), "getApplications"),
        withTimeout(ds.getCompanies(), "getCompanies"),
        withTimeout(ds.getAIAnalyses(), "getAIAnalyses"),
        withTimeout(ds.getTasks(), "getTasks"),
        withTimeout(ds.getUserProfile(), "getUserProfile"),
        withTimeout(ds.getUserMemory(), "getUserMemory"),
      ]);

      if (cancelled) return;

      // 处理各数据源结果
      const [ivR, appR, coR, aiR, taskR, upR, umR] = results;

      if (ivR.status === "fulfilled" && ivR.value && ivR.value.length > 0) {
        setInterviews(ivR.value);
      } else if (ivR.status === "rejected") {
        console.error("[hydration] getInterviews 失败", ivR.reason);
      }

      if (appR.status === "fulfilled" && appR.value && appR.value.length > 0) {
        setApplications(appR.value);
      } else if (appR.status === "rejected") {
        console.error("[hydration] getApplications 失败", appR.reason);
      }

      if (coR.status === "fulfilled" && coR.value && coR.value.length > 0) {
        setCompanies(coR.value);
      } else if (coR.status === "rejected") {
        console.error("[hydration] getCompanies 失败", coR.reason);
      }

      if (aiR.status === "fulfilled" && aiR.value && aiR.value.length > 0) {
        setAIAnalyses(aiR.value);
      } else if (aiR.status === "rejected") {
        console.error("[hydration] getAIAnalyses 失败", aiR.reason);
      }

      if (taskR.status === "fulfilled" && taskR.value && taskR.value.length > 0) {
        setTasks(taskR.value);
      } else if (taskR.status === "rejected") {
        console.error("[hydration] getTasks 失败", taskR.reason);
      }

      if (upR.status === "fulfilled" && upR.value) {
        setUserProfile(upR.value);
      } else if (upR.status === "rejected") {
        console.error("[hydration] getUserProfile 失败", upR.reason);
      }

      if (umR.status === "fulfilled" && umR.value) {
        setUserMemory(umR.value);
      } else if (umR.status === "rejected") {
        console.error("[hydration] getUserMemory 失败", umR.reason);
      }

      console.log("[hydration] 数据加载完成，即将 setHydrated(true)");
      setHydrated(true);
      console.log("[hydration] setHydrated(true) 已执行");

      // 清理历史孤儿数据（延后到 hydration 之后，不阻塞首屏渲染）
      ds.cleanupOrphanData()
        .then(async (cleaned) => {
          if (cleaned.removedApplications > 0 || cleaned.removedInterviews > 0) {
            console.log(
              `[hydration] 清理孤儿数据: ${cleaned.removedApplications} 个 Application, ${cleaned.removedInterviews} 个 Interview`,
            );
            // 清理后重新加载，确保状态一致
            if (cleaned.removedApplications > 0) {
              const apps = await ds.getApplications();
              if (apps.length > 0) setApplications(apps);
            }
            if (cleaned.removedInterviews > 0) {
              const ivs = await ds.getInterviews();
              if (ivs.length > 0) setInterviews(ivs);
            }
          }
        })
        .catch((err) => {
          console.error("[hydration] 孤儿数据清理失败", err);
        });
    }

    hydrate().catch((err) => {
      console.error("[hydration] 未捕获异常，强制 setHydrated(true)", err);
      if (!cancelled) {
        setHydrated(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const [applications, setApplications] = useState<Application[]>([]);

  const [companies, setCompanies] = useState<Company[]>([]);

  // 投递数缓存：用于 addApplicationWithCompany 查找已有公司
  const companiesRef = useRef<Company[]>([]);
  companiesRef.current = companies;

  const addApplication = useCallback(
    async (data: Omit<Application, "id" | "updatedAt">): Promise<string> => {
      const id = "ap" + Date.now();
      const record: Application = { ...data, id, updatedAt: new Date().toISOString() };
      await ds.createApplication(record);
      setApplications((prev) => [...prev, record]);
      return id;
    },
    [],
  );

  const addApplicationWithCompany = useCallback(
    async (data: {
      companyName: string;
      companyIndustry?: string;
      position: string;
      department?: string;
      status?: ApplicationStatus;
      applyDate?: string;
      notes?: string;
    }): Promise<{ applicationId: string; companyId: string }> => {
      const trimmedName = data.companyName.trim();

      // 查找已有公司
      let company = companiesRef.current.find(
        (c) => c.name === trimmedName,
      );

      // 公司不存在则创建
      if (!company) {
        const coId = "co" + Date.now();
        company = {
          id: coId,
          name: trimmedName,
          industry: data.companyIndustry ?? "互联网",
          tags: [],
        };
        await ds.createCompany(company);
        setCompanies((prev) => [...prev, company!]);
      }

      // 创建 Application
      const appId = "ap" + Date.now();
      const record: Application = {
        id: appId,
        companyId: company.id,
        company: company.name,
        position: data.position.trim(),
        department: data.department?.trim() || undefined,
        status: data.status ?? "已投递",
        applyDate: data.applyDate ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: data.notes?.trim() || undefined,
      };
      await ds.createApplication(record);
      setApplications((prev) => [...prev, record]);
      return { applicationId: appId, companyId: company.id };
    },
    [],
  );

  const updateApplication = useCallback((id: string, updates: Partial<Application>) => {
    ds.updateApplication(id, updates);
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)),
    );
  }, []);

  const deleteApplication = useCallback(async (id: string) => {
    const result = await ds.cascadeDeleteApplication(id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
    if (result.deletedInterviews > 0) {
      setInterviews((prev) => prev.filter((iv) => iv.applicationId !== id));
    }
    return result;
  }, []);

  const addInterview = useCallback(
    async (data: Omit<Interview, "id" | "updatedAt" | "round" | "applicationId"> & { applicationId?: string; round?: string }): Promise<string> => {
      let appId = data.applicationId;

      // 未关联投递时，自动创建 Application + Company
      if (!appId) {
        const result = await addApplicationWithCompany({
          companyName: data.company,
          position: data.position,
          status: "面试中",
        });
        appId = result.applicationId;
      }

      const id = "iv" + Date.now();
      const record: Interview = {
        ...data,
        id,
        applicationId: appId,
        round: (data.round as Interview["round"]) ?? "其他",
        updatedAt: new Date().toISOString(),
      };
      await ds.createInterview(record);
      setInterviews((prev) => [...prev, record]);
      return id;
    },
    [addApplicationWithCompany],
  );

  const addCompany = useCallback(
    async (data: Omit<Company, "id">): Promise<string> => {
      const id = "co" + Date.now();
      const record: Company = { ...data, id };
      await ds.createCompany(record);
      setCompanies((prev) => [...prev, record]);
      return id;
    },
    [],
  );

  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    ds.updateCompany(id, updates);
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    const result = await ds.cascadeDeleteCompany(id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    if (result.deletedApplications > 0) {
      setApplications((prev) =>
        prev.filter((a) => a.companyId !== id),
      );
    }
    if (result.deletedInterviews > 0) {
      setInterviews((prev) =>
        prev.filter((iv) => {
          // 检查 interview 是否关联了被删除的 application
          const appExists = applications.some(
            (a) => a.id === iv.applicationId && a.companyId === id,
          );
          return !appExists;
        }),
      );
    }
    return result;
  }, [applications]);

  const deleteInterview = useCallback(async (id: string) => {
    await ds.deleteInterview(id);
    setInterviews((prev) => prev.filter((iv) => iv.id !== id));
  }, []);

  const [aiAnalyses, setAIAnalyses] = useState<AIAnalysis[]>([]);

  const [tasks, setTasks] = useState<Task[]>([]);

  // ── 早期声明：ref 用于 task 回调中触发 memory 刷新（refreshMemory 在后面定义）──

  const taskRef = useRef<Task[]>(tasks);
  taskRef.current = tasks;
  const refreshRef = useRef<() => void>(() => {});

  // 自增计数器，确保批量创建任务时 ID 唯一
  const taskIdCounter = useRef(0);

  const addTask = useCallback(
    async (data: Omit<Task, "id" | "createdAt">): Promise<string> => {
      const id = "tk" + Date.now() + "_" + (++taskIdCounter.current);
      const record: Task = { ...data, id, createdAt: new Date().toISOString() };
      await ds.createTask(record);
      setTasks((prev) => [...prev, record]);
      return id;
    },
    [],
  );

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    const wasCompleted = nextStatus === "completed";
    const patch = {
      status: nextStatus as Task["status"],
      completedAt: wasCompleted ? new Date().toISOString() : task.completedAt,
    };
    await ds.updateTask(id, patch);
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
      // 同步更新 ref，refreshMemory 立即可见
      taskRef.current = next;
      return next;
    });
    // 完成 AI 任务 → 自动更新长期记忆
    if (wasCompleted && task.source === "ai") {
      refreshRef.current();
    }
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    await ds.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await ds.updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const EMPTY_PROFILE: UserProfile = { targetRoles: [], projects: [], skills: [], background: "", goals: [] };
  const [userProfile, setUserProfile] = useState<UserProfile>(EMPTY_PROFILE);


  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      ds.saveUserProfile(next);
      return next;
    });
  }, []);

  // ── 状态引用（用于 UserMemory 自动刷新，render 时同步）──

  const ivRef = useRef(interviews);
  ivRef.current = interviews;
  const aiRef = useRef(aiAnalyses);
  aiRef.current = aiAnalyses;
  const upRef = useRef(userProfile);
  upRef.current = userProfile;
  // taskRef 已在上方声明（供 toggleTask 使用）

  // ── UserMemory（自动 + 手动刷新）──

  const [userMemory, setUserMemory] = useState<UserMemory | undefined>(undefined);

  /** 稳定引用：使用 ref 读取最新 state，不受闭包陈旧影响 */
  const refreshMemory = useCallback(() => {
    import("../services/memoryService")
      .then(({ generateUserMemory }) => {
        const m = generateUserMemory(
          ivRef.current,
          aiRef.current,
          taskRef.current,
          upRef.current,
        );
        ds.saveUserMemory(m);
        setUserMemory(m);
      })
      .catch(() => {
        // 静默失败，不阻塞主流程
      });
  }, []);
  // 将真实函数暴露给提前声明的 refreshRef
  refreshRef.current = refreshMemory;


  const updateUserMemory = useCallback((data: UserMemory) => {
    ds.saveUserMemory(data);
    setUserMemory(data);
  }, []);

  const addAIAnalysis = useCallback(
    async (data: Omit<AIAnalysis, "id" | "createdAt">): Promise<string> => {
      const id = "ai" + Date.now();
      const record: AIAnalysis = { ...data, id, createdAt: new Date().toISOString() };
      await ds.createAIAnalysis(record);
      setAIAnalyses((prev) => {
        const next = [...prev, record];
        // 同步更新 ref，refreshMemory 立即可见
        aiRef.current = next;
        return next;
      });
      // 面试复盘 / 能力画像 → 自动更新长期记忆
      if (record.type === "interview_review" || record.type === "capability_profile") {
        refreshRef.current();
      }
      return id;
    },
    [],
  );

  const loadDemoData = useCallback(async () => {
    if (interviews.length > 0 || applications.length > 0) return;
    try {
      setInterviews(MOCK_INTERVIEWS);
      await ds.saveInterviews(MOCK_INTERVIEWS);
      setApplications(MOCK_APPLICATIONS);
      await ds.saveApplications(MOCK_APPLICATIONS);
      setCompanies(MOCK_COMPANIES);
      await ds.saveCompanies(MOCK_COMPANIES);
      setAIAnalyses(MOCK_AI_ANALYSES);
      await ds.saveAIAnalyses(MOCK_AI_ANALYSES);
      setTasks(MOCK_TASKS);
      await ds.saveTasks(MOCK_TASKS);
    } catch (err) {
      console.error("loadDemoData 失败", err);
    }
  }, [interviews.length, applications.length]);

  return (
    <InterviewContext.Provider
      value={{ interviews, applications, companies, aiAnalyses, tasks, userProfile, userMemory, hydrated, getInterview, updateInterview, addInterview, addApplication, updateApplication, deleteApplication, addApplicationWithCompany, addTask, toggleTask, deleteTask, updateTask, addAIAnalysis, updateUserProfile, updateUserMemory, addCompany, updateCompany, deleteCompany, deleteInterview, loadDemoData }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterviews() {
  const ctx = useContext(InterviewContext);
  if (!ctx)
    throw new Error("useInterviews 必须在 InterviewProvider 内部使用");
  return ctx;
}

// ============================================================
// 工具函数
// ============================================================

/** 状态 → 颜色 */
export function getInterviewStatusStyle(s: string): string {
  if (s === "未开始")    return "bg-gray-50 text-gray-500 border-gray-200";
  if (s === "准备中")    return "bg-orange-50 text-orange-600 border-orange-200";
  if (s === "待面试")    return "bg-blue-50 text-blue-600 border-blue-200";
  if (s.includes("完成")) return "bg-emerald-50 text-emerald-600 border-emerald-200";
  if (s.includes("通过")) return "bg-purple-50 text-purple-600 border-purple-200";
  if (s.includes("未通过")) return "bg-red-50 text-red-500 border-red-200";
  return "bg-gray-50 text-gray-500 border-gray-200";
}

/** 状态 → 图标 */
export function getInterviewStatusIcon(s: string): string {
  if (s === "未开始")  return "📋";
  if (s === "准备中")  return "📚";
  if (s === "待面试")  return "📅";
  if (s === "一面完成") return "💬";
  if (s === "二面完成") return "🗣️";
  if (s === "已通过")  return "🎉";
  if (s === "未通过")  return "🚫";
  return "📌";
}

/** 问题分类 → 颜色 */
export function getCategoryStyle(c: QuestionCategory): string {
  switch (c) {
    case "技术":
      return "bg-orange-50 text-orange-600 border-orange-200";
    case "行为":
      return "bg-sky-50 text-sky-600 border-sky-200";
    case "综合":
      return "bg-violet-50 text-violet-600 border-violet-200";
  }
}

/** 相对时间 */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

/** 格式化日期（仅日期部分） */
export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
