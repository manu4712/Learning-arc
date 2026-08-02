"use client";

import React, { useState, useRef, useEffect } from "react";
import { MultiGoalStore } from "@/lib/data";

type GoalSelectorProps = {
  multiStore: MultiGoalStore;
  onSelectGoal: (goalId: string) => void;
  onCreateGoal: () => void;
  onManageGoals: () => void;
};

export default function GoalSelector({
  multiStore,
  onSelectGoal,
  onCreateGoal,
  onManageGoals,
}: GoalSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const activeGoalStore = multiStore.goals[multiStore.activeGoalId];
  const activeTitle = activeGoalStore?.goal?.title || "Select Goal";

  // Filter non-archived goals for selector
  const activeGoalsList = Object.values(multiStore.goals).filter(
    (g) => !g.archivedAt || g.id === multiStore.activeGoalId
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="goal-selector-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`goal-chip-dropdown ${open ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        title={`Active Goal: ${activeTitle}`}
        aria-expanded={open}
        aria-label="Switch active goal"
      >
        <span className="goal-title-text">{activeTitle}</span>
        <span className="goal-dropdown-arrow">▼</span>
      </button>

      {open && (
        <div className="goal-dropdown-menu" role="menu">
          <div className="goal-dropdown-header">ACTIVE LEARNING GOAL</div>

          <div className="goal-dropdown-list">
            {activeGoalsList.map((g) => {
              const isSelected = g.id === multiStore.activeGoalId;
              const title = g.goal?.title || "Untitled Goal";
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`goal-dropdown-item ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    onSelectGoal(g.id);
                    setOpen(false);
                  }}
                  role="menuitem"
                >
                  <span className="goal-check">{isSelected ? "✓" : ""}</span>
                  <span className="goal-item-title">{title}</span>
                </button>
              );
            })}
          </div>

          <hr className="goal-dropdown-divider" />

          <button
            type="button"
            className="goal-dropdown-action"
            onClick={() => {
              setOpen(false);
              onCreateGoal();
            }}
            role="menuitem"
          >
            <span className="action-icon">+</span> Create New Goal
          </button>

          <button
            type="button"
            className="goal-dropdown-action"
            onClick={() => {
              setOpen(false);
              onManageGoals();
            }}
            role="menuitem"
          >
            <span className="action-icon">⚙</span> Manage Goals
          </button>
        </div>
      )}
    </div>
  );
}
