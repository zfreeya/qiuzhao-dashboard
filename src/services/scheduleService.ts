/**
 * 日程服务 — 独立 ScheduleEvent CRUD
 *
 * 不与 Interview / Application / Company 耦合，
 * 使用 localStorage 存储，接口设计便于未来迁移数据库。
 */

// ============================================================
// 类型
// ============================================================

export type Reminder = "none" | "10min" | "30min" | "1hour";
export type ScheduleEventColor = "blue" | "green" | "gray";
export type ScheduleCategory = "面试" | "笔试" | "其他";

export interface ScheduleEvent {
  id: string;
  category: ScheduleCategory;   // 一级分类
  eventType: string;             // 自由文本："一面"、"二面"、"HR面"、"行测"
  company?: string;              // 可选：关联公司（纯文本，非外键）
  position?: string;             // 可选：关联岗位
  date: string;                  // YYYY-MM-DD
  startTime: string;             // HH:mm
  endTime: string;               // HH:mm
  reminder: Reminder;
  location?: string;             // 地点
  link?: string;                 // 会议链接
  meetingInfo?: string;          // 补充信息
  note?: string;
  createdAt: string;
}

/** 根据 category 推断颜色 */
export function getEventColor(category: string | undefined): ScheduleEventColor {
  if (!category) return "gray";
  if (category === "面试") return "blue";
  if (category === "笔试") return "green";
  return "gray";
}

/** 颜色 → Tailwind class */
export function getEventColorClasses(color: ScheduleEventColor, isCompact?: boolean): string {
  if (isCompact) {
    if (color === "blue") return "bg-blue-50 border-blue-200 text-blue-700";
    if (color === "green") return "bg-emerald-50 border-emerald-200 text-emerald-700";
    return "bg-gray-50 border-gray-200 text-gray-600";
  }
  if (color === "blue") return "border-blue-200 bg-blue-50 text-blue-700";
  if (color === "green") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-gray-200 bg-gray-50 text-gray-600";
}

// ============================================================
// localStorage key
// ============================================================

const STORAGE_KEY = "qiuzhao_schedules";

// ============================================================
// 读写
// ============================================================

function readAll(): ScheduleEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 迁移旧数据
    return parsed.map(migrateItem);
  } catch {
    return [];
  }
}

/** 推断旧数据的 category */
function inferCategory(eventType: string | undefined, oldType: unknown): ScheduleCategory {
  const text = String(eventType ?? oldType ?? "");
  if (/面|HR|终面|群面|交叉面/.test(text)) return "面试";
  if (/笔试|测评|考试|行测/.test(text)) return "笔试";
  return "其他";
}

/** 兼容旧版本数据 */
function migrateItem(raw: Record<string, unknown>): ScheduleEvent {
  const evType = String(raw.eventType ?? raw.type ?? "");
  return {
    id: String(raw.id ?? `sch_legacy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
    category: (raw.category as ScheduleCategory) || inferCategory(raw.eventType as string, raw.type),
    eventType: evType,
    company: raw.company ? String(raw.company) : undefined,
    position: raw.position ? String(raw.position) : undefined,
    date: String(raw.date ?? ""),
    startTime: String(raw.startTime ?? "09:00"),
    endTime: String(raw.endTime ?? "10:00"),
    reminder: isValidReminder(raw.reminder) ? (raw.reminder as Reminder) : "30min",
    location: raw.location ? String(raw.location) : undefined,
    link: raw.link ? String(raw.link) : undefined,
    meetingInfo: raw.meetingInfo ? String(raw.meetingInfo) : undefined,
    note: raw.note ? String(raw.note) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function isValidReminder(v: unknown): v is Reminder {
  return v === "none" || v === "10min" || v === "30min" || v === "1hour";
}

function writeAll(list: ScheduleEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 静默失败
  }
}

// ============================================================
// 公开 API
// ============================================================

export function getSchedules(): ScheduleEvent[] {
  return readAll().sort((a, b) => {
    const da = `${a.date}T${a.startTime}`;
    const db = `${b.date}T${b.startTime}`;
    return da.localeCompare(db);
  });
}

export function addSchedule(
  data: Omit<ScheduleEvent, "id" | "createdAt">,
): ScheduleEvent {
  const record: ScheduleEvent = {
    ...data,
    id: `sch_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const list = readAll();
  list.push(record);
  writeAll(list);
  return record;
}

export function updateSchedule(
  id: string,
  updates: Partial<Omit<ScheduleEvent, "id" | "createdAt">>,
): ScheduleEvent | undefined {
  const list = readAll();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...updates };
  writeAll(list);
  return list[idx];
}

export function deleteSchedule(id: string): boolean {
  const list = readAll();
  const filtered = list.filter((s) => s.id !== id);
  if (filtered.length === list.length) return false;
  writeAll(filtered);
  return true;
}
