"use client";

import React, { useState, useMemo } from "react";
import { Session, minutes } from "@/lib/data";
import { aggregateCoreSkills, formatPastTenseMode } from "@/lib/skills";

type SkillEvolutionSectionProps = {
  sessions: Session[];
  title?: string;
  subtitle?: string;
};

export default function SkillEvolutionSection({
  sessions,
  title = "Repeated evidence, not credentials",
  subtitle,
}: SkillEvolutionSectionProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Group durable Core Skills from sessions using skill aggregation engine
  const coreSkillGroups = useMemo(() => aggregateCoreSkills(sessions), [sessions]);
  const visibleSkills = useMemo(
    () => (showAllSkills ? coreSkillGroups : coreSkillGroups.slice(0, 8)),
    [coreSkillGroups, showAllSkills]
  );

  const primaryDomain = useMemo(() => {
    const domains = coreSkillGroups.map((g) => g.domain).filter(Boolean);
    return domains[0] || null;
  }, [coreSkillGroups]);

  const handleToggleSkill = (skill: string, defaultSessionId?: string) => {
    if (expandedSkill === skill) {
      setExpandedSkill(null);
      setSelectedSessionId(null);
    } else {
      setExpandedSkill(skill);
      if (defaultSessionId) {
        setSelectedSessionId(defaultSessionId);
      }
    }
  };

  return (
    <section className="panel journey-skills-panel">
      <div className="panel-header-with-action">
        <div>
          <span className="eyebrow">
            SKILL EVOLUTION {primaryDomain ? `· DOMAIN: ${primaryDomain.toUpperCase()}` : ""}
          </span>
          <h2>{title}</h2>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
        {coreSkillGroups.length > 8 && (
          <button
            type="button"
            className="secondary show-all-skills-btn"
            onClick={() => setShowAllSkills((prev) => !prev)}
          >
            {showAllSkills ? "Show top 8 skills" : `Show all ${coreSkillGroups.length} skills →`}
          </button>
        )}
      </div>

      {visibleSkills.length ? (
        <div className="skills-compact-grid">
          {visibleSkills.map((group) => {
            const isExpanded = expandedSkill === group.skill;
            const totalMins = group.sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
            const formattedHours = (totalMins / 60).toFixed(1).replace(/\.0$/, "") + " Focus Hours";

            // Sort sessions chronologically for evidence timeline
            const chronologicalSessions = [...group.sessions].sort((a, b) => {
              const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
              const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
              return da - db;
            });

            const activeSession =
              chronologicalSessions.find((s) => s.id === selectedSessionId) || chronologicalSessions[0];

            if (isExpanded) {
              return (
                <div key={group.skill} className="skill-card-compact expanded">
                  <div className="skill-explorer-header">
                    <div>
                      <div className="skill-compact-header">
                        <strong className="skill-explorer-title">{group.skill}</strong>
                      </div>
                      <div className="skill-explorer-evidence-meta">
                        <strong>{group.sessions.length} Evidence Sessions</strong>
                        <span>·</span>
                        <strong>{formattedHours}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="secondary collapse-skill-btn"
                      onClick={() => setExpandedSkill(null)}
                    >
                      Close Explorer ✕
                    </button>
                  </div>

                  <div className="skill-explorer-split-view">
                    {/* LEFT PANEL: EVIDENCE TIMELINE */}
                    <div className="explorer-timeline-panel">
                      <span className="eyebrow explorer-panel-eyebrow">
                        EVIDENCE TIMELINE ({chronologicalSessions.length})
                      </span>
                      <div className="timeline-items-list">
                        {chronologicalSessions.map((s) => {
                          const isSelected = activeSession?.id === s.id;
                          const dateStr = s.completedAt
                            ? new Date(s.completedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "Logged session";

                          return (
                            <button
                              key={s.id}
                              type="button"
                              className={`timeline-item-btn ${isSelected ? "selected" : ""}`}
                              onClick={() => setSelectedSessionId(s.id)}
                            >
                              <div className="timeline-item-header">
                                <span className="timeline-date">{dateStr}</span>
                                <span className="timeline-duration">{minutes(s.duration)}</span>
                              </div>
                              <strong className="timeline-topic">{s.topic}</strong>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT PANEL: SELECTED SESSION DETAILS */}
                    <div className="explorer-details-panel">
                      {activeSession ? (
                        <div className="explorer-session-card">
                          <div className="details-header">
                            <span className="eyebrow tag-interpreted">SELECTED SESSION EVIDENCE</span>
                            <h3 className="details-topic">{activeSession.topic}</h3>
                            <div className="details-badge-row">
                              <span className={`mode-pill ${activeSession.mode.toLowerCase()}`}>
                                {formatPastTenseMode(activeSession.mode)}
                              </span>
                              <span className="duration-pill">{minutes(activeSession.duration)}</span>
                              {activeSession.completedAt && (
                                <span className="date-pill">
                                  {new Date(activeSession.completedAt).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          {activeSession.reflection && (
                            <div className="details-section">
                              <span className="section-label">Learner Reflection</span>
                              <p className="details-reflection">“{activeSession.reflection}”</p>
                            </div>
                          )}

                          <div className="details-meta-grid">
                            <div>
                              <span className="section-label">Independence</span>
                              <strong>{activeSession.independence}</strong>
                            </div>
                            {activeSession.difficulty && (
                              <div>
                                <span className="section-label">Challenge</span>
                                <em>{activeSession.difficulty}</em>
                              </div>
                            )}
                          </div>

                          {activeSession.analysis && (
                            <div className="details-section session-ai-analysis">
                              <span className="section-label tag-interpreted">AI Analysis Summary</span>
                              <p>{activeSession.analysis.summary}</p>
                              {activeSession.analysis.progression && (
                                <div className="progression-text">
                                  <strong>Progression Signal:</strong> {activeSession.analysis.progression}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="empty-day-state">
                          <p>Select a session from the timeline index to inspect details.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={group.skill}
                className="skill-card-compact clickable"
                onClick={() => handleToggleSkill(group.skill, chronologicalSessions[0]?.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleSkill(group.skill, chronologicalSessions[0]?.id);
                  }
                }}
              >
                <div className="skill-compact-header">
                  <strong className="skill-title">{group.skill}</strong>
                </div>
                <div className="skill-compact-evidence-row">
                  <strong className="evidence-value">
                    {group.sessions.length} Evidence Sessions · {formattedHours}
                  </strong>
                </div>
                {group.concepts.length > 0 && (
                  <div className="skill-concepts-sublist">
                    {group.concepts.slice(0, 4).map((concept) => (
                      <span key={concept} className="concept-chip">
                        • {concept}
                      </span>
                    ))}
                    {group.concepts.length > 4 && (
                      <span className="concept-chip muted">+{group.concepts.length - 4} more</span>
                    )}
                  </div>
                )}
                <div className="explore-hint">Click to explore evidence →</div>
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
  );
}
