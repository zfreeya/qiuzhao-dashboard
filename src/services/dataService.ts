/**
 * 数据访问抽象层（Data Service）
 *
 * 默认使用 localRepository（localStorage）。
 * 未来可切换为 prismaRepository：将 getRepo() 改为返回 prismaRepository 即可。
 */

import { localRepository } from "./repositories/localRepository";
import type { IRepository } from "./repositories/types";

let _repo: IRepository | null = null;

function getRepo(): IRepository {
  if (!_repo) {
    _repo = localRepository;
  }
  return _repo;
}

// ============================================================
// Interview
// ============================================================

export function getInterviews() { return getRepo().getInterviews(); }
export function saveInterviews(data: Parameters<IRepository["saveInterviews"]>[0]) { return getRepo().saveInterviews(data); }
export function createInterview(data: Parameters<IRepository["createInterview"]>[0]) { return getRepo().createInterview(data); }
export function updateInterview(id: string, updates: Parameters<IRepository["updateInterview"]>[1]) { return getRepo().updateInterview(id, updates); }
export function deleteInterview(id: string) { return getRepo().deleteInterview(id); }

// ============================================================
// Application
// ============================================================

export function getApplications() { return getRepo().getApplications(); }
export function saveApplications(data: Parameters<IRepository["saveApplications"]>[0]) { return getRepo().saveApplications(data); }
export function createApplication(data: Parameters<IRepository["createApplication"]>[0]) { return getRepo().createApplication(data); }
export function updateApplication(id: string, updates: Parameters<IRepository["updateApplication"]>[1]) { return getRepo().updateApplication(id, updates); }
export function deleteApplication(id: string) { return getRepo().deleteApplication(id); }

/** 级联删除投递：删除 Application 及其所有关联 Interview */
export async function cascadeDeleteApplication(appId: string): Promise<{
  deletedApplication: boolean;
  deletedInterviews: number;
}> {
  const repo = getRepo();
  const result = { deletedApplication: false, deletedInterviews: 0 };

  const allInterviews = await repo.getInterviews();
  const linkedInterviews = allInterviews.filter((iv) => iv.applicationId === appId);

  for (const iv of linkedInterviews) {
    await repo.deleteInterview(iv.id);
    result.deletedInterviews++;
  }

  // 解除关联的 Task
  const allTasks = await repo.getTasks();
  for (const task of allTasks.filter((t) => t.applicationId === appId)) {
    await repo.updateTask(task.id, { applicationId: undefined });
  }

  result.deletedApplication = await repo.deleteApplication(appId);
  return result;
}

// ============================================================
// Company
// ============================================================

export function getCompanies() { return getRepo().getCompanies(); }
export function saveCompanies(data: Parameters<IRepository["saveCompanies"]>[0]) { return getRepo().saveCompanies(data); }
export function createCompany(data: Parameters<IRepository["createCompany"]>[0]) { return getRepo().createCompany(data); }
export function updateCompany(id: string, updates: Parameters<IRepository["updateCompany"]>[1]) { return getRepo().updateCompany(id, updates); }
export function deleteCompany(id: string) { return getRepo().deleteCompany(id); }

/**
 * 级联删除公司及其关联的 Application 和 Interview。
 * 保留 AIAnalysis（历史价值）和独立 Task（改为不关联 application）。
 * 不处理 ScheduleEvent（日程独立）。
 */
export async function cascadeDeleteCompany(id: string): Promise<{
  deletedCompany: boolean;
  deletedApplications: number;
  deletedInterviews: number;
}> {
  const repo = getRepo();
  const result = { deletedCompany: false, deletedApplications: 0, deletedInterviews: 0 };

  // 1. 查找关联的 Application
  const allApps = await repo.getApplications();
  const linkedApps = allApps.filter((a) => a.companyId === id);

  // 2. 对每个 Application，删除关联的 Interview
  const allInterviews = await repo.getInterviews();
  for (const app of linkedApps) {
    const linkedInterviews = allInterviews.filter((iv) => iv.applicationId === app.id);
    for (const iv of linkedInterviews) {
      await repo.deleteInterview(iv.id);
      result.deletedInterviews++;
    }
    // 解除关联的 Task（不删除，只清 applicationId）
    const allTasks = await repo.getTasks();
    for (const task of allTasks.filter((t) => t.applicationId === app.id)) {
      await repo.updateTask(task.id, { applicationId: undefined });
    }
    await repo.deleteApplication(app.id);
    result.deletedApplications++;
  }

  // 3. 删除公司本身
  result.deletedCompany = await repo.deleteCompany(id);

  return result;
}

/**
 * 清理孤儿数据：删除无关联 Company 的 Application，以及无关联 Application 的 Interview
 */
export async function cleanupOrphanData(): Promise<{
  removedApplications: number;
  removedInterviews: number;
}> {
  const repo = getRepo();
  const result = { removedApplications: 0, removedInterviews: 0 };

  const companies = await repo.getCompanies();
  const companyIds = new Set(companies.map((c) => c.id));
  const applications = await repo.getApplications();
  const applicationIds = new Set(applications.map((a) => a.id));

  // 删除无关联 Company 的 Application
  for (const app of applications) {
    if (!app.companyId || !companyIds.has(app.companyId)) {
      // 先删关联的 Interview
      const interviews = await repo.getInterviews();
      for (const iv of interviews.filter((i) => i.applicationId === app.id)) {
        await repo.deleteInterview(iv.id);
        result.removedInterviews++;
      }
      await repo.deleteApplication(app.id);
      result.removedApplications++;
    }
  }

  // 删除无关联 Application 的 Interview
  const interviews = await repo.getInterviews();
  for (const iv of interviews) {
    if (!iv.applicationId || !applicationIds.has(iv.applicationId)) {
      await repo.deleteInterview(iv.id);
      result.removedInterviews++;
    }
  }

  return result;
}

// ============================================================
// AIAnalysis
// ============================================================

export function getAIAnalyses() { return getRepo().getAIAnalyses(); }
export function saveAIAnalyses(data: Parameters<IRepository["saveAIAnalyses"]>[0]) { return getRepo().saveAIAnalyses(data); }
export function createAIAnalysis(data: Parameters<IRepository["createAIAnalysis"]>[0]) { return getRepo().createAIAnalysis(data); }
export function updateAIAnalysis(id: string, updates: Parameters<IRepository["updateAIAnalysis"]>[1]) { return getRepo().updateAIAnalysis(id, updates); }
export function deleteAIAnalysis(id: string) { return getRepo().deleteAIAnalysis(id); }

// ============================================================
// Task
// ============================================================

export function getTasks() { return getRepo().getTasks(); }
export function saveTasks(data: Parameters<IRepository["saveTasks"]>[0]) { return getRepo().saveTasks(data); }
export function createTask(data: Parameters<IRepository["createTask"]>[0]) { return getRepo().createTask(data); }
export function updateTask(id: string, updates: Parameters<IRepository["updateTask"]>[1]) { return getRepo().updateTask(id, updates); }
export function deleteTask(id: string) { return getRepo().deleteTask(id); }

// ============================================================
// UserProfile
// ============================================================

export function getUserProfile() { return getRepo().getUserProfile(); }
export function saveUserProfile(data: Parameters<IRepository["saveUserProfile"]>[0]) { return getRepo().saveUserProfile(data); }

// ============================================================
// UserMemory
// ============================================================

export function getUserMemory() { return getRepo().getUserMemory(); }
export function saveUserMemory(data: Parameters<IRepository["saveUserMemory"]>[0]) { return getRepo().saveUserMemory(data); }
