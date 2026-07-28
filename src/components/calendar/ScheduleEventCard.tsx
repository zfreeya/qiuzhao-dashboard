"use client";

import type { ScheduleEvent } from "../../services/scheduleService";
import { getEventColor, getEventColorClasses } from "../../services/scheduleService";
import { Chats, PencilSimple, PushPin } from "@phosphor-icons/react";

// ============================================================
// 日程卡片
// ============================================================

interface Props {
  event: ScheduleEvent;
  compact?: boolean;
}

function getCategoryIcon(category: string) {
  const cls = "inline align-[-2px]";
  if (category === "面试") return <Chats size={10} weight="fill" className={cls} />;
  if (category === "笔试") return <PencilSimple size={10} weight="fill" className={cls} />;
  return <PushPin size={10} weight="fill" className={cls} />;
}

export function ScheduleEventCard({ event, compact }: Props) {
  const color = getEventColor(event.category);
  const colorClasses = getEventColorClasses(color, compact);

  if (compact) {
    return (
      <div
        className={`h-full overflow-hidden rounded-lg border px-1.5 py-0.5 text-[10px] leading-tight ${colorClasses}`}
      >
        <div className="font-semibold truncate">
          {getCategoryIcon(event.category)} {event.eventType || event.company || "日程"}
        </div>
        {event.company && (
          <div className="truncate opacity-70">{event.company}{event.position ? ` · ${event.position}` : ""}</div>
        )}
        <div className="opacity-50">{event.startTime}-{event.endTime}</div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-xs ${colorClasses}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          {getCategoryIcon(event.category)} {event.eventType || event.category}
        </span>
        {event.company && (
          <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-medium">
            {event.company}
          </span>
        )}
      </div>
      {event.position && (
        <div className="mt-0.5 opacity-70">{event.position}</div>
      )}
      <div className="mt-0.5 opacity-50">
        {event.startTime} - {event.endTime}
      </div>
      {event.location && (
        <div className="mt-1 border-t border-current/10 pt-1 opacity-60">
          {event.location}
        </div>
      )}
      {event.link && (
        <div className="mt-0.5 opacity-60 truncate">
          {event.link}
        </div>
      )}
      {event.meetingInfo && (
        <div className="mt-1 border-t border-current/10 pt-1 opacity-60">
          {event.meetingInfo}
        </div>
      )}
      {event.note && (
        <div className="mt-1 border-t border-current/10 pt-1 opacity-60">
          {event.note}
        </div>
      )}
    </div>
  );
}
