# 秋招复盘 — Design System Master

> 版本 1.0 | 2026-07-28
>
> 面向个人秋招管理的设计系统。桌面端优先，兼容移动端。
> 核心原则：**信息效率优先，视觉为行动服务。**

---

## 1. 设计原则

| 原则 | 含义 | 检查点 |
|------|------|--------|
| 信息效率 | 用户 3 秒内找到核心信息 | 统计数据、最近日程、待办是否在首屏？ |
| 行动导向 | 每个模块有唯一的 CTA | 一个模块是否有多个互相竞争的链接？ |
| 克制装饰 | 颜色和动效服务于语义 | 这个颜色/动画是在传递信息还是纯装饰？ |
| 一致可预测 | 同类元素外观和行为一致 | 所有卡片是否用相同的边框/圆角/间距？ |
| 专业可信 | 不花哨、不活泼、不营销感 | 渐变/玻璃态/大阴影是否必要？ |

---

## 2. 色彩系统

### 2.1 主色 — Teal（品牌识别）

```
brand-50   #F0FDFA   最浅背景
brand-100  #CCFBF1   浅底色/选中态
brand-200  #99F6E4   边框/分隔
brand-300  #5EEAD4   装饰
brand-400  #2DD4BF   图标/辅助
brand-500  #14B8A6   主按钮/链接/选中
brand-600  #0D9488   主按钮 hover/主色深
brand-700  #0F766E   Hero 背景/深色底
brand-800  #115E59   深色文字标题
brand-900  #134E4A   最深文字/前景
```

用途：品牌标识、主要交互元素、页面 chrome。

### 2.2 强调色 — Warm Orange（行动号召）

```
accent-50   #FFF7ED
accent-100  #FFEDD5
accent-200  #FED7AA
accent-300  #FDBA74
accent-400  #FB923C
accent-500  #F97316   强调按钮/重要标签
accent-600  #EA580C   强调 hover
accent-700  #C2410C
accent-800  #9A3412
accent-900  #7C2D12
```

用途：高优先级标记、核心 CTA、需要用户注意的元素。**每个页面最多 1 处使用 accent。**

### 2.3 中性色 — Slate（文字、背景、边框）

```
neutral-50   #F8FAFC   页面背景
neutral-100  #F1F5F9   卡片底色/悬浮
neutral-200  #E2E8F0   边框
neutral-300  #CBD5E1   禁用边框/placeholder
neutral-400  #94A3B8   辅助文字/禁用文字
neutral-500  #64748B   次要文字
neutral-600  #475569   正文
neutral-700  #334155   标题
neutral-800  #1E293B   重标题
neutral-900  #0F172A   最深文字
```

用途：页面结构、卡片、文字层级。中性色不表达语义，只表达层级。

### 2.4 语义色

```
success (emerald)
  bg:  #ECFDF5   文字: #065F46   边框: #A7F3D0   图标: #10B981
  用途: Offer、通过、完成

warning (amber)
  bg:  #FFFBEB   文字: #92400E   边框: #FDE68A   图标: #F59E0B
  用途: 即将到期、需要注意

danger (red)
  bg:  #FEF2F2   文字: #991B1B   边框: #FECACA   图标: #EF4444
  用途: 删除、失败、紧急

info (blue)
  bg:  #EFF6FF   文字: #1E40AF   边框: #BFDBFE   图标: #3B82F6
  用途: 提示、一般信息
```

### 2.5 颜色使用规则

1. **语义色只用于传递状态信息**，不用于装饰卡片背景
2. **紧迫状态用 amber 强调条**（左边缘 3px 色条），不整卡变色
3. **卡片默认白底 + neutral-200 边框**，不设彩色背景
4. **Hero 区是唯一使用渐变背景的区域**
5. **同一页面不超过 3 套色彩语义同时出现**

---

## 3. 字体层级

### 3.1 字体族

```css
font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial,
             "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
```

### 3.2 字号与用途

