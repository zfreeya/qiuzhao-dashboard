"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  useInterviews,
  getCategoryStyle,
  relativeTime,
  formatDate,
  type Question,
  type QuestionCategory,
  type Recording,
  type AIAnalysis,
  type JDInsightResult,
} from "../../../_shared/InterviewContext";
import AIReviewModule from "../../../components/AIReviewModule";
import { analyzeJD } from "../../../services/llmService";
import { buildCandidateProfile } from "../../../services/interviewService";

// ============================================================
// AI 准备中心 — 类型
// ============================================================

interface PrepJDRequirement {
  label: string;
  stars: number; // 1-5
}

interface PrepQuestion {
  question: string;
  category: string;
  aiHint: string;
}

interface PrepData {
  jdRequirements: PrepJDRequirement[];
  focusAreas: string[];
  predictedQuestions: PrepQuestion[];
}

// ============================================================
// Mock 生成器 — 根据岗位关键词差异化
// ============================================================

function generatePrepData(
  company: string,
  position: string,
): PrepData {
  const isAI = position.toLowerCase().includes("ai") || position.includes("人工智能");
  const isPM = position.includes("产品");

  // ── JD 智能拆解 ──
  const jdRequirements: PrepJDRequirement[] = isAI
    ? [
        { label: "AI/ML 技术理解", stars: 5 },
        { label: "产品设计能力", stars: 4 },
        { label: "数据分析", stars: 4 },
        { label: "项目推动能力", stars: 3 },
        { label: "行业认知", stars: 4 },
      ]
    : isPM
      ? [
          { label: "产品设计能力", stars: 5 },
          { label: "用户需求分析", stars: 5 },
          { label: "数据分析", stars: 4 },
          { label: "逻辑与表达", stars: 4 },
          { label: "商业思维", stars: 3 },
        ]
      : [
          { label: "岗位专业能力", stars: 4 },
          { label: "沟通表达", stars: 4 },
          { label: "项目经验", stars: 3 },
          { label: "学习能力", stars: 4 },
          { label: "团队协作", stars: 3 },
        ];

  const focusAreas = isAI
    ? [
        "LLM 应用理解：准备 1-2 个你对大模型能力的理解案例",
        "项目指标表达：用数据量化你的项目成果，准备 STAR 叙述",
        "用户需求分析：展示你如何从用户场景出发设计产品方案",
      ]
    : isPM
      ? [
          "用户需求分析：准备 1-2 个从用户洞察到产品方案的完整案例",
          "数据驱动决策：准备用数据支撑产品判断的真实经历",
          "竞品分析能力：了解" + company + "的核心产品和主要竞品",
        ]
      : [
          "深入理解" + company + "的业务模式和产品矩阵",
          "准备 3 个能体现岗位核心能力的项目案例",
          "梳理个人职业规划和与岗位的匹配点",
        ];

  // ── AI 预测面试问题 ──
  const predictedQuestions: PrepQuestion[] = [
    // 项目经历（3问）
    {
      question: "介绍一下你做过的最有挑战的项目",
      category: "项目经历",
      aiHint: "用 STAR 法则：情境→任务→行动→结果。重点体现你独立思考和解决问题的能力，而非团队成果。",
    },
    {
      question: "在这个项目中你最大的失败或失误是什么？",
      category: "项目经历",
      aiHint: "不要回避失败，关键是展示你如何识别问题、如何调整、学到了什么。面试官看重反思能力。",
    },
    {
      question: "如果重新做这个项目，你会怎么做？",
      category: "项目经历",
      aiHint: "展示迭代思维。从技术选型、团队协作、时间管理等多个维度复盘，体现成长性思维。",
    },
    // 产品设计（3问）
    {
      question: "设计一个你常用的 App 的某个功能",
      category: "产品设计",
      aiHint: "从用户场景出发而非功能堆砌。先定义目标用户和核心需求，再设计功能，最后考虑衡量指标。",
    },
    {
      question: "如何看待" + company + "的某款产品？如何改进？",
      category: "产品设计",
      aiHint: "提前深度体验" + company + "的产品。分析要有框架：用户价值→商业价值→技术可行性。",
    },
    {
      question: "估算一个你感兴趣的产品的 DAU/市场规模",
      category: "产品设计",
      aiHint: "用费米问题框架：拆解变量→合理假设→计算→交叉验证。展示逻辑而非追求精确数字。",
    },
    // AI技术理解（2问）
    ...(isAI
      ? [
          {
            question: "解释一下大语言模型的核心原理",
            category: "AI技术理解",
            aiHint: "不需要深入数学细节，但要理解 Transformer 架构的基本概念、训练和推理的区别、Prompt Engineering 的实践。",
          } as PrepQuestion,
          {
            question: "AI产品经理和普通产品经理有什么区别？",
            category: "AI技术理解",
            aiHint: "从数据依赖、效果评估、迭代方式、用户预期管理四个维度展开。加入你的真实体感。",
          } as PrepQuestion,
        ]
      : [
          {
            question: "你对AI在" + (isPM ? "产品设计" : "这个行业") + "中的应用有什么看法？",
            category: "AI技术理解",
            aiHint: "展示你对行业趋势的关注。可以准备 1-2 个 AI 赋能的具体场景，体现前瞻性思考。",
          } as PrepQuestion,
          {
            question: "如果给你一个AI工具，你会怎么用它提升工作效率？",
            category: "AI技术理解",
            aiHint: "展示你的工具使用习惯和学习能力。举一个实际使用过的例子比空谈更好。",
          } as PrepQuestion,
        ]),
    // 业务分析（2问）
    {
      question: "如果" + company + "要进入一个新赛道，你会建议做什么？",
      category: "业务分析",
      aiHint: "从市场规模、竞争格局、公司优势三个维度分析。结论不如分析过程重要。",
    },
    {
      question: "你怎么看这个行业未来3年的趋势？",
      category: "业务分析",
      aiHint: "提前阅读 2-3 篇行业报告，形成自己的判断。答案要有观点而非罗列事实。",
    },
  ];

  return { jdRequirements, focusAreas, predictedQuestions };
}

