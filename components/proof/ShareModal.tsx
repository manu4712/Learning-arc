"use client";

import React, { useState } from "react";
import { Store, PublicProfileInfo } from "@/lib/data";

type ShareModalProps = {
  store: Store;
  onUpdateStore: (patch: Partial<Store>) => void;
  onClose: () => void;
};

export default function ShareModal({ store, onUpdateStore, onClose }: ShareModalProps) {
  const publicProfile = store.publicProfile;
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handlePublish = async (isUpdate = false) => {
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isUpdate ? publicProfile?.id : undefined,
          managementToken: isUpdate ? publicProfile?.managementToken : undefined,
          displayName: displayName.trim() || undefined,
          store,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish profile.");
      }

      const data = await res.json();
      const updatedProfile: PublicProfileInfo = {
        id: data.id,
        managementToken: data.managementToken,
        publicUrl: data.publicUrl,
        updatedAt: new Date().toISOString(),
      };

      onUpdateStore({ publicProfile: updatedProfile });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publication failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    if (!publicProfile) return;
    if (
      !confirm(
        "Are you sure you want to unpublish your Learning Journey? The public link will stop working immediately."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/publish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: publicProfile.id,
          managementToken: publicProfile.managementToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unpublish.");
      }

      onUpdateStore({ publicProfile: undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unpublish failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    if (!publicProfile) return;
    const fullUrl = `${window.location.origin}${publicProfile.publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content share-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="share-modal-header">
          <span className="eyebrow tag-interpreted">SHAREABLE PROOF OF LEARNING</span>
          <h2 className="share-modal-title">
            {publicProfile ? "Manage Public Profile" : "Publish Learning Journey"}
          </h2>
        </div>

        {!publicProfile ? (
          <div className="share-intro-flow">
            <p className="share-intro-desc">
              Publishing creates a <strong>read-only public profile link</strong> that presents your recorded focus time, reflections, streaks, and skill signals.
            </p>

            <div className="share-privacy-box">
              <strong className="privacy-heading">🔒 Privacy First</strong>
              <ul className="privacy-list">
                <li>Your private API keys and tokens are <strong>never</strong> shared.</li>
                <li>Visitors cannot edit, modify, or delete your learning sessions.</li>
                <li>You can update or unpublish this goal profile at any time.</li>
              </ul>
            </div>

            <div className="share-field-group">
              <label htmlFor="learner-name-input" className="share-field-label">
                Learner Display Name <span className="optional-tag">(optional)</span>
              </label>
              <input
                id="learner-name-input"
                type="text"
                maxLength={60}
                className="text-input share-text-input"
                placeholder="e.g. Alex M."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="share-modal-actions">
              <button className="secondary share-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="primary share-btn"
                onClick={() => handlePublish(false)}
                disabled={busy}
              >
                {busy ? "Publishing snapshot…" : "Publish Learning Journey →"}
              </button>
            </div>
          </div>
        ) : (
          <div className="share-manage-flow">
            <div className="share-live-status-card">
              <span className="live-status-dot" />
              <span className="live-status-text">Your Learning Journey is published and live!</span>
            </div>

            <div className="share-url-section">
              <label className="share-field-label">Public Profile URL</label>
              <div className="share-url-input-row">
                <input
                  type="text"
                  readOnly
                  className="share-url-field"
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}${publicProfile.publicUrl}`}
                />
                <button
                  type="button"
                  className={`share-copy-btn ${copied ? "copied" : ""}`}
                  onClick={copyLink}
                >
                  {copied ? "✓ Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="share-manage-actions-row">
              <div className="share-primary-actions-group">
                <a
                  href={publicProfile.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary share-action-btn button-link"
                >
                  View Public Profile ↗
                </a>
                <button
                  type="button"
                  className="primary share-action-btn"
                  onClick={() => handlePublish(true)}
                  disabled={busy}
                >
                  {busy ? "Updating…" : "Update Published Snapshot"}
                </button>
              </div>

              <button
                type="button"
                className="share-unpublish-btn"
                onClick={handleUnpublish}
                disabled={busy}
              >
                Unpublish Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
