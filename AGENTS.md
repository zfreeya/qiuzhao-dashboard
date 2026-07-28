# AGENTS.md — 秋招复盘系统

## 项目概述

Next.js 14 App Router 项目，面向校招求职者的个人求职追踪工具。**纯客户端架构**：所有数据存储在浏览器 localStorage，无后端服务器。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14.2 (App Router) |
| UI | React 18 + Tailwind CSS 3.4 |
| 语言 | TypeScript 5 (strict mode) |
| AI | DeepSeek API (via `openai` SDK，兼容接口) |
| 数据库 | **localStorage**（主要）/ Prisma 7 + SQLite（预留，未激活） |
| 包管理 | npm |

## 目录结构

```
src/
├── _shared/                  # 共享模块
│   ├── entityTypes.ts        # 所有实体类型定义（独立于 React，无依赖）
│   ├── InterviewContext.tsx   # React Context 全局状态（hydration + CRUD）
│   └── storage.ts            # localStorage 安全读写工具（版本化信封）
│
├── app/                      # Next.js App Router 页面
│   ├── page.tsx              # 首页（仪表盘）
│   ├── layout.tsx            # 根布局（Navbar + InterviewProvider）
│   ├── _components/Navbar.tsx
│   ├── companies/
│   │   ├── page.tsx          # 公司库列表
│   │   └── [id]/page.tsx     # 公司详情（岗位列表）
│   ├── applications/
│   │   ├── new/page.tsx      # 新增投递
│   │   └── [id]/edit/page.tsx
│   ├── interviews/
│   │   ├── page.tsx          # 面试列表（按投递分组）
│   │   ├── new/page.tsx      # 新增面试
│   │   └── [id]/page.tsx     # 面试详情/复盘
│   ├── profile/page.tsx      # 能力画像
│   ├── memory/page.tsx       # AI 长期记忆
│   └── data/page.tsx         # 数据导入/导出/清理
│
├── components/
│   ├── AIReviewModule.tsx     # AI 面试诊断组件
│   └── calendar/             # 独立日程日历组件
│       ├── ScheduleCalendar.tsx
│       ├── ScheduleEditor.tsx
│       └── ScheduleEventCard.tsx
│
├── services/                 # 业务逻辑层
│   ├── dataService.ts        # 数据访问抽象（默认 localRepository）
│   ├── applicationService.ts # 漏斗计算、状态机
│   ├── interviewService.ts   # 候选人生成、能力评分
│   ├── scheduleService.ts    # 独立日程 CRUD
│   ├── aiAnalysisService.ts  # AI 分析查询
│   ├── llmService.ts         # DeepSeek API 调用
│   ├── memoryService.ts      # UserMemory 聚合生成
│   ├── abilityProfileService.ts
│   ├── evidenceService.ts
│   ├── ai-service.ts
│   └── repositories/
│       ├── types.ts          # IRepository 接口
│       ├── localRepository.ts # localStorage 实现（默认）
│       └── prismaRepository.ts # Prisma 实现（预留）
│
├── prompts/                  # AI Prompt 模板
│   ├── jdAnalysisPrompt.ts
│   ├── abilityProfilePrompt.ts
│   ├── growthPrompt.ts
│   ├── evidenceExtractionPrompt.ts
│   └── feedbackAnalysisPrompt.ts
│
├── lib/prisma.ts             # Prisma 客户端（已注释，未激活）
└── server/llm-provider.ts    # LLM 提供者配置
```

## 数据模型

### 三层实体体系

```
Company（公司）
  └── Application（投递/岗位）
        └── Interview（面试轮次）
```

### Company

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 "co{timestamp}" |
| name | string | 公司名称 |
| industry | string | 行业 |
| tags | string[] | 标签 |
| website? | string | 官网 |
| notes? | string | 备注 |

### Application

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 "ap{timestamp}" |
| companyId | string | 关联 Company.id |
| company | string | 冗余公司名 |
| position | string | 岗位名称 |
| department? | string | 业务线 |
| status | ApplicationStatus | 7 种状态 |
| applyDate | string | ISO 日期 |
| updatedAt | string | ISO 时间戳 |
| notes? | string | 备注 |

