"use client";

import React, { useState } from "react";
import { Session, Store, stats as calculateStats, getAvailableYears } from "@/lib/data";
import YearlyContributionCalendar from "./YearlyContributionCalendar";

type JourneyViewProps = {
  store?: Store;
  sessions: Session[];
  st: ReturnType<typeof calculateStats>;
};

export default function JourneyView({ store, sessions }: JourneyViewProps) {
  const availableYears = getAvailableYears(sessions);
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAllSkills, setShowAllSkills] = useState(false);

  // Group skills from sessions
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

      {/* Year-Based Contribution Calendar & Selected Day Evidence */}
      <section className="panel journey-grid-panel">
        <YearlyContributionCalendar
          store={store}
          sessions={sessions}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onSelectYear={setSelectedYear}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          title="LEARNING CALENDAR"
        />
      </section>

      {/* Skill Evolution Section */}
      <section className="panel journey-skills-panel">
        <div className="panel-header-with-action">
          <div>
            <span className="eyebrow">SKILL EVOLUTION</span>
            <h2>Repeated evidence, not credentials</h2>
          </div>
          {sortedSkills.length > 8 && (
            <button
              type="button"
              className="secondary show-all-skills-btn"
              onClick={() => setShowAllSkills((prev) => !prev)}
            >
              {showAllSkills ? "Show top 8 skills" : `Show all ${sortedSkills.length} skills →`}
            </button>
          )}
        </div>

        {visibleSkills.length ? (
          <div className="skills-compact-grid">
            {visibleSkills.map(([skill, items]) => {
              const stage = items.some((i) => i.mode === "Building")
                ? "Applied"
                : items.some((i) => i.mode === "Practicing")
                ? "Practiced"
                : "Learned";

              return (
                <div key={skill} className="skill-card-compact">
                  <div className="skill-compact-header">
                    <strong className="skill-title">{skill}</strong>
                    <span className={`stage-badge stage-${stage.toLowerCase()}`}>{stage}</span>
                  </div>
                  <div className="skill-compact-meta">
                    {items.length} supporting session{items.length === 1 ? "" : "s"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">◇</span>
            <strong>Your learning history starts here.</strong>
            <p>Complete your first focus session to create your first learning day and accumulate skill signals.</p>
          </div>
        )}
      </section>
    </div>
  );
}
