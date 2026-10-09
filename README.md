# 秋招复盘系统 · Qiuzhao Dashboard

面向校招求职者的个人求职追踪与面试复盘工具，集中管理公司、岗位投递、面试记录和准备任务，并通过 AI 分析辅助发现薄弱环节、制定下一步行动。

项目以 **公司 → 岗位投递 → 面试轮次** 为主线，将求职进度、面试问答、复盘结论和能力成长连接起来，适合希望持续记录、复盘与改进求职过程的个人使用。当前 AI 诊断提示词对产品经理、AI 产品等岗位有较多针对性设计。

[GitHub 仓库](https://github.com/zfreeya/qiuzhao-dashboard)

> 当前业务数据默认保存在浏览器 localStorage 中，AI 功能通过 Next.js 服务端接口调用 DeepSeek。仓库默认配置为静态导出，使用真实 AI 前需要调整运行配置；详见下文。Prisma / SQLite 属于预留实现，尚未启用。

## 核心功能

### 求职进度管理

- **公司库**：新增、编辑、删除公司，维护行业、标签、官网与备注，按公司名、行业或标签搜索。
- **岗位投递**：在公司下管理不同岗位，记录岗位名称、业务线、投递时间、状态和备注。
- **多轮面试**：为同一投递创建多个面试轮次，记录面试时间、地点与会议链接，按投递分组查看面试。
- **求职仪表盘**：汇总投递与 Offer 等指标，展示下一场面试、诊断摘要、行动建议及待办事项。

投递状态包括：

```text
未投递 → 已投递 → 笔试中 → 已笔试 → 面试中 → 已Offer / 已拒绝
```

### 面试准备与复盘

- 保存岗位 JD，分析岗位要求、准备重点、可能关注的问题及匹配建议。
- 维护面试问题、回答和问题分类，沉淀个人复盘总结。
- 切换复盘模式与准备模式，查看岗位准备相关内容。
- 调用 AI 面试诊断，获得匹配度评分、面试官视角、优势、不足和改进建议。

### 日程与行动跟进

- 首页提供独立周视图日历，可创建和编辑日程。
- 管理待办任务、优先级与完成状态。
- 记录任务完成反馈，并通过反馈分析提取能力证据。

### 能力画像与长期记忆

- 维护目标岗位、技能、项目经历、背景和成长目标。
- 结合面试记录、AI 分析及任务情况生成能力画像，展示能力维度、趋势与成长建议。
- 从历史记录聚合优势、待提升项、反复出现的面试问题模式和学习目标，形成可查看、可刷新的长期记忆。
- 将长期记忆作为部分 AI 请求的上下文，辅助后续 JD 分析和画像生成。

### 数据管理

- 将公司、投递、面试、任务、AI 分析、个人画像和长期记忆导出为 JSON。
- 从备份文件恢复对应数据。
- 清理无关联公司的投递、无关联投递的面试等孤立数据。

> 日程使用独立存储，目前不在数据管理页面的导入、导出范围内。导入会覆盖备份中对应的数据集合，建议先备份再操作；导入后可刷新页面查看恢复结果。

## 页面与模块

以下为应用路由；默认配置下，浏览器访问路径需加上 `/qiuzhao-dashboard` 前缀。

| 路由 | 页面 | 主要用途 |
| --- | --- | --- |
| `/` | 求职仪表盘 | 进度概览、周日历、下一场面试、建议、任务与能力摘要 |
| `/companies` | 公司库 | 公司管理、搜索与关联统计 |
| `/companies/[id]` | 公司详情 | 查看公司信息及关联岗位投递 |
| `/applications/new` | 新增投递 | 创建岗位投递记录 |
| `/applications/[id]/edit` | 编辑投递 | 更新岗位信息与求职状态 |
| `/interviews` | 面试列表 | 按投递分组查看面试轮次 |
| `/interviews/new` | 新增面试 | 创建面试记录并关联投递 |
| `/interviews/[id]` | 面试详情 | JD、问答、复盘、AI 诊断与准备模式 |
| `/profile` | 能力画像 | 个人资料、能力评估、趋势和成长建议 |
| `/memory` | AI 长期记忆 | 查看与刷新历史求职信息聚合结果 |
| `/data` | 数据管理 | JSON 备份、恢复及孤立数据清理 |

## 技术栈

| 类别 | 技术与用途 |
| --- | --- |
| 应用框架 | Next.js 14.2.35，使用 App Router |
| UI 与状态 | React 18、React Context、Hooks |
| 开发语言 | TypeScript 5，开启严格模式 |
| 样式 | Tailwind CSS 3.4、PostCSS、自定义全局样式 |
| 图标与字体 | Phosphor Icons、内置 Geist / Geist Mono 字体文件 |
| AI 接入 | OpenAI SDK 6.x，调用 DeepSeek 兼容接口，模型为 `deepseek-chat` |
| 默认存储 | 浏览器 localStorage，使用带版本号的数据封装 |
| 数据层扩展 | Repository 接口；预留 Prisma 7 / SQLite Schema 与仓储代码 |
| 代码检查 | ESLint 8、eslint-config-next |
| 部署配置 | GitHub Actions、GitHub Pages 静态导出 |

## 项目结构

```text
qiuzhao-dashboard/
├── src/
│   ├── app/                         # App Router 页面与服务端接口
│   │   ├── page.tsx                 # 首页仪表盘
│   │   ├── layout.tsx               # 根布局与全局 Provider
│   │   ├── _components/Navbar.tsx   # 导航栏
│   │   ├── companies/               # 公司库与公司详情
│   │   ├── applications/            # 投递新增、编辑
│   │   ├── interviews/              # 面试列表、新增与详情
│   │   ├── profile/                 # 能力画像
│   │   ├── memory/                  # 长期记忆
│   │   ├── data/                    # 数据管理
│   │   └── api/                     # 面试诊断与其他 AI 接口
│   ├── _shared/
│   │   ├── entityTypes.ts           # 共享实体类型
│   │   ├── InterviewContext.tsx     # 状态加载与业务操作
│   │   └── storage.ts               # localStorage 读写封装
│   ├── components/
│   │   ├── AIReviewModule.tsx       # AI 面试诊断组件
│   │   └── calendar/               # 日历、日程编辑与事件卡片
│   ├── services/                    # 投递、面试、画像、记忆等业务逻辑
│   │   └── repositories/           # 仓储接口、本地实现与 Prisma 预留实现
│   ├── prompts/                     # JD、画像、成长建议、证据与反馈提示词
│   ├── server/llm-provider.ts       # 面试诊断模型调用与结果校验
│   └── lib/prisma.ts                # Prisma 客户端预留代码
├── prisma/schema.prisma             # SQLite 数据模型（未启用）
├── design-system/                   # 设计规范与首页设计说明
├── .github/workflows/deploy.yml      # GitHub Pages 部署工作流
├── AGENTS.md                        # 项目开发说明
├── next.config.mjs                  # 静态导出、路径前缀与图片配置
├── package.json
└── package-lock.json
```

## 快速启动

### 1. 准备环境

建议使用 **Node.js 20 与 npm**，与仓库 GitHub Actions 的 Node.js 版本保持一致。基础记录管理无需配置数据库，也无需执行 Prisma 初始化命令。

### 2. 获取代码并安装依赖

```bash
git clone https://github.com/zfreeya/qiuzhao-dashboard.git
cd qiuzhao-dashboard
npm ci
```

### 3. 启动开发服务器

```bash
npm run dev
```

按当前 `basePath` 配置访问：

**http://localhost:3000/qiuzhao-dashboard**

建议首次使用时，先在公司库创建公司，再新增投递和面试记录；随后填写 JD、面试问答与复盘总结，逐步积累可用于分析的数据。

### 4. 配置真实 AI 分析（可选）

在项目根目录创建 `.env.local`：

```dotenv
DEEPSEEK_API_KEY=your_deepseek_api_key
```

服务端代码使用 `https://api.deepseek.com` 和 `deepseek-chat`。密钥仅供服务端读取，仓库已忽略 `.env*.local` 文件。

**仅设置密钥还不够：当前 AI 请求使用 `/api/...` 绝对路径，而默认应用带有 `/qiuzhao-dashboard` 前缀。** 为方便本地使用完整功能，可以将 `next.config.mjs` 调整为以下服务端运行配置：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;
```

这一配置移除了静态导出与路径前缀。重启开发服务器后，访问 **http://localhost:3000**，AI 请求与页面即可使用同一根路径。若需要保留子路径部署，应同步调整客户端 API 请求地址及部署路由。

调用 AI 时，相关 JD、问答、个人资料或历史摘要会按功能需要发送给模型服务。未配置密钥或接口不可用时，部分功能会返回规则或模拟结果，具体见下文。

### 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run lint` | 执行 ESLint 检查 |
| `npm run build` | 执行 Next.js 生产构建 |
| `npm run start` | 启动服务端生产实例，需要先构建并移除 `output: "export"` |

服务端配置下，可使用：

```bash
npm run build
npm run start
```

## 架构与数据存储

主要业务数据流为：

```text
页面 / 组件
    ↓
InterviewContext（useInterviews）
    ↓
dataService（数据访问抽象）
    ↓
localRepository
    ↓
浏览器 localStorage
```

日程通过独立的 `scheduleService` 管理；AI 分析通过客户端服务调用 Next.js API，再由服务端访问 DeepSeek。

核心数据关系为：

```text
Company 公司
└── Application 岗位投递
    └── Interview 面试轮次

Task          待办与完成反馈
AIAnalysis    分析结果及关联对象
UserProfile   个人资料
UserMemory    历史信息聚合
ScheduleEvent 独立日程
```

默认存储不依赖账户或远程数据库，不会自动跨设备同步。数据随浏览器和站点来源隔离，清除站点数据会影响记录，建议定期导出 JSON。改变本地端口或域名后，也需要通过备份迁移数据。

## AI 能力与当前实现边界

| 功能 | 当前实现 |
| --- | --- |
| 面试诊断 | 已接入 DeepSeek；需要可用的服务端 API 与密钥，失败时展示错误 |
| JD 分析 | 优先请求模型接口；失败时按岗位关键词生成 Mock 分析 |
| 能力画像 | 优先请求模型接口；失败时回退到本地规则计算 |
| 成长建议、能力证据、任务反馈分析 | 已有服务端接口与调用代码，部分接口包含降级处理；真实分析依赖服务端环境 |
| 长期记忆 | 由本地服务聚合历史数据；并非模型训练或独立向量检索系统 |
| 首页行动建议、准备内容 | 部分由本地规则或模板生成，不应全部视为实时模型输出 |
| 录音模块 | 支持手动添加录音记录；文件上传、AI 转写和关键信息提取尚未实现 |
| 模拟面试 | 已有页面入口，仍处于开发中，未提供实时对话或语音模拟 |
| Prisma / SQLite | 预留 Schema 与仓储代码，当前未接入业务数据流，部分方法仍为占位实现 |

`llmService.ts` 中另有尚未实现的 `analyzeInterview()` 接口；现有面试诊断实际由 `AIReviewModule → ai-service → /api/ai-review → llm-provider` 完成。

## 部署说明

仓库包含 GitHub Pages 工作流：向 `master` 分支推送后执行依赖安装、生产构建并上传 `out/`，同时将首页复制为 `404.html`，尝试提供客户端路由回退。使用该工作流时，仓库 Pages 来源需选择 **GitHub Actions**。

当前配置需要关注以下限制：

- `output: "export"` 面向静态托管，无法提供项目中的 POST AI 接口。仓库同时保留这些接口，因此静态构建兼容性也需要实际验证或调整，不能仅凭工作流文件认定部署成功。
- 动态详情页使用 `generateStaticParams()` 生成 `placeholder` 占位路径，运行时新增的记录不会自动生成对应静态页面。详情页直接访问、刷新和 404 回退行为仍需在目标环境验证。
- 若要完整使用 AI 功能，建议采用支持 Next.js 服务端运行的部署环境，移除静态导出配置，并处理好 API 地址与路径前缀。

本说明基于代码与配置检查，未验证线上站点状态，也未执行完整生产构建或真实模型调用。

## 项目亮点

- **围绕求职过程组织数据**：以公司、投递、面试三层模型区分不同岗位与轮次，方便连续追踪。
- **从记录延伸到行动**：将复盘、诊断建议、任务与反馈放在同一工作流中，帮助把问题转化为具体准备事项。
- **积累跨面试的个人信息**：通过能力画像与长期记忆聚合多次记录，减少每次分析都从零开始整理背景。
- **本地存储，启动轻量**：基础业务无需数据库，配合 JSON 导入导出完成个人备份与迁移。
- **业务与存储分层**：实体类型、业务服务、仓储接口和提示词分开组织，为继续扩展功能提供基础。
- **部分分析具有降级路径**：在 AI 服务不可用时，JD 和能力画像仍可提供模拟或规则结果；使用时需要区分结果来源。

## 后续规划建议

以下为根据现有实现整理的改进方向，**不代表已经实现，也不代表维护者承诺的路线图**。

- [ ] 统一静态版与服务端版的运行配置，解决 API 路径前缀和动态详情路由问题。
- [ ] 明确标识真实 AI、Mock 与规则结果的来源，完善模型输出结构校验和错误提示。
- [ ] 将独立日程纳入备份与恢复，增强导入校验和数据版本迁移能力。
- [ ] 完成录音文件上传、转写与面试信息提取。
- [ ] 实现可交互的模拟面试与反馈流程。
- [ ] 完善 Prisma 仓储及服务端数据访问边界，再评估数据库持久化与跨设备同步。
- [ ] 为状态流转、级联删除、备份恢复及 AI 降级等关键流程补充测试。

---

文档依据：仓库提交 `0adb406`，检查日期为 2026 年 10 月 9 日。功能描述以该版本实际代码为准。