ApplicationStatus: `未投递 → 已投递 → 笔试中 → 已笔试 → 面试中 → 已Offer | 已拒绝`

### Interview

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 "iv{timestamp}" |
| applicationId | string | 关联 Application.id |
| round | InterviewRound | 一面/二面/三面/HR面/终面/其他 |
| interviewDate | string | ISO 日期 |
| location? | string | 面试地点 |
| link? | string | 会议链接 |
| jd | string | 岗位 JD 文本 |
| questions | Question[] | 面试问答 |
| recordings | Recording[] | 录音记录 |
| summary | string | 复盘总结 |
| aiReview? | AIReview | AI 诊断结果 |

### 独立实体

- **ScheduleEvent**: 完全独立于三层模型，存储在 `qiuzhao_schedules`（独立 localStorage key）
- **Task**: 待办事项，可关联 Application/AIAnalysis
- **AIAnalysis**: 多态关联（targetType + targetId），支持 interview_review / jd_insight / capability_profile
- **UserProfile**: 用户画像，单例（key: "default"）
- **UserMemory**: AI 长期记忆，由 memoryService 聚合生成

## 架构模式

### 数据流

```
UI Component → InterviewContext (useInterviews())
                    ↕
            dataService.ts (抽象层)
                    ↕
            localRepository.ts (localStorage)
```

- **所有页面**通过 `useInterviews()` hook 获取数据和操作方法
- **hydration** 在 `InterviewContext` 的单次 `useEffect` 中完成（7 个数据源并行加载，5 秒超时保护）
- **持久化**通过 Repository 模式，未来可切换到 Prisma（将 `dataService.getRepo()` 改为返回 `prismaRepository`）

### localStorage Key 清单

| Key | 内容 |
|-----|------|
| `qiuzhao_companies` | Company[] |
| `qiuzhao_applications` | Application[] |
| `qiuzhao_interviews` | Interview[] |
| `qiuzhao_ai_analyses` | AIAnalysis[] |
| `qiuzhao_tasks` | Task[] |
| `qiuzhao_user_profile` | UserProfile (单例) |
| `qiuzhao_user_memory` | UserMemory (单例) |
| `qiuzhao_schedules` | ScheduleEvent[] (独立系统) |

### 级联删除

- **删除 Company** → 删除关联 Application → 删除关联 Interview → 解除 Task 关联（保留 Task）
- **删除 Application** → 删除关联 Interview → 解除 Task 关联
- **删除 Interview** → 仅删除自身（AIAnalysis 保留）
- **启动时自动清理**孤儿数据（无 Company 的 Application、无 Application 的 Interview）

## 关键约定

1. **类型定义**: 所有实体类型在 `src/_shared/entityTypes.ts`，与 React 解耦（避免循环依赖）
2. **`use client`**: 除 `layout.tsx` 外几乎所有页面都是客户端组件
3. **数组安全**: 始终用 `?.` 或 `?? []` 保护数组访问（兼容旧数据）
4. **ID 生成**: 格式为 `{prefix}{timestamp}_{counter}`（`counter` 保证批量创建不重复）
5. **Async 存储**: 所有 Repository 方法返回 Promise（支持异步 Prisma 切换）
6. **错误处理**: hydration 失败不阻塞页面，`setHydrated(true)` 最终必定执行
7. **不用的**: Prisma（`lib/prisma.ts` 已注释），`prismaRepository` 是预留实现

## 环境配置

### AI 功能（DeepSeek API）

项目使用 DeepSeek API 提供 AI 面试诊断、JD 分析和能力画像功能。

**配置步骤：**

1. 在项目根目录创建 `.env.local` 文件：

```bash
echo 'DEEPSEEK_API_KEY=sk-your-key-here' > .env.local
```

2. 将 `sk-your-key-here` 替换为你的真实 API Key：
   - 获取地址：https://platform.deepseek.com/api_keys
   - 注册并充值后即可获取

3. 重启开发服务器：

```bash
npm run dev
```

**验证配置：**

