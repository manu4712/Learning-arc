"use client";

import React, { useState, useMemo } from "react";
import { Session, Store, stats as calculateStats, getAvailableYears } from "@/lib/data";
import YearlyContributionCalendar from "./YearlyContributionCalendar";
import SkillEvolutionSection from "./SkillEvolutionSection";

type JourneyViewProps = {
  store?: Store;
  sessions: Session[];
  st: ReturnType<typeof calculateStats>;
};

export default function JourneyView({ store, sessions }: JourneyViewProps) {
  const availableYears = useMemo(() => getAvailableYears(sessions), [sessions]);
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

      {/* Shared Skill Evolution Section */}
      <SkillEvolutionSection sessions={sessions} />
    </div>
  );
}
