"use client";

import React, { useState, useMemo } from "react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { PublicProfileSnapshot } from "@/lib/db";
import { minutes, getAvailableYears, Session, Store, DailyTask, DailyPlan } from "@/lib/data";
import YearlyContributionCalendar from "@/components/journey/YearlyContributionCalendar";
import SkillEvolutionSection from "@/components/journey/SkillEvolutionSection";

export type PublicProfileViewData = Omit<PublicProfileSnapshot, "managementToken">;

export default function PublicProfileView({ profile }: { profile: PublicProfileViewData }) {
  const sessions = useMemo(() => (profile.sessions || []) as Session[], [profile.sessions]);
  const availableYears = useMemo(() => getAvailableYears(sessions), [sessions]);

  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears[0] || new Date().getFullYear()
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const storeForCalendar = useMemo<Store>(
    () => ({
      id: profile.id,
      version: 3,
      createdAt: profile.publishedAt,
      updatedAt: profile.updatedAt,
      goal: profile.goal as Store["goal"],
      sessions: sessions,
      tasks: (profile.tasks || []) as DailyTask[],
      dailyPlans: (profile.dailyPlans || {}) as Record<string, DailyPlan>,
    }),
    [profile, sessions]
  );

  return (
    <div className="public-profile-container">
      {/* 1. PUBLIC PROFILE HEADER BANNER */}
      <header className="public-header">
        <div className="public-brand">
          <span className="brand-symbol">↗</span> Learning Arc
          <span className="read-only-badge">VERIFIED READ-ONLY PROOF</span>
        </div>
        <div className="public-header-actions">
          <span className="published-date">
            Published {new Date(profile.publishedAt).toLocaleDateString()}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* 1 & 2. HERO / LEARNING GOAL & SUMMARY METRICS */}
      <section className="public-hero">
        <div className="hero-eyebrow">
          <span>PUBLIC LEARNING EVIDENCE</span>
          {profile.displayName && <span className="learner-name">by {profile.displayName}</span>}
        </div>
        <h1 className="hero-title">{profile.goal.title}</h1>
        {profile.goal.description && <p className="hero-desc">{profile.goal.description}</p>}
        <div className="hero-timeline-tag">Horizon: {profile.goal.duration}</div>

        <div className="public-stats-grid">
          <div className="public-stat-card">
            <strong>{minutes(profile.stats.totalMinutes)}</strong>
            <span>total focused time</span>
          </div>
          <div className="public-stat-card">
            <strong>{profile.stats.currentStreak} days</strong>
            <span>active streak</span>
          </div>
          <div className="public-stat-card">
            <strong>{profile.stats.longestStreak} days</strong>
            <span>longest streak</span>
          </div>
          <div className="public-stat-card">
            <strong>{profile.stats.totalSessions}</strong>
            <span>sessions completed</span>
          </div>
        </div>
      </section>

      {/* 3. RECORDED / REFLECTED / INTERPRETED EXPLANATION BANNER */}
      <section className="proof-distinction-banner">
        <div className="distinction-tag tag-recorded">
          <span className="dot" /> <strong>RECORDED</strong> Factual time & timestamps
        </div>
        <div className="distinction-tag tag-reflected">
          <span className="dot" /> <strong>REFLECTED</strong> Learner&apos;s explicit notes
        </div>
        <div className="distinction-tag tag-interpreted">
          <span className="dot" /> <strong>INTERPRETED</strong> AI pattern signals
        </div>
      </section>

      {/* 4 & 5. YEAR-BASED LEARNING CALENDAR & SELECTED DAY EVIDENCE */}
      <section className="panel public-section-block">
        <YearlyContributionCalendar
          store={storeForCalendar}
          sessions={sessions}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onSelectYear={setSelectedYear}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          title="LEARNING EFFORT GRID"
        />
      </section>

      {/* 6. SKILL EVOLUTION EXPLORER */}
      <SkillEvolutionSection
        sessions={sessions}
        title="Strongest Evidence-Backed Skills"
      />

      {/* 7. LEARNING INTELLIGENCE / AI INTERPRETATION (FINAL MAJOR SECTION) */}
      {profile.report && (
        <section className="panel public-section-block public-intelligence-card">
          <div className="intel-header">
            <span className="eyebrow tag-interpreted">LEARNING INTELLIGENCE — AI INTERPRETATION</span>
            <h2>Overall AI Evidence Synthesis</h2>
          </div>
          <p className="narrative-quote">“{profile.report.narrative}”</p>

          <div className="intel-grid-horizontal">
            <div className="intel-block">
              <strong>Emerging Pattern:</strong>
              <p>{profile.report.pattern}</p>
            </div>

            <div className="intel-block">
              <strong>Focus Gap:</strong>
              <p>{profile.report.gap}</p>
            </div>

            <div className="intel-block priority-block">
              <strong>Recommended Priority:</strong>
              <p>{profile.report.priority}</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="public-footer">
        <p>
          Generated via <strong>Learning Arc v2</strong>. Private working data remains local to the learner&apos;s device; this public snapshot is explicitly published evidence.
        </p>
      </footer>
    </div>
  );
}
