"use client";

import React, { useState, useEffect } from "react";
import { Store } from "@/lib/data";

type ShareModalProps = {
  store: Store;
  onClose: () => void;
};

type LocalShareData = {
  id: string;
  managementToken: string;
  publicUrl: string;
  updatedAt: string;
};

const LOCAL_SHARE_KEY = "learning-arc-public-profile-v1";

export default function ShareModal({ store, onClose }: ShareModalProps) {
  const [localShare, setLocalShare] = useState<LocalShareData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SHARE_KEY);
      if (raw) {
        setLocalShare(JSON.parse(raw));
      }
    } catch {}
  }, []);

  const handlePublish = async (isUpdate = false) => {
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isUpdate ? localShare?.id : undefined,
          managementToken: isUpdate ? localShare?.managementToken : undefined,
          displayName: displayName.trim() || undefined,
          store,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish profile.");
      }

      const data = await res.json();
      const updatedLocal: LocalShareData = {
        id: data.id,
        managementToken: data.managementToken,
        publicUrl: data.publicUrl,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(LOCAL_SHARE_KEY, JSON.stringify(updatedLocal));
      setLocalShare(updatedLocal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publication failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    if (!localShare) return;
    if (!confirm("Are you sure you want to unpublish your Learning Journey? The public link will stop working immediately.")) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/publish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: localShare.id,
          managementToken: localShare.managementToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unpublish.");
      }

      localStorage.removeItem(LOCAL_SHARE_KEY);
      setLocalShare(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unpublish failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    if (!localShare) return;
    const fullUrl = `${window.location.origin}${localShare.publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <span className="eyebrow">SHAREABLE PROOF OF LEARNING</span>
        <h2>{localShare ? "Manage Public Profile" : "Publish Learning Journey"}</h2>

        {!localShare ? (
          <div className="share-intro">
            <p>
              Publishing creates a <strong>read-only public profile link</strong> that presents your recorded focus time, reflections, streaks, and skill signals.
            </p>
            <div className="privacy-callout">
              <strong>🔒 Privacy First:</strong>
              <ul>
                <li>Your private API keys and tokens are <strong>never</strong> shared.</li>
                <li>Visitors cannot edit, modify, or delete your learning sessions.</li>
                <li>You can update or unpublish your profile at any time from this device.</li>
              </ul>
            </div>

            <label className="input-field">
              Learner Display Name <small>(optional)</small>
              <input
                type="text"
                maxLength={60}
                placeholder="e.g. Alex M."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>

            {error && <p className="notice danger">{error}</p>}

            <div className="modal-actions">
              <button className="primary" onClick={() => handlePublish(false)} disabled={busy}>
                {busy ? "Publishing snapshot…" : "Publish My Learning Journey →"}
              </button>
              <button className="secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="share-active">
            <p className="notice success">
              ✓ Your Learning Journey is published and live!
            </p>

            <div className="public-url-box">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}${localShare.publicUrl}`}
              />
              <button className="primary" onClick={copyLink}>
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
              <button className="secondary" onClick={() => handlePublish(true)} disabled={busy}>
                {busy ? "Updating…" : "Update Published Snapshot"}
              </button>
              <button className="text danger" onClick={handleUnpublish} disabled={busy}>
                Unpublish Profile
              </button>
            </div>

            {error && <p className="notice danger">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
