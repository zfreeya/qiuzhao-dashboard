/**
 * Repository 统一接口
 *
 * 所有方法返回 Promise，兼容同步 localStorage 和异步 Prisma
 */

import type {
  Interview,
  Application,
  Company,
  AIAnalysis,
  Task,
  UserProfile,
  UserMemory,
} from "../../_shared/entityTypes";

export interface IRepository {
  // Interview
  getInterviews(): Promise<Interview[]>;
  saveInterviews(data: Interview[]): Promise<void>;
  createInterview(interview: Interview): Promise<Interview>;
  updateInterview(id: string, updates: Partial<Interview>): Promise<Interview | undefined>;
  deleteInterview(id: string): Promise<boolean>;

  // Application
  getApplications(): Promise<Application[]>;
  saveApplications(data: Application[]): Promise<void>;
  createApplication(app: Application): Promise<Application>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<boolean>;

  // Company
  getCompanies(): Promise<Company[]>;
  saveCompanies(data: Company[]): Promise<void>;
  createCompany(company: Company): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // AIAnalysis
  getAIAnalyses(): Promise<AIAnalysis[]>;
  saveAIAnalyses(data: AIAnalysis[]): Promise<void>;
  createAIAnalysis(analysis: AIAnalysis): Promise<AIAnalysis>;
  updateAIAnalysis(id: string, updates: Partial<AIAnalysis>): Promise<AIAnalysis | undefined>;
  deleteAIAnalysis(id: string): Promise<boolean>;

  // Task
  getTasks(): Promise<Task[]>;
  saveTasks(data: Task[]): Promise<void>;
  createTask(task: Task): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // UserProfile
  getUserProfile(): Promise<UserProfile | undefined>;
  saveUserProfile(data: UserProfile): Promise<void>;

  // UserMemory
  getUserMemory(): Promise<UserMemory | undefined>;
  saveUserMemory(data: UserMemory): Promise<void>;
}