启动后在面试复盘页面使用 AI 诊断功能，如果正常返回结果则配置成功。如果提示"未配置 DEEPSEEK_API_KEY"，请检查 `.env.local` 文件是否存在且 key 是否正确。

**安全提醒：**
- `.env.local` 已被 `.gitignore` 忽略，不会提交到 git
- 不要在代码中硬编码 API Key
- 如果泄露了 Key，请在 DeepSeek 后台立即重置

---

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:3000)
npm run build    # 生产构建（类型检查 + ESLint）
npm run lint     # ESLint 检查
```

Prisma 未激活，无需 `prisma generate` / `prisma migrate`。

---

## GitHub Pages 部署

### 部署方式

项目通过 GitHub Actions 自动部署到 GitHub Pages。`.github/workflows/deploy.yml` 在每次 push 到 master 时触发。

**仓库设置要求**: Settings → Pages → Source 必须选 "GitHub Actions"（非 "Deploy from a branch"）。

### 静态导出配置

`next.config.mjs` 关键配置：

```js
const nextConfig = {
  output: "export",        // 生成纯静态文件（API Routes 不会被包含）
  basePath: "/qiuzhao-dashboard",  // GitHub Pages 项目路径前缀
  images: { unoptimized: true },   // 静态导出必须禁用图片优化
};
```

### 动态路由的 generateStaticParams 陷阱 ⚠️

Next.js 14 `output: "export"` 对动态路由（`[id]`）有严格要求：

1. **必须导出 `generateStaticParams()`**，否则构建直接报错：`Page is missing "generateStaticParams()"`
2. **返回值 `length` 必须 > 0**，返回空数组 `[]` 会被判定为"未提供" —— 这是最容易踩的坑。解决：返回至少一个占位参数 `[{ id: "placeholder" }]`
3. **`"use client"` 和 `generateStaticParams` 不能在同一文件共存**。必须拆分：
   - `page.tsx`（服务端组件）：导出 `generateStaticParams`，用 `dynamic(() => import("./ClientPage"))` 加载客户端组件
   - `ClientPage.tsx`（客户端组件）：`"use client"` + 所有 UI 逻辑

**错误示例**（三种都会构建失败）：
```tsx
// 错误1: 动态路由缺少 generateStaticParams
"use client";
export default function Page() { ... }

// 错误2: 返回空数组——仍然报 missing generateStaticParams
export function generateStaticParams() { return []; }
"use client";
export default function Page() { ... }

// 错误3: use client 和 generateStaticParams 共存
"use client";
export function generateStaticParams() { return [{ id: "x" }]; }
export default function Page() { ... }
// → 报错: cannot use both "use client" and "generateStaticParams()"
```

**正确写法**：

`page.tsx`（服务端组件）：
```tsx
import dynamic from "next/dynamic";
const ClientPage = dynamic(() => import("./ClientPage"), { ssr: true });

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <ClientPage />;
}
```

`ClientPage.tsx`（客户端组件）：
```tsx
"use client";
// ... 所有原有的 UI 逻辑、hooks、imports
export default function ClientPage() { ... }
```

### SPA 路由 404 回退

GitHub Pages 不转发未知路径到 `index.html`。为解决客户端路由刷新 404 问题，deploy workflow 将 `out/index.html` 复制为 `out/404.html`，GitHub Pages 会对未知路径自动返回 404 页面内容，Next.js 客户端路由随后接管并渲染正确页面。

### Git 远程连接

在中国大陆 HTTPS 直连 GitHub 经常超时，推荐使用 SSH 方式推送。仓库已配置为 `git@github.com:zfreeya/qiuzhao-dashboard.git`。

### 局限性

- **API Routes 不可用**：6 个 `/api/ai/*` 路由在静态导出中不会包含。AI 功能（JD 分析、面试诊断等）在 GitHub Pages 上会失败。这些功能需要服务端运行环境（如 Vercel）或重构为客户端直接调用 LLM API。
- **核心功能完全正常**：面试管理、投递追踪、公司库、任务管理、个人画像等全部基于 localStorage，无需后端。