// ============================================================
// 面试详情页（5 大模块 + AI 诊断）
// ============================================================

export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  const { getInterview, updateInterview, hydrated, addAIAnalysis, aiAnalyses, interviews, userMemory } = useInterviews();
  const interview = getInterview(id);
  const [prepMode, setPrepMode] = useState(false);

  const prepData = useMemo(
    () =>
      interview
        ? generatePrepData(interview.company, interview.position)
        : ({ jdRequirements: [], focusAreas: [], predictedQuestions: [] } as PrepData),
    [interview],
  );

  const jdAnalysis = useMemo(() => {
    if (!interview) return undefined;
    return aiAnalyses
      .filter(
        (a) =>
          a.type === "jd_insight" &&
          a.targetType === "application" &&
          a.targetId === interview.applicationId,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
  }, [aiAnalyses, interview]);

  if (!hydrated) return <Spinner />;

  if (!interview) {
    notFound();
  }

  // 为方便模块内部使用
  const update = (updates: Partial<typeof interview>) =>
    updateInterview(id, updates);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ═══════════════════════════ 顶部：返回 + 标题 ═══════════════════════════ */}
      <Link
        href="/interviews"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">
            {interview.company}
          </h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {interview.position}
          {interview.interviewDate && (
            <>
              <span className="mx-2 text-gray-300">·</span>
              {formatDate(interview.interviewDate)}
            </>
          )}
          <span className="mx-2 text-gray-300">·</span>
          更新于 {relativeTime(interview.updatedAt)}
        </p>
      </div>

      {/* 模式切换 */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPrepMode(false)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            !prepMode
              ? "bg-blue-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          📝 复盘模式
        </button>
        <button
          onClick={() => setPrepMode(true)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            prepMode
              ? "bg-indigo-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          🤖 AI 开始准备
        </button>
      </div>

      {!prepMode && (
        <>
          {/* ═══════════════════════════════════════════
              模块 1：JD 模块
              ═══════════════════════════════════════════ */}
          <JDAnalysisResult analysis={jdAnalysis} />
          <JDModule
            jd={interview.jd}
            onSave={(jd) => update({ jd })}
            onAnalyze={async () => {
              if (!interview.jd.trim()) return;
              const profile = buildCandidateProfile(interview, interviews);
              const result = await analyzeJD({
                company: interview.company,
                position: interview.position,
                jdText: interview.jd,
                candidateProfile: profile,
                userMemory: userMemory
                  ? {
                      strengths: userMemory.strengths,
                      weaknesses: userMemory.weaknesses,
                      interviewPatterns: userMemory.interviewPatterns,
                      learningGoals: userMemory.learningGoals,
                      aiSummary: userMemory.aiSummary,
                    }
                  : undefined,
              } as Parameters<typeof analyzeJD>[0]);
              addAIAnalysis({
                type: "jd_insight",
                targetType: "application",
                targetId: interview.applicationId,
                result,
                input: { summary: `${interview.company} ${interview.position} JD`, jdText: interview.jd },
                promptVersion: "v1",
                modelVersion: "mock",
              });
            }}
          />

      {/* ═══════════════════════════════════════════
          模块 2：面试问题模块
          ═══════════════════════════════════════════ */}
      <QuestionModule
        questions={interview.questions}
        onAdd={(q) =>
          update({ questions: [...interview.questions, q] })
        }
        onUpdate={(qId, updates) =>
          update({
            questions: interview.questions.map((q) =>
              q.id === qId ? { ...q, ...updates } : q,
            ),
          })
        }
        onDelete={(qId) =>
          update({
            questions: interview.questions.filter((q) => q.id !== qId),
          })
        }
      />

      {/* ═══════════════════════════════════════════
          模块 3：面试录音模块（纯 UI）
          ═══════════════════════════════════════════ */}
      <RecordingModule
        recordings={interview.recordings}
        onAdd={(name) => {
          const r: Recording = {
            id: "r" + Date.now(),
            name,
            createdAt: new Date().toISOString(),
          };
          update({ recordings: [...interview.recordings, r] });
        }}
        onDelete={(rId) =>
          update({
            recordings: interview.recordings.filter((r) => r.id !== rId),
          })
        }
      />

      {/* ═══════════════════════════════════════════
          模块 4：改进总结模块
          ═══════════════════════════════════════════ */}
      <SummaryModule
        summary={interview.summary}
        onSave={(summary) => update({ summary })}
      />

      {/* ═══════════════════════════════════════════
          模块 5：AI 面试诊断（新增）
          ═══════════════════════════════════════════ */}
          <AIReviewModule
            aiReview={interview.aiReview}
            position={interview.position}
            jd={interview.jd}
            questions={interview.questions}
            userSummary={interview.summary}
            onGenerate={(review) => update({ aiReview: review })}
          />
        </>
      )}

      {prepMode && (
        <>
          <JDInsightModule data={prepData} />
          <PredictedQuestionsModule questions={prepData.predictedQuestions} />
          <MockInterviewModule />
        </>
      )}
    </div>
  );
}

