/**
 * Application 业务逻辑
 * — 投递漏斗计算、状态流转校验
 */

import type { Application, ApplicationStatus } from "../_shared/InterviewContext";
import { APPLICATION_TRANSITIONS, isValidTransition } from "../_shared/InterviewContext";

// ============================================================
// 漏斗数据
// ============================================================

export interface FunnelData {
  applied: { count: number; unit: string };
  exams: { count: number; unit: string };
  interviews: { count: number; unit: string };
  offers: { count: number; unit: string };
}

export function getFunnelData(applications: Application[]): FunnelData {
  return {
    applied: { count: applications.length, unit: "家公司" },
    exams: {
      count: applications.filter(
        (a) => a.status === "笔试中" || a.status === "已笔试",
      ).length,
      unit: "家",
    },
    interviews: {
      count: applications.filter((a) => a.status === "面试中").length,
      unit: "家",
    },
    offers: {
      count: applications.filter((a) => a.status === "已Offer").length,
      unit: "个",
    },
  };
}

export function getFunnelRates(funnel: FunnelData) {
  return {
    exam:
      funnel.applied.count > 0
        ? Math.round((funnel.exams.count / funnel.applied.count) * 100)
        : 0,
    interview:
      funnel.exams.count > 0
        ? Math.round((funnel.interviews.count / funnel.exams.count) * 100)
        : 0,
    offer:
      funnel.interviews.count > 0
        ? Math.round((funnel.offers.count / funnel.interviews.count) * 100)
        : 0,
  };
}

// ============================================================
// 状态流转
// ============================================================

/** 获取某状态下允许流转到的目标状态列表 */
export function getAllowedTransitions(
  status: ApplicationStatus,
): ApplicationStatus[] {
  return APPLICATION_TRANSITIONS[status] ?? [];
}

/** 检查是否为终态 */
export function isTerminalStatus(status: ApplicationStatus): boolean {
  return getAllowedTransitions(status).length === 0;
}

/** 状态变更（经状态机校验） */
export function updateStatus(
  app: Application,
  newStatus: ApplicationStatus,
): Application {
  if (!isValidTransition(app.status, newStatus)) {
    throw new Error(
      `非法状态流转: ${app.status} → ${newStatus}。` +
      `允许的目标状态: ${getAllowedTransitions(app.status).join("、") || "无（终态）"}`,
    );
  }
  return { ...app, status: newStatus, updatedAt: new Date().toISOString() };
}
