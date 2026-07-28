/**
 * localStorage 工具
 *
 * 设计要点：
 * - 数据用 { version, data } 包裹，方便未来结构升级
 * - 所有读写都有 try/catch，异常时返回 undefined（调用方回退到 mock）
 * - SSR 兼容：无 window 时直接返回 undefined
 */

const STORAGE_VERSION = 1;

interface StorageEnvelope<T> {
  version: number;
  data: T;
}

/** 安全读取 */
export function safeRead<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;

    const parsed: unknown = JSON.parse(raw);

    // 校验结构
    if (!isEnvelope(parsed)) return undefined;

    const envelope = parsed as StorageEnvelope<T>;

    // 校验版本（只读当前版本）
    if (envelope.version !== STORAGE_VERSION) return undefined;

    // 校验 data 是数组
    if (!Array.isArray(envelope.data)) {
      return undefined;
    }

    return envelope.data;
  } catch {
    // JSON 解析失败、数据结构异常等，静默回退
    return undefined;
  }
}

/** 安全写入 */
export function safeWrite<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    const envelope: StorageEnvelope<T> = {
      version: STORAGE_VERSION,
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // 存储满、隐私模式等，静默失败
  }
}

/** 安全读取对象（非数组数据），不受 safeRead 的数组校验限制 */
export function safeReadObject<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;

    const parsed: unknown = JSON.parse(raw);

    if (!isEnvelope(parsed)) return undefined;

    const envelope = parsed as StorageEnvelope<T>;

    if (envelope.version !== STORAGE_VERSION) return undefined;

    // 只要求 data 存在且为真值（对象 / 非空字符串等均可）
    if (!envelope.data) return undefined;

    return envelope.data;
  } catch {
    return undefined;
  }
}

/** 类型守卫：判断是否为合法的 StorageEnvelope */
function isEnvelope(v: unknown): v is Record<"version" | "data", unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    "version" in v &&
    "data" in v
  );
}
