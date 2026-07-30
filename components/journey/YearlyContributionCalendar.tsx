"use client";

import React, { useRef, useEffect } from "react";
import {
  Session,
  getYearCalendarDays,
  getYearStats,
  localDay,
  minutes,
  CalendarDayInfo,
} from "@/lib/data";

type YearlyContributionCalendarProps = {
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

export default function YearlyContributionCalendar({
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

  const stats = getYearStats(sessions, selectedYear);
  const daysInYear = getYearCalendarDays(selectedYear);

  // Group days by exact calendar months (Jan = 0 .. Dec = 11)
  const monthBlocks = MONTH_NAMES.map((monthName, mIdx) => {
    const daysInMonth = daysInYear.filter((d) => d.monthIndex === mIdx);
    const firstDayOfWeek = daysInMonth[0] ? daysInMonth[0].dayOfWeek : 0;

    const weeks: (CalendarDayInfo | null)[][] = [];
    let currentWeek: (CalendarDayInfo | null)[] = Array(firstDayOfWeek).fill(null);

    daysInMonth.forEach((dayInfo) => {
      currentWeek.push(dayInfo);
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

  // Handle day click & smooth scroll on mobile
  const handleDayClick = (dateStr: string) => {
    onSelectDay(dateStr);
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setTimeout(() => {
        selectedDayEvidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  };

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
  const selectedDaySessions = selectedDay
    ? sessions.filter((s) => s.completedAt && localDay(s.completedAt) === selectedDay)
    : [];

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
                      {week.map((dayInfo, rowIdx) => {
                        if (!dayInfo) {
                          return <span key={rowIdx} className="calendar-cell empty-slot" />;
                        }

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
                        const formattedDate = dayInfo.dateObj.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });

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

      {/* Selected Day Evidence (IMMEDIATELY BELOW GRID) */}
      <div className="selected-day-evidence-section" ref={selectedDayEvidenceRef}>
        <div className="panel-header">
          <span className="eyebrow tag-reflected">SELECTED DAY EVIDENCE</span>
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
          selectedDaySessions.length ? (
            <div className="day-sessions-list">
              {selectedDaySessions.map((s) => (
                <article className="public-session-card" key={s.id}>
                  <div className="session-header">
                    <div className="session-topic">{s.topic}</div>
                    <div className="session-badges">
                      <span className={`mode-pill ${s.mode.toLowerCase()}`}>{s.mode}</span>
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
            <div className="empty-day-state">
              <p>No completed focus sessions recorded for this date.</p>
            </div>
          )
        ) : (
          <div className="empty-day-state">
            <p>Select a date from the calendar grid above to view logged reflections and evidence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
