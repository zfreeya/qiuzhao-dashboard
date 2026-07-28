"use client";

import { useState, useMemo } from "react";
import type { ScheduleEvent } from "../../services/scheduleService";
import { deleteSchedule } from "../../services/scheduleService";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { ScheduleEditor } from "./ScheduleEditor";
import { CalendarCheck, CalendarBlank, Plus } from "@phosphor-icons/react";

// ============================================================
// 周视图日历
// ============================================================

interface Props {
  schedules: ScheduleEvent[];
  onRefresh: () => void;
}

export function ScheduleCalendar({ schedules, onRefresh }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | undefined>(undefined);
  const [weekOffset, setWeekOffset] = useState(0);

  // ── 当前周范围 ──
  const weekDays = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const fmt = (d: Date) =>
      `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    return `${fmt(weekDays[0])} - ${fmt(weekDays[6])}`;
  }, [weekDays]);

  // ── 按日期分组 ──
  const grouped = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const s of schedules) {
      const key = s.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [schedules]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // ── 时间轴（8:00 - 21:00）──
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  function openCreate() {
    setEditingEvent(undefined);
    setEditorOpen(true);
  }

  function openEdit(ev: ScheduleEvent) {
    setEditingEvent(ev);
    setEditorOpen(true);
  }

  function handleDelete(id: string) {
    if (confirm("确定删除这条日程？")) {
      deleteSchedule(id);
      onRefresh();
    }
  }

  function handleSaved() {
    setEditorOpen(false);
    setEditingEvent(undefined);
    onRefresh();
  }

  return (
    <>
      {/* 标题栏 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-800">
          <CalendarCheck size={22} weight="duotone" className="text-brand-500" />
          面试日程
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-lg p-1.5 text-brand-400 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-brand-600">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-lg p-1.5 text-brand-400 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-50"
          >
            今天
          </button>
          <button
            onClick={openCreate}
            className="btn-primary ml-2 px-3 py-1.5 text-xs"
          >
            <Plus size={14} weight="bold" />
            新建日程
          </button>
        </div>
      </div>

      {/* 星期头 */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => {
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const isToday = ds === todayStr;
          return (
            <div
              key={i}
              className={`rounded-lg py-1.5 text-center text-xs font-medium transition-colors ${
                isToday ? "bg-brand-500 text-white" : "text-brand-500"
              }`}
            >
              <div className="text-xs opacity-70">
                {["一","二","三","四","五","六","日"][i]}
              </div>
              <div>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* 时间轴 + 事件网格（移动端可横向滚动） */}
      <div className="min-w-0 overflow-x-auto -mx-2 px-2">
        <div className="relative min-w-[560px]">
          {/* 时间轴 */}
          {hours.map((h) => (
            <div
              key={h}
              className="flex border-t border-brand-100"
              style={{ height: 48 }}
            >
              <div className="w-10 shrink-0 pt-0 text-center text-xs text-brand-400">
                {String(h).padStart(2, "0")}:00
              </div>
              <div className="flex-1" />
            </div>
          ))}

          {/* 事件覆盖层 */}
          <div className="absolute inset-0 ml-10 grid grid-cols-7 gap-1">
            {weekDays.map((d, colIdx) => {
              const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const events = grouped.get(ds) ?? [];

              return (
                <div key={colIdx} className="relative">
                  {events.map((ev) => {
                    const startH = parseInt(ev.startTime.split(":")[0], 10);
                    const startM = parseInt(ev.startTime.split(":")[1] ?? "0", 10);
                    const endH = parseInt(ev.endTime.split(":")[0], 10);
                    const endM = parseInt(ev.endTime.split(":")[1] ?? "0", 10);
                    const top = (startH - 8) * 48 + (startM / 60) * 48;
                    const height = Math.max(
                      24,
                      (endH - startH) * 48 + ((endM - startM) / 60) * 48,
                    );

                    return (
                      <div
                        key={ev.id}
                        className="absolute left-0.5 right-0.5 cursor-pointer"
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={() => openEdit(ev)}
                      >
                        <ScheduleEventCard event={ev} compact />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* 空状态 */}
          {schedules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarBlank size={32} weight="duotone" className="text-brand-300" />
              <p className="mt-3 text-sm font-medium text-brand-500">暂无日程</p>
              <p className="mt-1 text-xs text-brand-400">
                点击「新建日程」添加面试或笔试安排
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editorOpen && (
        <ScheduleEditor
          event={editingEvent}
          onSave={handleSaved}
          onDelete={
            editingEvent
              ? () => handleDelete(editingEvent.id)
              : undefined
          }
          onClose={() => {
            setEditorOpen(false);
            setEditingEvent(undefined);
          }}
        />
      )}
    </>
  );
}
