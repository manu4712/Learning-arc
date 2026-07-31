"use client";

import React from "react";
import { formatFocusHours } from "@/lib/planning";

type DailySummaryProps = {
  summary: {
    totalTasks: number;
    completedTasks: number;
    totalFocusMins: number;
    sessionsCount: number;
    waterCount: number;
    waterGoal: number;
  };
};

export default function DailySummary({ summary }: DailySummaryProps) {
  return (
    <div className="daily-summary-row">
      <div className="summary-pill">
        <strong>{summary.completedTasks} / {summary.totalTasks}</strong>
        <span>tasks completed</span>
      </div>

      <div className="summary-pill">
        <strong>{formatFocusHours(summary.totalFocusMins)}</strong>
        <span>evidence-backed focus</span>
      </div>

      <div className="summary-pill">
        <strong>{summary.sessionsCount}</strong>
        <span>learning sessions</span>
      </div>

      <div className="summary-pill">
        <strong>{summary.waterCount} / {summary.waterGoal}</strong>
        <span>water glasses</span>
      </div>
    </div>
  );
}
