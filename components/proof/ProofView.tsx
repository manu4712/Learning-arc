"use client";

import React, { useState, useEffect } from "react";
import ShareModal from "./ShareModal";
import { Goal, Store, stats as calculateStats, minutes } from "@/lib/data";

type ProofViewProps = {
  goal: Goal;
  store: Store;
  st: ReturnType<typeof calculateStats>;
};

type LocalShareData = {
  id: string;
  managementToken: string;
  publicUrl: string;
  updatedAt: string;
};

const LOCAL_SHARE_KEY = "learning-arc-public-profile-v1";

export default function ProofView({ goal, store, st }: ProofViewProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [localShare, setLocalShare] = useState<LocalShareData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SHARE_KEY);
      if (raw) {
        setLocalShare(JSON.parse(raw));
      }
    } catch {}
  }, [shareModalOpen]);

  const copyLink = () => {
    if (!localShare) return;
    const fullUrl = `${window.location.origin}${localShare.publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const report = store.report;

  return (
    <div className="proof-container">
      <div className="page-head">
        <div>
          <span className="eyebrow">PROOF OF LEARNING</span>
          <h1 className="page-title">Share your learning journey.</h1>
          <p className="page-desc">
            Turn your local Learning Arc evidence into a read-only public profile URL to share on GitHub, LinkedIn, or portfolios.
          </p>
        </div>
      </div>

      {/* Share Management Panel */}
      <section className="panel share-status-panel">
        {localShare ? (
          <div className="share-status-published">
            <div className="status-badge-row">
              <span className="status-pill published">● JOURNEY PUBLISHED & LIVE</span>
              <span className="last-updated-text">
                Last updated {new Date(localShare.updatedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="public-url-bar">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}${localShare.publicUrl}`}
              />
              <button type="button" className="primary" onClick={copyLink}>
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <div className="share-action-buttons">
              <a
                href={localShare.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary button-link"
              >
                View Public Profile ↗
              </a>
              <button type="button" className="secondary" onClick={() => setShareModalOpen(true)}>
                Manage / Update Snapshot
              </button>
            </div>
          </div>
        ) : (
          <div className="share-status-unpublished">
            <div className="unpublished-callout">
              <h2>Ready to share your verifiable progress?</h2>
              <p>
                Publishing creates a sanitized, read-only web URL showcasing your recorded focus hours, reflections, streaks, and skill evolution.
              </p>
              <button type="button" className="primary publish-cta-btn" onClick={() => setShareModalOpen(true)}>
                🌐 Publish Learning Journey →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Public Profile Preview Card */}
      <article className="panel proof-preview-card">
        <div className="preview-header">
          <span className="eyebrow">PUBLIC EVIDENCE SNAPSHOT PREVIEW</span>
          <h2>{goal.title}</h2>
          {goal.description && <p>{goal.description}</p>}
        </div>

        <div className="preview-stats-row">
          <div className="preview-stat-item">
            <strong>{minutes(st.total)}</strong>
            <span>focused time</span>
          </div>
          <div className="preview-stat-item">
            <strong>{st.currentStreak} days</strong>
            <span>active streak</span>
          </div>
          <div className="preview-stat-item">
            <strong>{st.done.length}</strong>
            <span>sessions completed</span>
          </div>
        </div>

        <div className="preview-section">
          <h3>Work Distribution</h3>
          <div className="balance-list">
            {["Learning", "Practicing", "Building", "Reading", "Revising"].map((m) => {
              const n = st.byMode[m] || 0;
              const pct = st.total ? Math.round((n / st.total) * 100) : 0;
              return (
                <div className="balance-item" key={m}>
                  <span className="mode-label">{m}</span>
                  <div className="bar-track">
                    <div className={`bar-fill ${m.toLowerCase()}`} style={{ width: `${pct}%` }} />
                  </div>
                  <b className="pct-text">{pct}%</b>
                </div>
              );
            })}
          </div>
        </div>

        {report && (
          <div className="preview-section quote-section">
            <h3>Learning Intelligence Summary</h3>
            <p className="report-narrative">“{report.narrative}”</p>
          </div>
        )}
      </article>

      {shareModalOpen && (
        <ShareModal store={store} onClose={() => setShareModalOpen(false)} />
      )}
    </div>
  );
}
