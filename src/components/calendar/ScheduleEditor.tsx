"use client";

import { useState, useEffect } from "react";
import {
  addSchedule,
  updateSchedule,
  type ScheduleEvent,
  type Reminder,
  type ScheduleCategory,
} from "../../services/scheduleService";

// ============================================================
// 编辑弹窗
// ============================================================

interface Props {
  event?: ScheduleEvent; // undefined = 新建模式
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const REMINDERS: { value: Reminder; label: string }[] = [
  { value: "none", label: "不提醒" },
  { value: "10min", label: "提前10分钟" },
  { value: "30min", label: "提前30分钟" },
  { value: "1hour", label: "提前1小时" },
];

const CATEGORIES: { value: ScheduleCategory; label: string }[] = [
  { value: "面试", label: "💬 面试" },
  { value: "笔试", label: "📝 笔试" },
  { value: "其他", label: "📌 其他" },
];

export function ScheduleEditor({ event, onSave, onDelete, onClose }: Props) {
  const isEdit = !!event;

  const [category, setCategory] = useState<ScheduleCategory>(event?.category ?? "面试");
  const [eventType, setEventType] = useState(event?.eventType ?? "");
  const [company, setCompany] = useState(event?.company ?? "");
  const [position, setPosition] = useState(event?.position ?? "");
  const [date, setDate] = useState(event?.date ?? "");
  const [startTime, setStartTime] = useState(event?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(event?.endTime ?? "10:00");
  const [reminder, setReminder] = useState<Reminder>(event?.reminder ?? "30min");
  const [location, setLocation] = useState(event?.location ?? "");
  const [link, setLink] = useState(event?.link ?? "");
  const [meetingInfo, setMeetingInfo] = useState(event?.meetingInfo ?? "");
  const [note, setNote] = useState(event?.note ?? "");

  useEffect(() => {
    if (event) {
      setCategory(event.category ?? "面试");
      setEventType(event.eventType ?? "");
      setCompany(event.company ?? "");
      setPosition(event.position ?? "");
      setDate(event.date ?? "");
      setStartTime(event.startTime ?? "09:00");
      setEndTime(event.endTime ?? "10:00");
      setReminder(event.reminder ?? "30min");
      setLocation(event.location ?? "");
      setLink(event.link ?? "");
      setMeetingInfo(event.meetingInfo ?? "");
      setNote(event.note ?? "");
    }
  }, [event]);

  const canSave = date && startTime;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    const data = {
      category,
      eventType: eventType.trim(),
      company: company.trim() || undefined,
      position: position.trim() || undefined,
      date,
      startTime,
      endTime,
      reminder,
      location: location.trim() || undefined,
      link: link.trim() || undefined,
      meetingInfo: meetingInfo.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (isEdit) {
      updateSchedule(event!.id, data);
    } else {
      addSchedule(data);
    }
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800">
          {isEdit ? "编辑日程" : "新建日程"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 分类 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              分类 <span className="text-red-400">*</span>
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm
                         outline-none transition focus:border-blue-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          {/* 具体类型（自由文本） */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">具体类型</span>
            <input
              type="text"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="如：一面、二面、HR面、行测"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition placeholder:text-gray-400
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 公司（可选） */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">公司</span>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="如：字节跳动（可选）"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition placeholder:text-gray-400
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 岗位（可选） */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">岗位</span>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="如：产品经理（可选）"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition placeholder:text-gray-400
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 日期 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              日期 <span className="text-red-400">*</span>
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 时间 */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                开始 <span className="text-red-400">*</span>
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                           outline-none transition focus:border-blue-400"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">结束</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                           outline-none transition focus:border-blue-400"
              />
            </label>
          </div>

          {/* 地点 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">地点</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：XX大厦3层（可选）"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition placeholder:text-gray-400
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 会议链接 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">会议链接</span>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="腾讯会议/飞书/Teams 链接（可选）"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition placeholder:text-gray-400
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 补充信息 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">补充信息</span>
            <input
              type="text"
              value={meetingInfo}
              onChange={(e) => setMeetingInfo(e.target.value)}
              placeholder="其他需要记录的信息（可选）"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition placeholder:text-gray-400
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {/* 提醒 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">提醒</span>
            <select
              value={reminder}
              onChange={(e) => setReminder(e.target.value as Reminder)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm
                         outline-none transition focus:border-blue-400"
            >
              {REMINDERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {/* 备注 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">备注</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选"
              rows={2}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                         outline-none transition focus:border-blue-400"
            />
          </label>

          {/* 操作 */}
          <div className="flex gap-2 pt-1">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                删除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-40"
            >
              {isEdit ? "保存" : "创建"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
