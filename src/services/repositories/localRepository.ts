/**
 * Local Repository — localStorage 实现 IRepository 接口
 */

import { safeRead, safeReadObject, safeWrite } from "../../_shared/storage";
import type { IRepository } from "./types";
import type {
  Interview,
  Application,
  Company,
  AIAnalysis,
  Task,
  UserProfile,
  UserMemory,
} from "../../_shared/entityTypes";

// ============================================================
// Storage keys
// ============================================================

const KEYS = {
  interviews: "qiuzhao_interviews",
  applications: "qiuzhao_applications",
  companies: "qiuzhao_companies",
  aiAnalyses: "qiuzhao_ai_analyses",
  tasks: "qiuzhao_tasks",
  userProfile: "qiuzhao_user_profile",
  userMemory: "qiuzhao_user_memory",
} as const;

// ============================================================
// Interview
// ============================================================

function normalizeRound(round: string): Interview["round"] {
  const validRounds = ["一面", "二面", "三面", "HR面", "终面", "其他"] as const;
  if (validRounds.includes(round as (typeof validRounds)[number])) {
    return round as Interview["round"];
  }
  // 旧数据兼容：根据文本推断
  if (round.includes("一") || round.includes("1")) return "一面";
  if (round.includes("二") || round.includes("2")) return "二面";
  if (round.includes("三") || round.includes("3")) return "三面";
  if (/HR|hr|人事/.test(round)) return "HR面";
  if (/终|final|最后/.test(round)) return "终面";
  return "其他";
}

async function getInterviews(): Promise<Interview[]> {
  const list = safeRead<Interview[]>(KEYS.interviews) ?? [];
  // 兼容旧数据：补全新字段默认值，规范化 round
  return list.map((iv) => ({
    ...iv,
    round: normalizeRound(iv.round ?? ""),
    location: iv.location ?? undefined,
    link: iv.link ?? undefined,
  }));
}

async function saveInterviews(data: Interview[]): Promise<void> {
  safeWrite(KEYS.interviews, data);
}

async function createInterview(interview: Interview): Promise<Interview> {
  const list = await getInterviews();
  list.push(interview);
  await saveInterviews(list);
  return interview;
}

async function updateInterview(id: string, updates: Partial<Interview>): Promise<Interview | undefined> {
  const list = await getInterviews();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveInterviews(list);
  return list[idx];
}

async function deleteInterview(id: string): Promise<boolean> {
  const list = await getInterviews();
  const filtered = list.filter((i) => i.id !== id);
  if (filtered.length === list.length) return false;
  await saveInterviews(filtered);
  return true;
}

// ============================================================
// Application
// ============================================================

async function getApplications(): Promise<Application[]> {
  const list = safeRead<Application[]>(KEYS.applications) ?? [];
  // 兼容旧数据：补全新字段默认值
  return list.map((a) => ({
    ...a,
    department: a.department ?? undefined,
    notes: a.notes ?? undefined,
  }));
}

async function saveApplications(data: Application[]): Promise<void> {
  safeWrite(KEYS.applications, data);
}

async function createApplication(app: Application): Promise<Application> {
  const list = await getApplications();
  list.push(app);
  await saveApplications(list);
  return app;
}

async function updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined> {
  const list = await getApplications();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveApplications(list);
  return list[idx];
}

async function deleteApplication(id: string): Promise<boolean> {
  const list = await getApplications();
  const filtered = list.filter((a) => a.id !== id);
  if (filtered.length === list.length) return false;
  await saveApplications(filtered);
  return true;
}

// ============================================================
// Company
// ============================================================

async function getCompanies(): Promise<Company[]> {
  const list = safeRead<Company[]>(KEYS.companies) ?? [];
  // 兼容旧数据：确保 tags 始终为数组
  return list.map((c) => ({ ...c, tags: Array.isArray(c.tags) ? c.tags : [] }));
}

async function saveCompanies(data: Company[]): Promise<void> {
  safeWrite(KEYS.companies, data);
}

async function createCompany(company: Company): Promise<Company> {
  const list = await getCompanies();
  list.push(company);
  await saveCompanies(list);
  return company;
}

async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
  const list = await getCompanies();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...updates };
  await saveCompanies(list);
  return list[idx];
}

async function deleteCompany(id: string): Promise<boolean> {
  const list = await getCompanies();
  const filtered = list.filter((c) => c.id !== id);
  if (filtered.length === list.length) return false;
  await saveCompanies(filtered);
  return true;
}

// ============================================================
// AIAnalysis
// ============================================================

async function getAIAnalyses(): Promise<AIAnalysis[]> {
  return safeRead<AIAnalysis[]>(KEYS.aiAnalyses) ?? [];
}

async function saveAIAnalyses(data: AIAnalysis[]): Promise<void> {
  safeWrite(KEYS.aiAnalyses, data);
}

async function createAIAnalysis(analysis: AIAnalysis): Promise<AIAnalysis> {
  const list = await getAIAnalyses();
  list.push(analysis);
  await saveAIAnalyses(list);
  return analysis;
}

async function updateAIAnalysis(id: string, updates: Partial<AIAnalysis>): Promise<AIAnalysis | undefined> {
  const list = await getAIAnalyses();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...updates };
  await saveAIAnalyses(list);
  return list[idx];
}

async function deleteAIAnalysis(id: string): Promise<boolean> {
  const list = await getAIAnalyses();
  const filtered = list.filter((a) => a.id !== id);
  if (filtered.length === list.length) return false;
  await saveAIAnalyses(filtered);
  return true;
}

// ============================================================
// Task
// ============================================================

async function getTasks(): Promise<Task[]> {
  return safeRead<Task[]>(KEYS.tasks) ?? [];
}

async function saveTasks(data: Task[]): Promise<void> {
  safeWrite(KEYS.tasks, data);
}

async function createTask(task: Task): Promise<Task> {
  const list = await getTasks();
  list.push(task);
  await saveTasks(list);
  return task;
}

async function updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
  const list = await getTasks();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...updates };
  await saveTasks(list);
  return list[idx];
}

async function deleteTask(id: string): Promise<boolean> {
  const list = await getTasks();
  const filtered = list.filter((t) => t.id !== id);
  if (filtered.length === list.length) return false;
  await saveTasks(filtered);
  return true;
}

// ============================================================
// UserProfile
// ============================================================

async function getUserProfile(): Promise<UserProfile | undefined> {
  return safeReadObject<UserProfile>(KEYS.userProfile);
}

async function saveUserProfile(data: UserProfile): Promise<void> {
  safeWrite(KEYS.userProfile, data);
}

// ============================================================
// UserMemory
// ============================================================

async function getUserMemory(): Promise<UserMemory | undefined> {
  return safeReadObject<UserMemory>(KEYS.userMemory);
}

async function saveUserMemory(data: UserMemory): Promise<void> {
  safeWrite(KEYS.userMemory, data);
}

// ============================================================
// 导出（满足 IRepository 接口）
// ============================================================

export const localRepository: IRepository = {
  getInterviews,
  saveInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  getApplications,
  saveApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getCompanies,
  saveCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getAIAnalyses,
  saveAIAnalyses,
  createAIAnalysis,
  updateAIAnalysis,
  deleteAIAnalysis,
  getTasks,
  saveTasks,
  createTask,
  updateTask,
  deleteTask,
  getUserProfile,
  saveUserProfile,
  getUserMemory,
  saveUserMemory,
};
