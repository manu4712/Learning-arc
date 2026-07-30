"use client";

import React, { useState, useEffect } from "react";

type DailyIntentionProps = {
  intention?: string;
  onSaveIntention: (newIntention: string) => void;
};

export default function DailyIntention({ intention = "", onSaveIntention }: DailyIntentionProps) {
  const [text, setText] = useState(intention);
  const [isEditing, setIsEditing] = useState(!intention);

  useEffect(() => {
    setText(intention || "");
  }, [intention]);

  const handleSave = () => {
    onSaveIntention(text.trim());
    setIsEditing(false);
  };

  return (
    <div className="panel daily-intention-card">
      <div className="card-header-row">
        <span className="eyebrow">DAILY DIRECTION</span>
        {intention && !isEditing && (
          <button
            type="button"
            className="secondary btn-sm edit-intention-btn"
            onClick={() => setIsEditing(true)}
          >
            ✎ Edit Intention
          </button>
        )}
      </div>

      <h2>Today’s Intention</h2>

      {isEditing ? (
        <div className="intention-editor">
          <input
            type="text"
            className="intention-input"
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What matters most today?"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <button type="button" className="secondary btn-sm" onClick={handleSave}>
            Set Intention
          </button>
        </div>
      ) : (
        <p className="intention-text">“{intention}”</p>
      )}
    </div>
  );
}
