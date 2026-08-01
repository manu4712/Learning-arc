"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import {
  Session,
  Store,
  getYearCalendarDays,
  getYearStats,
  localDay,
  minutes,
  CalendarDayInfo,
} from "@/lib/data";
import {
  getHistoricalTasksForDay,
  getPlanForDay,
  getTaskEvidence,
} from "@/lib/planning";
import { formatPastTenseMode } from "@/lib/skills";

type YearlyContributionCalendarProps = {
  store?: Store;
  sessions: Session[];
  selectedYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  title?: string;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type FormattedCalendarDay = {
  dayInfo: CalendarDayInfo;
  formattedDate: string;
};

function YearlyContributionCalendarInner({
  store,
  sessions,
  selectedYear,
  availableYears,
  onSelectYear,
  selectedDay,
  onSelectDay,
  title = "LEARNING HISTORY",
}: YearlyContributionCalendarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedDayEvidenceRef = useRef<HTMLDivElement | null>(null);

  const stats = useMemo(() => getYearStats(sessions, selectedYear), [sessions, selectedYear]);
  const daysInYear = useMemo(() => getYearCalendarDays(selectedYear), [selectedYear]);

  const historicalTasks = useMemo(
    () => (selectedDay ? getHistoricalTasksForDay(store?.tasks, selectedDay) : []),
    [store?.tasks, selectedDay]
  );
  const planForDay = useMemo(
    () => (selectedDay ? getPlanForDay(store?.dailyPlans, selectedDay) : null),
    [store?.dailyPlans, selectedDay]
  );

  // Group days by exact calendar months with pre-formatted date strings
  const monthBlocks = useMemo(() => {
    return MONTH_NAMES.map((monthName, mIdx) => {
      const daysInMonth = daysInYear.filter((d) => d.monthIndex === mIdx);
      const firstDayOfWeek = daysInMonth[0] ? daysInMonth[0].dayOfWeek : 0;

      const weeks: (FormattedCalendarDay | null)[][] = [];
      let currentWeek: (FormattedCalendarDay | null)[] = Array(firstDayOfWeek).fill(null);

      daysInMonth.forEach((dayInfo) => {
        const formattedDate = dayInfo.dateObj.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        currentWeek.push({ dayInfo, formattedDate });
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }

      return {
        monthIndex: mIdx,
        monthName,
        weeks,
      };
    });
  }, [daysInYear]);

  // Handle day click & smooth scroll on mobile
  const handleDayClick = useCallback((dateStr: string) => {
    onSelectDay(dateStr);
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setTimeout(() => {
        selectedDayEvidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  }, [onSelectDay]);

  // Mobile initial scroll to current month block if viewing current year
  useEffect(() => {
    const isCurrentYear = selectedYear === new Date().getFullYear();
    if (isCurrentYear && containerRef.current && typeof window !== "undefined" && window.innerWidth <= 768) {
      const currentMonth = new Date().getMonth();
      const monthEl = containerRef.current.querySelector<HTMLElement>(`[data-month="${currentMonth}"]`);
      if (monthEl) {
        const offsetLeft = monthEl.offsetLeft;
        containerRef.current.scrollTo({ left: Math.max(0, offsetLeft - 16), behavior: "smooth" });
      }
    }
  }, [selectedYear]);

  // Selected day's session list
  const selectedDaySessions = useMemo(
    () => (selectedDay ? sessions.filter((s) => s.completedAt && localDay(s.completedAt) === selectedDay) : []),
    [sessions, selectedDay]
  );

  return (
    <div className="yearly-calendar-container">
      {/* Panel Header & Year Selector */}
      <div className="panel-header-with-action">
        <div>
          <span className="eyebrow">{title}</span>
          <h2 className="year-title">{selectedYear} Learning Calendar</h2>
        </div>

        {availableYears.length > 1 && (
          <div className="year-selector-wrapper">
            <label htmlFor="year-select" className="sr-only">
              Select Learning Year
            </label>
            <select
              id="year-select"
              className="year-select-dropdown"
              value={selectedYear}
              onChange={(e) => onSelectYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y} {y === new Date().getFullYear() ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Year Factual Summary Cards */}
      <div className="year-stats-summary-row">
        <div className="year-stat-pill">
          <strong>{stats.activeDaysCount}</strong>
          <span>learning days</span>
        </div>
        <div className="year-stat-pill">
          <strong>{minutes(stats.totalMinutes)}</strong>
          <span>total focus</span>
        </div>
        <div className="year-stat-pill">
          <strong>{stats.totalSessionsCount}</strong>
          <span>sessions completed</span>
        </div>
        <div className="year-stat-pill">
          <strong>{stats.maxStreakInYear} days</strong>
          <span>best streak in {selectedYear}</span>
        </div>
      </div>

      {/* Yearly Calendar Viewport (12 Distinct Month Groups) */}
      <div className="yearly-calendar-wrapper" ref={containerRef}>
        <div className="yearly-calendar-card">
          <div className="months-flex-row">
            {monthBlocks.map((mb) => (
              <div
                key={mb.monthIndex}
                className="month-group-block"
                data-month={mb.monthIndex}
              >
                {/* Month Group Header */}
                <div className="month-group-header">
                  <span className="month-group-title">{mb.monthName.toUpperCase()}</span>
                </div>

                {/* Compact Mini-Matrix for this Month */}
                <div className="month-weeks-grid">
                  {mb.weeks.map((week, colIdx) => (
                    <div key={colIdx} className="week-column">
                      {week.map((item, rowIdx) => {
                        if (!item) {
                          return <span key={rowIdx} className="calendar-cell empty-slot" />;
                        }

                        const { dayInfo, formattedDate } = item;
                        const mins = stats.dailyTotals[dayInfo.dateStr] || 0;
                        const level =
                          mins === 0
                            ? 0
                            : mins <= 45
                            ? 1
                            : mins <= 90
                            ? 2
                            : mins <= 150
                            ? 3
                            : 4;

                        const isSelected = selectedDay === dayInfo.dateStr;

                        const labelText =
                          mins > 0
                            ? `${formattedDate} — ${minutes(mins)} focused`
                            : `${formattedDate} — no learning activity`;

                        return (
                          <button
                            key={dayInfo.dateStr}
                            type="button"
                            className={`calendar-cell day-cell level-${level} ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() => handleDayClick(dayInfo.dateStr)}
                            aria-label={labelText}
                            title={labelText}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monochrome Legend */}
      <div className="calendar-legend monochrome-legend">
        <span>Less</span>
        <i className="level-0" title="No activity" />
        <i className="level-1" title="1-45 mins" />
        <i className="level-2" title="46-90 mins" />
        <i className="level-3" title="91-150 mins" />
        <i className="level-4" title="150+ mins" />
        <span>More focus</span>
      </div>

      {/* Selected Day Evidence & Execution */}
      <div className="selected-day-evidence-section" ref={selectedDayEvidenceRef}>
        <div className="panel-header">
          <span className="eyebrow tag-reflected">HISTORICAL JOURNEY DAY</span>
          <h3>
            {selectedDay
              ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "Click any day in the calendar grid above to inspect session evidence"}
          </h3>
        </div>

        {selectedDay ? (
          <div className="day-selected-wrapper">
            {/* 1. DAILY EXECUTION (Planning History) */}
            <div className="daily-execution-panel">
              <span className="eyebrow tag-reflected">DAILY EXECUTION</span>
              {planForDay?.intention ? (
                <div className="historical-intention-box">
                  <span className="section-label">INTENTION</span>
                  <p className="historical-intention-text">“{planForDay.intention}”</p>
                </div>
              ) : null}

              {historicalTasks.length > 0 ? (
                <div className="historical-tasks-container">
                  <span className="section-label">COMMITMENTS & EXECUTION ({historicalTasks.length})</span>
                  <div className="historical-tasks-grid">
                    {historicalTasks.map((t) => {
                      const evidence = getTaskEvidence(t, sessions, selectedDay);

                      let statusIcon = "○";
                      let statusText = "Left unfinished";
                      let statusClass = "unfinished";

                      if (t.status === "completed" && (t.date === selectedDay || (t.completedAt && localDay(t.completedAt) === selectedDay))) {
                        statusIcon = "✓";
                        if (t.completedManually && evidence.sessionCount === 0) {
                          statusText = "Completed manually";
                          statusClass = "completed-manual";
                        } else {
                          statusText = `${evidence.formattedHours} focused · ${evidence.sessionCount} session${evidence.sessionCount === 1 ? "" : "s"}`;
                          statusClass = "completed-evidence";
                        }
                      } else if (evidence.sessionCount > 0 || t.status === "in_progress") {
                        statusIcon = "◔";
                        const isCurrentlyCompleted = t.status === "completed";
                        const statusLabel = isCurrentlyCompleted ? "Completed" : "In Progress";
                        statusText = `${evidence.formattedHours} focused · ${evidence.sessionCount} session${evidence.sessionCount === 1 ? "" : "s"} · ${statusLabel}`;
                        statusClass = "in-progress";
                      } else if (t.carriedFromDate && t.date !== selectedDay) {
                        statusIcon = "↗";
                        statusText = "Left unfinished";
                        statusClass = "rolled-over";
                      }

                      const isCarriedForwardFromHere = t.date !== selectedDay;

                      return (
                        <div key={t.id} className={`historical-task-card ${statusClass}`}>
                          <span className="hist-icon">{statusIcon}</span>
                          <div className="hist-details">
                            <strong className="hist-title">{t.title}</strong>
                            <span className="hist-meta">{statusText}</span>
                            {isCarriedForwardFromHere && (
                              <span className="hist-orig-tag">Carried forward to {t.date}</span>
                            )}
                            {t.originalPlannedDate && t.originalPlannedDate !== selectedDay && !isCarriedForwardFromHere && (
                              <span className="hist-orig-tag">Originally planned {t.originalPlannedDate}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="no-tasks-historical">No commitment records for this day.</p>
              )}
            </div>

            {/* 2. LEARNING EVIDENCE */}
            <div className="learning-evidence-panel" style={{ marginTop: "20px" }}>
              <span className="eyebrow tag-interpreted">LEARNING EVIDENCE</span>
              {selectedDaySessions.length ? (
                <div className="day-sessions-list" style={{ marginTop: "10px" }}>
                  {selectedDaySessions.map((s) => (
                    <article className="public-session-card" key={s.id}>
                      <div className="session-header">
                        <div className="session-topic">{s.topic}</div>
                        <div className="session-badges">
                          <span className={`mode-pill ${s.mode.toLowerCase()}`}>{formatPastTenseMode(s.mode)}</span>
                          <span className="duration-pill">{minutes(s.duration)}</span>
                        </div>
                      </div>

                      {s.reflection && (
                        <div className="session-reflection">
                          <span className="section-label">Learner Reflection</span>
                          <p>“{s.reflection}”</p>
                        </div>
                      )}

                      <div className="session-meta">
                        <span>
                          Independence: <strong>{s.independence}</strong>
                        </span>
                        {s.difficulty && (
                          <span>
                            Challenge: <em>{s.difficulty}</em>
                          </span>
                        )}
                        {s.taskId && (
                          <span className="planned-provenance-tag">
                            Linked Task: <strong>Planned</strong>
                          </span>
                        )}
                      </div>

                      {s.analysis && (
                        <div className="session-ai-analysis">
                          <span className="section-label tag-interpreted">AI Analysis Summary</span>
                          <p>{s.analysis.summary}</p>
                          {s.analysis.progression && (
                            <div className="progression-text">
                              <strong>Progression Signal:</strong> {s.analysis.progression}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-day-state" style={{ marginTop: "10px" }}>
                  <p>No completed focus sessions recorded for this date.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-day-state">
            <p>Select a date from the calendar grid above to view logged reflections and evidence.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const YearlyContributionCalendar = React.memo(YearlyContributionCalendarInner);
export default YearlyContributionCalendar;
