"use client";

import React, { useState } from "react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { PublicProfileSnapshot } from "@/lib/db";
import { minutes, getAvailableYears, Session } from "@/lib/data";
import YearlyContributionCalendar from "@/components/journey/YearlyContributionCalendar";

export type PublicProfileViewData = Omit<PublicProfileSnapshot, "managementToken">;

export default function PublicProfileView({ profile }: { profile: PublicProfileViewData }) {
  const sessions = (profile.sessions || []) as Session[];
  const availableYears = getAvailableYears(sessions);

  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears[0] || new Date().getFullYear()
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAllSkillsOpen, setShowAllSkillsOpen] = useState(false);

  // Ranked skills sorting: sessionCount desc, stage weight (APPLIED > PRACTICED > LEARNED)
  const stageWeights: Record<string, number> = {
    APPLIED: 3,
    PRACTICED: 2,
    LEARNED: 1,
  };

  const sortedSkills = [...(profile.skills || [])].sort((a, b) => {
    if (b.sessionCount !== a.sessionCount) {
      return b.sessionCount - a.sessionCount;
    }
    const weightA = stageWeights[a.stage.toUpperCase()] || 0;
    const weightB = stageWeights[b.stage.toUpperCase()] || 0;
    if (weightB !== weightA) {
      return weightB - weightA;
    }
    return a.skill.localeCompare(b.skill);
  });

  const TOP_SKILLS_LIMIT = 8;
  const topSkills = sortedSkills.slice(0, TOP_SKILLS_LIMIT);
  const hasMoreSkills = sortedSkills.length > TOP_SKILLS_LIMIT;

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
          sessions={sessions}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onSelectYear={setSelectedYear}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          title="LEARNING EFFORT GRID"
        />
      </section>

      {/* 6. SKILL EVOLUTION (Top 8 Evidence-Backed Skills) */}
      <section className="panel public-section-block">
        <div className="panel-header-with-action">
          <div>
            <span className="eyebrow">SKILL EVOLUTION</span>
            <h2>Strongest Evidence-Backed Skills</h2>
          </div>
          {hasMoreSkills && (
            <button
              type="button"
              className="secondary show-all-skills-btn"
              onClick={() => setShowAllSkillsOpen(true)}
            >
              Show all skills ({sortedSkills.length}) →
            </button>
          )}
        </div>

        {topSkills.length ? (
          <div className="skills-compact-grid">
            {topSkills.map((sk) => (
              <div key={sk.skill} className="skill-card-compact">
                <div className="skill-compact-header">
                  <strong className="skill-title">{sk.skill}</strong>
                  <span className={`stage-badge stage-${sk.stage.toLowerCase()}`}>
                    {sk.stage}
                  </span>
                </div>
                <div className="skill-compact-meta">
                  {sk.sessionCount} supporting session{sk.sessionCount === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Skill signals will accumulate as sessions are logged.</p>
        )}
      </section>

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

      {/* Show All Skills Modal */}
      {showAllSkillsOpen && (
        <div className="modal-backdrop" onClick={() => setShowAllSkillsOpen(false)}>
          <div className="modal-content skills-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowAllSkillsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <span className="eyebrow">FULL SKILL INVENTORY</span>
            <h2>All {sortedSkills.length} Evidence-Backed Skills</h2>
            <p className="modal-subtitle">
              Ranked by session volume and progression stage (Applied → Practiced → Learned).
            </p>

            <div className="all-skills-scroll-list">
              {sortedSkills.map((sk) => (
                <div key={sk.skill} className="skill-modal-row">
                  <div className="skill-info">
                    <strong className="skill-title">{sk.skill}</strong>
                    <span className={`stage-badge stage-${sk.stage.toLowerCase()}`}>
                      {sk.stage}
                    </span>
                  </div>
                  <div className="skill-count">{sk.sessionCount} session{sk.sessionCount === 1 ? "" : "s"}</div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowAllSkillsOpen(false)}
              >
                Close Inventory
              </button>
            </div>
          </div>
        </div>
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