| Token | 字号 | 行高 | 字重 | 用途 |
|-------|------|------|------|------|
| `text-hero` | 28-32px | 1.25 | 700 | 页面主标题（Hero greeting） |
| `text-page-title` | 22-24px | 1.3 | 600-700 | 独立页面标题 |
| `text-section-title` | 18px | 1.4 | 600 | 模块标题（卡片 header） |
| `text-card-title` | 15-16px | 1.4 | 600 | 卡片内标题（公司名等） |
| `text-body` | 14px | 1.6 | 400-500 | 正文/描述文字 |
| `text-body-sm` | 13px | 1.5 | 400 | 辅助说明 |
| `text-caption` | 12px | 1.4 | 400-500 | 标签、时间、次要元数据 |
| `text-stat` | 28-32px | 1 | 700 | 统计数据大字（tabular-nums） |

### 3.3 规则

- 正文最小 14px（桌面）/ 16px（移动端，防 iOS 缩放）
- 辅助文字最小 12px
- 不使用 10px 以下文字
- 中英文混排时保持 `Plus Jakarta Sans` 优先，中文 fallback 到系统字体
- 数字使用 `font-variant-numeric: tabular-nums` 保证对齐

---

## 4. 间距系统

### 4.1 基准

所有间距基于 **4px 网格**。

| Token | 值 | Tailwind | 用途 |
|-------|-----|----------|------|
| `space-xs` | 4px | `gap-1` / `p-1` | 图标与文字之间 |
| `space-sm` | 8px | `gap-2` / `p-2` | 紧密元素间距 |
| `space-md` | 12px | `gap-3` / `p-3` | 卡片内元素间距 |
| `space-lg` | 16px | `gap-4` / `p-4` | 列表项间距 |
| `space-xl` | 20-24px | `gap-5~6` / `p-5~6` | 模块间距、卡片内边距 |
| `space-2xl` | 32px | `gap-8` / `p-8` | 大区块间距 |
| `space-3xl` | 48px | `gap-12` | 页面级间距 |

### 4.2 页面级间距

| 区域 | 桌面 | 移动 |
|------|------|------|
| 页面水平 padding | `px-6` (24px) | `px-4` (16px) |
| 页面垂直 padding | `py-8` (32px) | `py-6` (24px) |
| 模块间距 | `mb-6` (24px) | `mb-5` (20px) |
| Navbar 高度 | `h-14` (56px) | `h-14` (56px) |

### 4.3 卡片内边距

| 卡片类型 | Padding |
|----------|---------|
| 标准卡片 | `p-5` (20px) |
| 紧凑卡片 | `p-4` (16px) |
| Hero 区 | `p-6 sm:p-8` |


---

## 5. 组件规范

### 5.1 卡片 `.card`

```css
/* globals.css — 已实现 */
.card {
  @apply rounded-2xl border border-brand-200/60 bg-white
         transition-shadow duration-200;
}
.card:hover {
  box-shadow: 0 2px 12px rgba(13, 148, 136, 0.08);
}
```

规则：
- 所有内容块使用 `.card`，不裸写 `rounded-2xl border ...`
- 可点击卡片（`<Link>` 包裹）加 `cursor-pointer`，hover 时品牌色微变
- 不可点击卡片不响应 hover（不产生"可点击"的误导）
- 紧迫状态提示：在卡片左边缘加 `border-l-[3px] border-l-amber-400`，不改变整卡底色

### 5.2 按钮

```css
/* 主按钮 — 已实现 */
.btn-primary {
  @apply inline-flex items-center gap-1.5 rounded-xl
         bg-brand-500 px-4 py-2.5 text-sm font-medium text-white
         transition-all duration-150
         hover:bg-brand-600
         active:scale-[0.97]
         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500
         disabled:cursor-not-allowed disabled:opacity-50;
}
```

层级：

