"use client";

import React, { useState, useEffect } from "react";

type TomorrowIntentionProps = {
  tomorrowIntention?: string;
  yesterdayIntention?: string;
  onSaveTomorrowIntention: (text: string) => void;
};

export default function TomorrowIntention({
  tomorrowIntention = "",
  yesterdayIntention = "",
  onSaveTomorrowIntention,
}: TomorrowIntentionProps) {
  const [text, setText] = useState(tomorrowIntention);

  useEffect(() => {
    setText(tomorrowIntention || "");
  }, [tomorrowIntention]);

  const handleBlur = () => {
    onSaveTomorrowIntention(text.trim());
  };

  return (
    <div className="panel tomorrow-intention-card">
      <span className="eyebrow">DAY CLOSE & HORIZON</span>
      <h2>Looking Ahead to Tomorrow</h2>

      {yesterdayIntention && (
        <div className="yesterday-reminder-box">
          <span className="section-label">Yesterday you intended:</span>
          <p>“{yesterdayIntention}”</p>
        </div>
      )}

      <label className="input-field">
        What do you intend to focus on tomorrow?
        <input
          type="text"
          maxLength={200}
          className="tomorrow-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          placeholder="e.g. Finish the React routing exercise and test edge cases…"
        />
      </label>
    </div>
  );
}
