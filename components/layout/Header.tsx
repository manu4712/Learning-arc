"use client";

import React, { useState, useEffect } from "react";
import { usePomodoro } from "@/components/context/PomodoroContext";
import ThemeToggle from "./ThemeToggle";
import { Goal } from "@/lib/data";

type Screen = "today" | "plan" | "focus" | "journey" | "insights" | "proof" | "settings";

type HeaderProps = {
  activeScreen: Screen;
  onSelectScreen: (screen: Screen) => void;
  goal?: Goal;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
};

export default function Header({
  activeScreen,
  onSelectScreen,
  goal,
  menuOpen,
  setMenuOpen,
}: HeaderProps) {
  const { state: pomodoroState, remainingMs } = usePomodoro();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrolled((prev) => {
        if (!prev && current > 32) return true;
        if (prev && current < 12) return false;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minsStr = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secsStr = String(totalSeconds % 60).padStart(2, "0");

  const isTimerActive =
    pomodoroState.phase === "focus" ||
    pomodoroState.phase === "short" ||
    pomodoroState.phase === "long";

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <button
        className="brand"
        onClick={() => {
          onSelectScreen("today");
          setMenuOpen(false);
        }}
        aria-label="Learning Arc home"
      >
        <span className="brand-symbol">↗</span> Learning Arc
      </button>

      {/* Active Persistent Timer Pill */}
      {isTimerActive && (
        <button
          className={`active-timer-indicator ${pomodoroState.isPaused ? "paused" : ""}`}
          onClick={() => {
            onSelectScreen("focus");
            setMenuOpen(false);
          }}
          title="Click to return to active Focus timer"
        >
          <span className="pulse-dot" />
          <span className="timer-pill-text">
            {pomodoroState.isPaused
              ? `Paused • ${pomodoroState.phase === "focus" ? "Focus" : "Break"}`
              : `${minsStr}:${secsStr} ${pomodoroState.phase === "focus" ? "Focus" : "Break"}`}
            {pomodoroState.topic ? ` (${pomodoroState.topic})` : ""}
          </span>
        </button>
      )}

      <button
        className="menu-toggle"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label="Toggle navigation menu"
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`main-nav ${menuOpen ? "nav-open" : ""}`}>
        {(["today", "plan", "focus", "journey", "insights", "proof", "settings"] as Screen[]).map((scr) => (
          <button
            key={scr}
            onClick={() => {
              onSelectScreen(scr);
              setMenuOpen(false);
            }}
            className={`nav-link ${activeScreen === scr ? "active" : ""}`}
          >
            {scr}
          </button>
        ))}
      </nav>

      <div className="header-utilities">
        {goal && (
          <button
            className="goal-chip"
            onClick={() => {
              onSelectScreen("settings");
              setMenuOpen(false);
            }}
            title={goal.title}
          >
            {goal.title}
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