| 变体 | 样式 | 用途 |
|------|------|------|
| Primary | `btn-primary` | 页面主操作（添加、保存、提交） |
| Secondary | `border brand-200 text-brand-700 hover:bg-brand-50` | 次要操作（取消、查看详情） |
| Ghost | `text-brand-600 hover:bg-brand-50` | 最低优先级的导航/操作 |
| Danger | `bg-red-500 text-white hover:bg-red-600` | 删除/不可逆操作 |
| Accent | `bg-accent-500 text-white hover:bg-accent-600` | 高优先级 CTA（每页最多 1 个） |

规则：
- 一个页面最多 1 个 Primary + 1 个 Accent
- 按钮文字不超过 4 个字
- 所有按钮必须带图标（16-18px）
- 最小触控区域 44×44px

### 5.3 状态标签

```css
.badge {
  @apply inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium;
}
```

| 状态 | 样式 |
|------|------|
| 高优/P0 | `badge bg-red-50 text-red-600 border-red-200` |
| 中优/P1 | `badge bg-amber-50 text-amber-600 border-amber-200` |
| 低优/P2 | `badge bg-neutral-100 text-neutral-500 border-neutral-200` |
| 成功/通过 | `badge bg-emerald-50 text-emerald-600 border-emerald-200` |
| AI 标签 | `badge bg-purple-50 text-purple-500 border-purple-200` |

规则：
- 标签始终包含图标 + 文字（不光靠颜色区分）
- 同一行最多 2 个标签

### 5.4 输入框 `.input-base`

```css
/* 已实现 */
.input-base {
  @apply rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm
         outline-none transition
         placeholder:text-neutral-400
         focus:border-brand-400 focus:ring-2 focus:ring-brand-100;
}
```

规则：
- 所有文本输入使用 `.input-base`
- `<select>` 使用相同视觉风格
- 必须有可见 label（不在 placeholder-only 的输入框）
- 输入框高度 ≥ 44px（移动端触控）

### 5.5 弹窗/Modal

规则：
- 遮罩层：`bg-black/30 backdrop-blur-sm`（不可点击穿透）
- 弹窗本体：`card max-w-sm mx-4 max-h-[90vh] overflow-y-auto`
- 标题：`text-lg font-semibold`
- 必须有取消/关闭按钮
- 主操作按钮使用 `btn-primary`
- 点击遮罩或按 Escape 关闭

### 5.6 空状态

```html
<div class="flex flex-col items-center justify-center py-12 text-center">
  <Icon size={32} weight="duotone" class="text-neutral-300" />
  <p class="mt-4 text-sm text-neutral-500">暂无数据</p>
  <p class="mt-1 text-xs text-neutral-400">引导文字说明如何创建</p>
  <button class="btn-primary mt-4">创建操作</button>
</div>
```

规则：
- 空状态必须有：图标 + 说明文字 + 操作按钮
- 图标用 `weight="duotone"`，颜色 `neutral-300`

### 5.7 骨架屏

规则：
- 结构匹配真实页面布局
- 闪光块使用 `bg-brand-100 animate-pulse`
- Hero 区深色背景上使用 `bg-white/20 animate-pulse`
- 不展示可能不存在的模块（条件渲染的模块不在骨架中占位）

### 5.8 日程项

规则：
- 列表模式（紧凑）：日期 + 时间 + 公司 + 类型，单行高 ~36px
- 日历模式（周视图）：仅用于独立日历页面，首页不使用
- 颜色映射：面试 → blue、笔试 → emerald、其他 → neutral

### 5.9 待办项

规则：
- 单行高 ≥ 44px（移动端触控）
- checkbox + 内容 + 优先级标签 + 删除按钮
- 已完成项：`opacity-50 line-through`
- 删除按钮仅 hover 时显示（桌面端）或始终显示（移动端）


---

## 6. 交互原则

### 6.1 主操作 vs 次操作

- **每个模块只有一个主要 CTA**，其余为文字链接或 ghost 按钮
- 主操作 = `btn-primary`，次操作 = 文字链接或 `btn-secondary`
- 如果一个模块同时有"查看详情"和"开始准备"，选择引导价值更大的那个作为主 CTA

