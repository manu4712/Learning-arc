"use client";

import React, { useState, useEffect } from "react";

type GratitudeCardProps = {
  gratitude?: string[];
  onSaveGratitude: (items: string[]) => void;
};

export default function GratitudeCard({
  gratitude = ["", "", ""],
  onSaveGratitude,
}: GratitudeCardProps) {
  const [items, setItems] = useState<string[]>([
    gratitude[0] || "",
    gratitude[1] || "",
    gratitude[2] || "",
  ]);

  useEffect(() => {
    setItems([
      gratitude[0] || "",
      gratitude[1] || "",
      gratitude[2] || "",
    ]);
  }, [gratitude]);

  const handleChange = (index: number, val: string) => {
    const next = [...items];
    next[index] = val;
    setItems(next);
  };

  const handleBlur = () => {
    onSaveGratitude(items.map((i) => i.trim()));
  };

  return (
    <div className="panel gratitude-card">
      <span className="eyebrow">REFLECTION</span>
      <h2>Daily Gratitude</h2>
      <p className="card-subtext">Three simple things you appreciate today:</p>

      <div className="gratitude-inputs-list">
        {items.map((item, idx) => (
          <div key={idx} className="gratitude-item-row">
            <span className="gratitude-num">{idx + 1}.</span>
            <input
              type="text"
              maxLength={120}
              className="gratitude-input"
              value={item}
              onChange={(e) => handleChange(idx, e.target.value)}
              onBlur={handleBlur}
              placeholder={
                idx === 0
                  ? "Quiet time to focus on coding…"
                  : idx === 1
                  ? "A helpful article or lesson…"
                  : "A good cup of tea…"
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
