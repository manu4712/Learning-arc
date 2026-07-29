"use client";

import React, { useState } from "react";
import { Session, stats as calculateStats, localDay, minutes } from "@/lib/data";

type JourneyViewProps = {
  sessions: Session[];
  st: ReturnType<typeof calculateStats>;
};

export default function JourneyView({ sessions, st }: JourneyViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAllSkills, setShowAllSkills] = useState(false);

  const start = new Date();
  start.setDate(start.getDate() - 83);
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return localDay(d.toISOString());
  });

  const selectedDaySessions = selectedDay
    ? sessions.filter((s) => localDay(s.completedAt) === selectedDay)
    : [];

  // Group skills
  const skillGroups = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    const detected = s.analysis?.skills || [s.topic];
    detected.forEach((k) => {
      acc[k] = acc[k] || [];
      acc[k].push(s);
    });
    return acc;
  }, {});

  const sortedSkills = Object.entries(skillGroups).sort((a, b) => b[1].length - a[1].length);
  const visibleSkills = showAllSkills ? sortedSkills : sortedSkills.slice(0, 8);

  return (
    <div className="journey-container">
      <div className="page-head">
        <div>
          <span className="eyebrow">LEARNING JOURNEY</span>
          <h1 className="page-title">The story of your effort.</h1>
          <p className="page-desc">Activity is not a score—it’s evidence you can return to and build upon.</p>
        </div>
      </div>

      {/* Contribution Grid */}
      <section className="panel journey-grid-panel">
        <div className="calendar-grid">
          {days.map((day) => {
            const mins = st.daily[day] || 0;
            const level =
              mins === 0 ? 0 : mins <= 45 ? 1 : mins <= 90 ? 2 : mins <= 150 ? 3 : 4;
            const isChosen = selectedDay === day;

            return (
              <button
                key={day}
                type="button"
                className={`calendar-day level-${level} ${isChosen ? "chosen" : ""}`}
                onClick={() => setSelectedDay(day)}
                aria-label={`${day}: ${mins} minutes`}
                title={`${day}: ${mins} minutes focused`}
              />
            );
          })}
        </div>

        <div className="calendar-legend">
          <span>Less</span>
          <i className="level-0" />
          <i className="level-1" />
          <i className="level-2" />
          <i className="level-3" />
          <i className="level-4" />
          <span>More meaningful focus</span>
        </div>
      </section>

      {/* Two Column: Skill Evolution & Day Details */}
      <div className="grid two">
        <section className="panel">
          <span className="eyebrow">SKILL EVOLUTION</span>
          <h2>Repeated evidence, not credentials</h2>

          <div className="skills-list">
            {visibleSkills.map(([skill, items]) => {
              const stage = items.some((i) => i.mode === "Building")
                ? "Applied"
                : items.some((i) => i.mode === "Practicing")
                ? "Practiced"
                : "Learned";

              return (
                <div key={skill} className="skill-card">
                  <div className="skill-meta">
                    <strong className="skill-name">{skill}</strong>
                    <span className={`skill-stage stage-${stage.toLowerCase()}`}>{stage}</span>
                  </div>
                  <div className="skill-progress-bar">
                    <i style={{ width: `${Math.min(100, items.length * 25)}%` }} />
                  </div>
                </div>
              );
            })}

            {!sessions.length && (
              <div className="empty-state">
                <span className="empty-icon">◇</span>
                <strong>Skills appear as you log evidence</strong>
                <p>The system looks for recurring topics across your sessions.</p>
              </div>
            )}
          </div>

          {sortedSkills.length > 8 && (
            <button
              type="button"
              className="text skills-toggle"
              onClick={() => setShowAllSkills((prev) => !prev)}
            >
              {showAllSkills ? "Show less" : `Show all ${sortedSkills.length} skills`}
            </button>
          )}
        </section>

        <section className="panel">
          <span className="eyebrow">DAY DETAIL</span>
          <h2>
            {selectedDay
              ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })
              : "Select a day"}
          </h2>

          {selectedDay ? (
            selectedDaySessions.length ? (
              <div className="events-list">
                {selectedDaySessions.map((e) => (
                  <article className="event-item" key={e.id}>
                    <div className="event-dot" />
                    <div className="event-details">
                      <strong>{e.topic}</strong>
                      <p className="event-meta">
                        <span className={`mode-mark ${e.mode.toLowerCase()}`}>{e.mode}</span> · {minutes(e.duration)}
                      </p>
                      <small className="event-summary">{e.analysis?.summary || e.reflection}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">◇</span>
                <strong>No completed focus sessions</strong>
                <p>A quiet day is part of a real journey too.</p>
              </div>
            )
          ) : (
            <div className="empty-state">
              <span className="empty-icon">◇</span>
              <strong>Explore your pattern</strong>
              <p>Choose an active day from the grid above to see its learning evidence.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
