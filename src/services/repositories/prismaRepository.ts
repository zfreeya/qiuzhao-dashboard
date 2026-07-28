/**
 * Prisma Repository — 数据库实现 IRepository 接口
 *
 * 激活步骤：
 *   1. npx prisma generate
 *   2. npx prisma db push
 *   3. 取消 lib/prisma.ts 中的 PrismaClient 注释
 *   4. 取消下方 prisma import 注释
 *   5. dataService.ts 中 getRepo() 改为返回 prismaRepository
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// import { prisma } from "../../lib/prisma"; // 激活时取消注释
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const prisma: any; // 占位，激活后用上方 import 替换

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
// Interview
// ============================================================

async function getInterviews(): Promise<Interview[]> {
  const rows: any[] = await prisma.interview.findMany();
  return rows.map((r: any) => ({
    ...r,
    questions: JSON.parse(r.questions),
    recordings: JSON.parse(r.recordings),
    aiReview: r.aiReview ? JSON.parse(r.aiReview) : undefined,
  })) as Interview[];
}

async function saveInterviews(_data: Interview[]): Promise<void> {}

async function createInterview(interview: Interview): Promise<Interview> {
  await prisma.interview.create({
    data: {
      id: interview.id,
      applicationId: interview.applicationId,
      round: interview.round,
      company: interview.company,
      position: interview.position,
      status: interview.status,
      interviewDate: interview.interviewDate,
      updatedAt: interview.updatedAt,
      companyId: interview.companyId ?? null,
      jd: interview.jd,
      questions: JSON.stringify(interview.questions),
      recordings: JSON.stringify(interview.recordings),
      summary: interview.summary,
      aiReview: interview.aiReview ? JSON.stringify(interview.aiReview) : null,
    },
  });
  return interview;
}

async function updateInterview(id: string, updates: Partial<Interview>): Promise<Interview | undefined> {
  const data: any = { updatedAt: new Date().toISOString() };
  if (updates.company !== undefined) data.company = updates.company;
  if (updates.position !== undefined) data.position = updates.position;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.jd !== undefined) data.jd = updates.jd;
  if (updates.summary !== undefined) data.summary = updates.summary;
  if (updates.interviewDate !== undefined) data.interviewDate = updates.interviewDate;
  if (updates.applicationId !== undefined) data.applicationId = updates.applicationId;
  if (updates.round !== undefined) data.round = updates.round;
  if (updates.questions !== undefined) data.questions = JSON.stringify(updates.questions);
  if (updates.recordings !== undefined) data.recordings = JSON.stringify(updates.recordings);
  if (updates.aiReview !== undefined) data.aiReview = JSON.stringify(updates.aiReview);
  try {
    const row: any = await prisma.interview.update({ where: { id }, data });
    return { ...row, questions: JSON.parse(row.questions), recordings: JSON.parse(row.recordings), aiReview: row.aiReview ? JSON.parse(row.aiReview) : undefined } as Interview;
  } catch { return undefined; }
}

async function deleteInterview(id: string): Promise<boolean> {
  try { await prisma.interview.delete({ where: { id } }); return true; } catch { return false; }
}

// ============================================================
// Application
// ============================================================

async function getApplications(): Promise<Application[]> {
  return prisma.application.findMany() as Promise<Application[]>;
}

async function saveApplications(_data: Application[]): Promise<void> {}

async function createApplication(app: Application): Promise<Application> {
  await prisma.application.create({
    data: { ...app, department: app.department ?? null, notes: app.notes ?? null },
  });
  return app;
}

async function updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined> {
  try { return await prisma.application.update({ where: { id }, data: { ...updates, updatedAt: new Date().toISOString() } }) as Application; } catch { return undefined; }
}

async function deleteApplication(id: string): Promise<boolean> {
  try { await prisma.application.delete({ where: { id } }); return true; } catch { return false; }
}

// ============================================================
// Company
// ============================================================

async function getCompanies(): Promise<Company[]> {
  const rows: any[] = await prisma.company.findMany();
  return rows.map((r: any) => ({ ...r, tags: JSON.parse(r.tags) })) as Company[];
}

async function saveCompanies(data: Company[]): Promise<void> {
  for (const c of data) {
    await prisma.company.upsert({
      where: { id: c.id },
      update: { name: c.name, industry: c.industry, tags: JSON.stringify(c.tags) },
      create: { id: c.id, name: c.name, industry: c.industry, tags: JSON.stringify(c.tags) },
    });
  }
}

async function createCompany(company: Company): Promise<Company> {
  await prisma.company.create({
    data: { id: company.id, name: company.name, industry: company.industry, tags: JSON.stringify(company.tags) },
  });
  return company;
}

async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
  const data: any = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.industry !== undefined) data.industry = updates.industry;
  if (updates.tags !== undefined) data.tags = JSON.stringify(updates.tags);
  if (updates.website !== undefined) data.website = updates.website;
  if (updates.notes !== undefined) data.notes = updates.notes;
  try {
    const row: any = await prisma.company.update({ where: { id }, data });
    return { ...row, tags: JSON.parse(row.tags) } as Company;
  } catch { return undefined; }
}

async function deleteCompany(id: string): Promise<boolean> {
  try { await prisma.company.delete({ where: { id } }); return true; } catch { return false; }
}

// ============================================================
// AIAnalysis
// ============================================================

async function getAIAnalyses(): Promise<AIAnalysis[]> {
  const rows: any[] = await prisma.aiAnalysis.findMany();
  return rows.map((r: any) => ({ ...r, result: JSON.parse(r.result), input: JSON.parse(r.input) })) as AIAnalysis[];
}

async function saveAIAnalyses(_data: AIAnalysis[]): Promise<void> {}

async function createAIAnalysis(analysis: AIAnalysis): Promise<AIAnalysis> {
  await prisma.aiAnalysis.create({ data: { ...analysis, result: JSON.stringify(analysis.result), input: JSON.stringify(analysis.input) } });
  return analysis;
}

async function updateAIAnalysis(id: string, _updates: Partial<AIAnalysis>): Promise<AIAnalysis | undefined> {
  // AIAnalysis 更新预留：需要 JSON 字段合并逻辑
  void id;
  return undefined;
}

async function deleteAIAnalysis(id: string): Promise<boolean> {
  try { await prisma.aiAnalysis.delete({ where: { id } }); return true; } catch { return false; }
}

// ============================================================
// Task
// ============================================================

async function getTasks(): Promise<Task[]> {
  const rows: any[] = await prisma.task.findMany();
  return rows.map((r: any) => ({ ...r, feedbackAnalysis: r.feedbackAnalysis ? JSON.parse(r.feedbackAnalysis) : undefined })) as Task[];
}

async function saveTasks(_data: Task[]): Promise<void> {}

async function createTask(task: Task): Promise<Task> {
  await prisma.task.create({ data: { ...task, feedbackAnalysis: task.feedbackAnalysis ? JSON.stringify(task.feedbackAnalysis) : null } });
  return task;
}

async function updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
  const data: any = {};
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.priority !== undefined) data.priority = updates.priority;
  if (updates.content !== undefined) data.content = updates.content;
  if (updates.completedAt !== undefined) data.completedAt = updates.completedAt;
  if (updates.feedback !== undefined) data.feedback = updates.feedback;
  if (updates.feedbackStatus !== undefined) data.feedbackStatus = updates.feedbackStatus;
  if (updates.feedbackAnalysis !== undefined) data.feedbackAnalysis = JSON.stringify(updates.feedbackAnalysis);
  try { return await prisma.task.update({ where: { id }, data }) as Task; } catch { return undefined; }
}

async function deleteTask(id: string): Promise<boolean> {
  try { await prisma.task.delete({ where: { id } }); return true; } catch { return false; }
}

// ============================================================
// UserProfile
// ============================================================

async function getUserProfile(): Promise<UserProfile | undefined> {
  const row: any = await prisma.userProfile.findFirst();
  if (!row) return undefined;
  return { targetRoles: JSON.parse(row.targetRoles), projects: JSON.parse(row.projects), skills: JSON.parse(row.skills), background: row.background, goals: JSON.parse(row.goals) } as UserProfile;
}

async function saveUserProfile(data: UserProfile): Promise<void> {
  await prisma.userProfile.upsert({
    where: { id: "default" },
    update: { targetRoles: JSON.stringify(data.targetRoles), projects: JSON.stringify(data.projects), skills: JSON.stringify(data.skills), background: data.background, goals: JSON.stringify(data.goals) },
    create: { id: "default", targetRoles: JSON.stringify(data.targetRoles), projects: JSON.stringify(data.projects), skills: JSON.stringify(data.skills), background: data.background, goals: JSON.stringify(data.goals) },
  });
}

// ============================================================
// UserMemory
// ============================================================

async function getUserMemory(): Promise<UserMemory | undefined> {
  const row: any = await prisma.userMemory.findFirst();
  if (!row) return undefined;
  return {
    strengths: JSON.parse(row.strengths),
    weaknesses: JSON.parse(row.weaknesses),
    targetRoles: JSON.parse(row.targetRoles),
    projects: JSON.parse(row.projects),
    interviewPatterns: JSON.parse(row.interviewPatterns),
    learningGoals: JSON.parse(row.learningGoals),
    aiSummary: row.aiSummary,
    updatedAt: row.updatedAt,
  } as UserMemory;
}

async function saveUserMemory(data: UserMemory): Promise<void> {
  await prisma.userMemory.upsert({
    where: { id: "default" },
    update: {
      strengths: JSON.stringify(data.strengths),
      weaknesses: JSON.stringify(data.weaknesses),
      targetRoles: JSON.stringify(data.targetRoles),
      projects: JSON.stringify(data.projects),
      interviewPatterns: JSON.stringify(data.interviewPatterns),
      learningGoals: JSON.stringify(data.learningGoals),
      aiSummary: data.aiSummary,
      updatedAt: data.updatedAt,
    },
    create: {
      id: "default",
      strengths: JSON.stringify(data.strengths),
      weaknesses: JSON.stringify(data.weaknesses),
      targetRoles: JSON.stringify(data.targetRoles),
      projects: JSON.stringify(data.projects),
      interviewPatterns: JSON.stringify(data.interviewPatterns),
      learningGoals: JSON.stringify(data.learningGoals),
      aiSummary: data.aiSummary,
      updatedAt: data.updatedAt,
    },
  });
}

// ============================================================
// 导出
// ============================================================

export const prismaRepository: IRepository = {
  getInterviews, saveInterviews, createInterview, updateInterview, deleteInterview,
  getApplications, saveApplications, createApplication, updateApplication, deleteApplication,
  getCompanies, saveCompanies, createCompany, updateCompany, deleteCompany,
  getAIAnalyses, saveAIAnalyses, createAIAnalysis, updateAIAnalysis, deleteAIAnalysis,
  getTasks, saveTasks, createTask, updateTask, deleteTask,
  getUserProfile, saveUserProfile,
  getUserMemory, saveUserMemory,
};