### 6.2 编辑和删除入口

- 删除操作始终需要确认（`confirm()` 或确认弹窗）
- 删除按钮用 `danger` 样式，与主操作空间分离
- 编辑入口：列表项内点击进入详情页编辑，不在列表直接编辑

### 6.3 加载反馈

- 数据加载 < 300ms：无反馈
- 数据加载 300ms-5s：骨架屏
- 操作提交：按钮变为 loading 态（spinner + disabled）
- 页面导航：Next.js 自动 prefetch，无需额外 loading

### 6.4 成功/失败反馈

- 成功操作：无 toast，依赖状态变化本身反馈（勾选 → 划线 + 透明度变化）
- 失败操作：内联错误信息，靠近操作区域
- 重要成功（如保存配置）：可用 toast，3 秒自动消失

### 6.5 危险操作确认

- 删除类操作必须弹出 `window.confirm()` 或自定义确认弹窗
- 确认按钮文字明确说明后果（"删除"而非"确定"）
- 取消按钮用 ghost 样式

### 6.6 动画原则

- hover 过渡：150ms `transition-colors`
- 按压反馈：`active:scale-[0.97]` (仅按钮)
- 不使用装饰性动画
- 尊重 `prefers-reduced-motion`


---

## 7. 响应式规范

### 7.1 断点

| 断点 | 宽度 | 设计策略 |
|------|------|---------|
| Mobile | < 640px | 单列、紧凑、核心内容优先 |
| Tablet | 640-1024px | 两列网格、部分模块可展开 |
| Desktop | ≥ 1024px | 多列网格、信息密度提升 |

### 7.2 容器宽度

| 断点 | 容器 max-width |
|------|---------------|
| 所有 | `max-w-5xl` (1024px) |

规则：页面内容居中，导航/内容使用相同 `max-w-5xl`。

### 7.3 网格

| 区域 | 桌面 | 平板 | 移动 |
|------|------|------|------|
| 三卡统计区 | `lg:grid-cols-3` | `grid-cols-2` | `grid-cols-1` 或横向滑动 |
| 作战计划 | `sm:grid-cols-3` | `grid-cols-2` | `grid-cols-1` |

### 7.4 移动端特殊处理

- 首页 Hero 高度缩减（减少 padding、缩小问候语字号）
- 移动端不显示完整的日历周视图，改为近期日程列表
- 卡片在移动端可有条件地改为横向滚动
- 待办输入框始终在待办列表上方


---

## 8. Z-Index 层级

| 层级 | 值 | 元素 |
|------|-----|------|
| Base | 0 | 页面内容 |
| Dropdown | 10 | 下拉菜单 |
| Sticky | 20 | 吸顶导航 |
| Overlay | 30 | Modal 遮罩 |
| Modal | 50 | 弹窗内容 |

---

## 9. Icon 使用规范

- 图标库：**Phosphor (`@phosphor-icons/react`)**
- 默认 weight：`"duotone"` (模块标题图标)
- 行内图标 weight：`"regular"` 或 `"fill"`
- 图标尺寸 token：`sm=14px`、`md=18-20px`、`lg=22-24px`
- 不使用 emoji 作为界面图标
- 所有 icon-only 按钮必须有 `aria-label`

---

## 10. 技术实现

### 10.1 Tailwind 配置

已在 `tailwind.config.ts` 中定义：
- `brand` 色阶 (50-900)
- `accent` 色阶 (50-900)
- `fontFamily.sans` (Plus Jakarta Sans)

### 10.2 CSS 工具类

已在 `globals.css` 中定义：
- `.card` — 标准卡片
- `.btn-primary` — 主按钮
- `.input-base` — 标准输入框

### 10.3 使用方式

```
page.tsx → 使用 Tailwind 工具类 + globals.css 的 @layer components
         → 所有样式尽量用 Tailwind class，减少自定义 CSS
         → 语义色直接在 Tailwind 中用 hex（emerald/amber/red/blue 内建色阶）
```