// ============================================================
// 子模块 1：JD 编辑
// ============================================================

function JDModule({ jd, onSave, onAnalyze }: { jd: string; onSave: (v: string) => void; onAnalyze?: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [value, setValue] = useState(jd);

  function handleSave() {
    onSave(value);
    setEditing(false);
  }

  function handleCancel() {
    setValue(jd);
    setEditing(false);
  }

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">📋 JD 模块</h2>
        {!editing ? (
          <div className="flex items-center gap-2">
            {onAnalyze && (
              <button
                onClick={async () => {
                  setAnalyzing(true);
                  try { await onAnalyze(); } finally { setAnalyzing(false); }
                }}
                disabled={analyzing || !jd.trim()}
                className="rounded-lg px-3 py-1 text-xs font-medium text-purple-500
                           transition hover:bg-purple-50 disabled:opacity-40"
              >
                {analyzing ? "分析中..." : "🤖 AI 分析"}
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg px-3 py-1 text-xs font-medium text-gray-500
                         transition hover:bg-gray-100"
            >
              编辑
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="rounded-lg px-3 py-1 text-xs font-medium text-gray-500
                         transition hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-medium
                         text-white transition hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="粘贴岗位JD…"
          rows={8}
          className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3
                     text-sm leading-relaxed outline-none transition
                     focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      ) : jd ? (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
          {jd}
        </pre>
      ) : (
        <p className="py-4 text-center text-sm text-gray-400">
          还没有JD，点击「编辑」添加
        </p>
      )}
    </section>
  );
}

// ============================================================
// 子模块 2：面试问题
// ============================================================

const CATEGORIES: QuestionCategory[] = ["技术", "行为", "综合"];

function QuestionModule({
  questions,
  onAdd,
  onUpdate,
  onDelete,
}: {
  questions: Question[];
  onAdd: (q: Question) => void;
  onUpdate: (id: string, u: Partial<Question>) => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<QuestionCategory | "全部">("全部");
  const [showForm, setShowForm] = useState(false);

  // 新增表单
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [newCat, setNewCat] = useState<QuestionCategory>("综合");

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [editCat, setEditCat] = useState<QuestionCategory>("综合");

  const filtered =
    filter === "全部"
      ? questions
      : questions.filter((q) => q.category === filter);

  // ── 回答完成度 ──
  const answeredCount = questions.filter((q) => q.answer.trim()).length;
  const totalCount = questions.length;
  const answerPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // ── 新增 ──
  function handleAdd() {
    if (!newQ.trim()) return;
    onAdd({
      id: "q" + Date.now(),
      question: newQ.trim(),
      answer: newA.trim(),
      category: newCat,
    });
    setNewQ("");
    setNewA("");
    setNewCat("综合");
    setShowForm(false);
  }

  // ── 编辑 ──
  function startEdit(q: Question) {
    setEditingId(q.id);
    setEditQ(q.question);
    setEditA(q.answer);
    setEditCat(q.category);
  }

  function saveEdit() {
    if (!editingId) return;
    onUpdate(editingId, {
      question: editQ.trim(),
      answer: editA.trim(),
      category: editCat,
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* ── 标题 + 完成度 ── */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">💬 面试问题</h2>
        {totalCount > 0 && (
          <span className="text-xs text-gray-500">
            回答完成度：{answeredCount}/{totalCount}
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <p className="mb-3 text-xs text-gray-400">
          已有回答越完整，AI 诊断越准确
        </p>
      )}

      {totalCount > 0 && answerPct === 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-600">
          💡 建议补充回答，AI 诊断效果会更准确
        </div>
      )}

      {/* 分类筛选 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterTag active={filter === "全部"} onClick={() => setFilter("全部")}>
          全部
        </FilterTag>
        {CATEGORIES.map((cat) => (
          <FilterTag
            key={cat}
            active={filter === cat}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </FilterTag>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {questions.length} 个问题
        </span>
      </div>

      {/* 问题列表 */}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          {filter === "全部" ? "还没有记录问题" : `没有「${filter}」类问题`}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((q) =>
            editingId === q.id ? (
              /* ── 编辑态 ── */
              <li
                key={q.id}
                className="rounded-xl border border-blue-200 bg-blue-50/30 p-4"
              >
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      面试问题
                    </label>
                    <input
                      value={editQ}
                      onChange={(e) => setEditQ(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                                 outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      我的回答
                    </label>
                    <textarea
                      value={editA}
                      onChange={(e) => setEditA(e.target.value)}
                      placeholder="写下你的回答…"
                      rows={4}
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2
                                 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <select
                      value={editCat}
                      onChange={(e) =>
                        setEditCat(e.target.value as QuestionCategory)
                      }
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        取消
                      </button>
                      <button
                        onClick={saveEdit}
                        className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ) : (
              /* ── 展示态 ── */
              <li
                key={q.id}
                className="group rounded-xl border border-gray-100 p-4 transition hover:border-gray-200"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getCategoryStyle(q.category)}`}
                  >
                    {q.category}
                  </span>
                  <div className="ml-auto flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(q)}
                      className="rounded p-1 text-xs text-gray-400 hover:text-gray-600"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(q.id)}
                      className="rounded p-1 text-xs text-gray-400 hover:text-red-500"
                      title="删除"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {q.question}
                </p>
                {q.answer ? (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {q.answer}
                  </p>
                ) : (
                  <p className="mt-2 text-sm italic text-gray-400">
                    尚未填写回答
                  </p>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      {/* 添加问题表单 */}
      {showForm ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                面试问题 <span className="text-red-400">*</span>
              </label>
              <input
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                placeholder="记录面试官的问题…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                我的回答 <span className="text-gray-400">（选填）</span>
              </label>
              <textarea
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
                placeholder="你的回答，可以稍后再补充…"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2
                           text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <select
                value={newCat}
                onChange={(e) =>
                  setNewCat(e.target.value as QuestionCategory)
                }
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newQ.trim()}
                  className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white
                             hover:bg-blue-600 disabled:opacity-40"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm
                     font-medium text-blue-500 transition hover:bg-blue-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          添加问题
        </button>
      )}
    </section>
  );
}

// ============================================================
// 子模块 3：面试录音（纯 UI）
// ============================================================

function RecordingModule({
  recordings,
  onAdd,
  onDelete,
}: {
  recordings: Recording[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  function handleAdd() {
    const name = input.trim();
    if (!name) return;
    onAdd(name);
    setInput("");
    setShowInput(false);
  }

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">🎙 面试录音</h2>

      {/* 上传区域（UI 展示，非功能） */}
      <div
        className="flex cursor-not-allowed flex-col items-center rounded-xl
                   border-2 border-dashed border-gray-200 bg-gray-50/50 py-8
                   text-center opacity-60"
      >
        <svg
          className="mb-2 h-8 w-8 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16v-4m0-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          />
        </svg>
        <p className="text-sm text-gray-400">上传功能开发中</p>
        <p className="mt-1 text-xs text-gray-300">
          后续支持录音文件上传、AI 转写、关键信息提取
        </p>
      </div>

      {/* 手动添加录音记录 */}
      <div className="mt-4">
        {recordings.length > 0 && (
          <ul className="mb-3 space-y-2">
            {recordings.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100
                           px-4 py-2.5"
              >
                {/* 播放按钮（非功能） */}
                <button
                  disabled
                  className="flex h-8 w-8 shrink-0 items-center justify-center
                             rounded-full bg-gray-100 text-gray-400"
                  title="播放功能开发中"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {r.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(r.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}

        {showInput ? (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="录音名称，如：一面全程录音"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm
                         outline-none focus:border-blue-400"
              autoFocus
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="rounded-lg bg-blue-500 px-3 py-2 text-xs text-white
                         hover:bg-blue-600 disabled:opacity-40"
            >
              添加
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-gray-100"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm
                       font-medium text-blue-500 transition hover:bg-blue-50"
          >
            + 添加录音记录
          </button>
        )}
      </div>
    </section>
  );
}

// ============================================================
// 子模块 4：改进总结
// ============================================================

function SummaryModule({
  summary,
  onSave,
}: {
  summary: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(summary);

  function handleSave() {
    onSave(value);
    setEditing(false);
  }

  function handleCancel() {
    setValue(summary);
    setEditing(false);
  }

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">📝 改进总结</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg px-3 py-1 text-xs font-medium text-gray-500
                       transition hover:bg-gray-100"
          >
            编辑
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="rounded-lg px-3 py-1 text-xs font-medium text-gray-500
                         transition hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-medium
                         text-white transition hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`本次表现：\n（你的表现如何？哪些地方做得好？）\n\n不足：\n（面试中有哪些遗憾？）\n\n下一次改进：\n（下次面试前准备什么？）`}
          rows={10}
          className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3
                     text-sm leading-relaxed outline-none transition
                     focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      ) : summary ? (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
          {summary}
        </pre>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          还没有总结，点击「编辑」开始复盘
        </p>
      )}
    </section>
  );
}

// ============================================================
// 分类筛选标签（复用组件）
// ============================================================

function FilterTag({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-blue-500 text-white"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================
// JD 分析结果展示
// ============================================================

function JDAnalysisResult({ analysis }: { analysis?: AIAnalysis }) {
  if (!analysis) {
    return (
      <section className="mb-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/20 p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">AI 岗位分析</h3>
            <p className="text-xs text-gray-400">
              点击 JD 模块的「AI 分析」按钮，让 AI 帮你拆解岗位要求
            </p>
          </div>
        </div>
      </section>
    );
  }

  const r = analysis.result as JDInsightResult;

  return (
    <section className="mb-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-indigo-50/40 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          🤖 AI 岗位分析
        </h3>
        <span className="text-xs text-gray-400">
          {new Date(analysis.createdAt).toLocaleDateString("zh-CN")}
        </span>
      </div>

      {/* 能力星级 */}
      {r.requirements && r.requirements.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium text-gray-500">岗位核心要求</h4>
          <div className="space-y-1.5">
            {r.requirements.map((req) => (
              <div key={req.label} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-xs text-gray-600">{req.label}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < req.stars ? "text-amber-400" : "text-gray-200"}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 高频面试方向 */}
      {r.interviewFocus && r.interviewFocus.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium text-gray-500">🎯 高频面试方向</h4>
          <ul className="space-y-1">
            {r.interviewFocus.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-600">
                <span className="shrink-0 text-purple-400">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 重点准备方向 */}
      {r.focusAreas && r.focusAreas.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium text-gray-500">📋 重点准备方向</h4>
          <ul className="space-y-1">
            {r.focusAreas.map((area, i) => (
              <li key={i} className="flex gap-2 rounded bg-white/60 px-2 py-1.5 text-xs text-gray-600">
                <span className="shrink-0 font-medium text-indigo-400">{i + 1}.</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 候选人匹配 */}
      {r.candidateMatch && (
        <div className="mb-4 rounded-xl bg-white/60 p-4">
          <h4 className="mb-3 text-xs font-semibold text-gray-700">🎯 你的匹配情况</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <h5 className="mb-1.5 text-xs font-medium text-emerald-600">✅ 我的优势</h5>
              <ul className="space-y-1">
                {(r.candidateMatch.strengths ?? []).map((s, i) => (
                  <li key={i} className="text-xs text-gray-600">· {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="mb-1.5 text-xs font-medium text-amber-600">⚠️ 当前短板</h5>
              <ul className="space-y-1">
                {(r.candidateMatch.gaps ?? []).map((g, i) => (
                  <li key={i} className="text-xs text-gray-600">· {g}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="mb-1.5 text-xs font-medium text-indigo-600">💡 建议准备方向</h5>
              <ul className="space-y-1">
                {(r.candidateMatch.suggestions ?? []).map((s, i) => (
                  <li key={i} className="text-xs text-gray-600">· {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 匹配建议 */}
      {r.matchAdvice && (
        <div className="rounded-lg bg-white/60 p-3">
          <h4 className="mb-1 text-xs font-medium text-gray-500">💡 AI 匹配建议</h4>
          <p className="text-xs leading-relaxed text-gray-600">{r.matchAdvice}</p>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        ⚡ 由 AI 生成 · {analysis.modelVersion}
      </p>
    </section>
  );
}

/** hydration 完成前的占位 */
function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

// ============================================================
// 准备模式 — 模块 1：JD 智能拆解
// ============================================================

function JDInsightModule({ data }: { data: PrepData }) {
  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-800">
        📋 JD 智能拆解
      </h2>

      {/* 岗位核心要求 */}
      <div className="mb-5">
        <h3 className="mb-3 text-sm font-medium text-gray-600">岗位核心要求</h3>
        <div className="space-y-2.5">
          {data.jdRequirements.map((req) => (
            <div key={req.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-gray-600">
                {req.label}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < req.stars ? "text-amber-400" : "text-gray-200"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 重点准备方向 */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-600">重点准备方向</h3>
        <ol className="space-y-2">
          {data.focusAreas.map((area, i) => (
            <li key={i} className="flex gap-2 rounded-lg bg-blue-50/60 px-3 py-2.5">
              <span className="shrink-0 text-sm font-bold text-blue-400">
                {i + 1}.
              </span>
              <span className="text-sm text-gray-700">{area}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        ⚡ 由 AI 根据岗位 JD 自动生成，实际面试可能有所不同
      </p>
    </section>
  );
}

// ============================================================
// 准备模式 — 模块 2：AI 预测面试问题
// ============================================================

const PREDICT_CATEGORIES = ["项目经历", "产品设计", "AI技术理解", "业务分析"] as const;

function PredictedQuestionsModule({
  questions,
}: {
  questions: PrepQuestion[];
}) {
  const [activeCat, setActiveCat] = useState<string>("全部");

  const filtered =
    activeCat === "全部"
      ? questions
      : questions.filter((q) => q.category === activeCat);

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          🔮 AI 预测面试问题
        </h2>
        <span className="text-xs text-gray-400">{questions.length} 个问题</span>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        基于 {questions.length} 个高概率问题，分类突破，提前准备回答思路
      </p>

      {/* 分类筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat("全部")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            activeCat === "全部"
              ? "bg-indigo-500 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          全部
        </button>
        {PREDICT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeCat === cat
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 问题列表 */}
      <ul className="space-y-3">
        {filtered.map((q, i) => (
          <li
            key={i}
            className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition hover:border-indigo-200"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-600">
                {q.category}
              </span>
              <span className="text-xs text-gray-400">#{i + 1}</span>
            </div>
            <p className="mb-2 text-sm font-semibold text-gray-800">
              {q.question}
            </p>
            <div className="rounded-lg bg-amber-50/70 px-3 py-2">
              <p className="text-xs leading-relaxed text-amber-700">
                <span className="font-medium">💡 AI 提示：</span>
                {q.aiHint}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-gray-400">
        ⚡ 问题由 AI 预测生成，实际面试问题可能不同。建议把这些问题作为练习框架，而非死记硬背答案。
      </p>
    </section>
  );
}

// ============================================================
// 准备模式 — 模块 3：模拟面试入口
// ============================================================

function MockInterviewModule() {
  const [showTip, setShowTip] = useState(false);

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
        🎤 模拟面试
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        基于真实 JD 和岗位要求，由 AI 扮演面试官进行模拟面试。
        练习完预测问题后，来这里检验准备效果。
      </p>

      {/* 模拟面试卡 */}
      <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 text-center">
        <div className="mb-3 text-4xl">🎯</div>
        <h3 className="mb-1 text-base font-semibold text-gray-800">
          准备就绪？开始模拟吧
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          AI 将根据你的回答实时追问，模拟真实面试氛围
        </p>

        {showTip ? (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-600">
            🚧 模拟面试功能开发中，敬请期待。届时将支持语音输入和 AI 实时反馈。
          </div>
        ) : null}

        <button
          onClick={() => setShowTip(!showTip)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm
                     font-medium text-white shadow-sm transition hover:bg-indigo-600 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          开始模拟面试
        </button>
      </div>
    </section>
  );
}
