"use client";

import React from "react";
import { getDailyAffirmation } from "@/lib/affirmations";

type AffirmationCardProps = {
  dateStr?: string;
};

export default function AffirmationCard({ dateStr }: AffirmationCardProps) {
  const affirmation = getDailyAffirmation(dateStr);

  return (
    <div className="panel affirmation-card">
      <span className="eyebrow">DAILY AFFIRMATION</span>
      <h2>Mindset & Rigor</h2>
      <p className="affirmation-quote">“{affirmation}”</p>
    </div>
  );
}
