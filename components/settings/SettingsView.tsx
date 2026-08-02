"use client";

import React, { useRef } from "react";
import { Store, MultiGoalStore, DailyTask, validateImport, EMPTY } from "@/lib/data";

type SettingsViewProps = {
  store: Store;
  onUpdateStore: (patch: Partial<Store>) => void;
  onEditGoal: () => void;
};

export default function SettingsView({ store, onUpdateStore, onEditGoal }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonStr = JSON.stringify(store, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = (store.goal?.title || "goal").toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15);
    a.download = `learning-arc-${safeTitle}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!validateImport(parsed)) {
          throw new Error("Invalid schema");
        }
        if (confirm("Replace active learning arc with this imported backup?")) {
          if ("goals" in parsed && typeof (parsed as MultiGoalStore).goals === "object") {
            const multi = parsed as MultiGoalStore;
            const activeId = multi.activeGoalId || Object.keys(multi.goals)[0];
            const targetGoal = multi.goals[activeId];
            if (targetGoal) {
              const rawTasks = Array.isArray(targetGoal.tasks) ? targetGoal.tasks : [];
              const cleanTasks = rawTasks.filter((t: DailyTask) => t && t.status !== "archived");
              onUpdateStore({ ...targetGoal, tasks: cleanTasks });
            }
          } else {
            const singleStore = parsed as Store;
            const rawTasks = Array.isArray(singleStore.tasks) ? singleStore.tasks : [];
            const cleanTasks = rawTasks.filter((t: DailyTask) => t && t.status !== "archived");
            onUpdateStore({ ...singleStore, tasks: cleanTasks });
          }
        }
      } catch {
        alert("This file is not a valid Learning Arc backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to clear data for this active learning goal? This cannot be undone.")) {
      onUpdateStore(EMPTY);
    }
  };

  return (
    <div className="settings-container">
      <div className="page-head">
        <div>
          <span className="eyebrow">PREFERENCES & DATA MANAGEMENT</span>
          <h1 className="page-title">Application Settings</h1>
          <p className="page-desc">
            Learning Arc stores working data locally on your device. Export regularly for safe backup backups.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Goal Direction Card */}
        <section className="panel settings-card">
          <span className="eyebrow">LEARNING DIRECTION</span>
          <h2>Goal & Target Horizon</h2>
          <div className="setting-info-box">
            <strong>{store.goal?.title || "No goal set"}</strong>
            {store.goal?.duration && <span className="horizon-badge">Horizon: {store.goal.duration}</span>}
            {store.goal?.description && <p className="goal-desc">{store.goal.description}</p>}
          </div>
          <button type="button" className="secondary action-btn" onClick={onEditGoal}>
            Edit Goal Direction
          </button>
        </section>

        {/* Data & Backup Card */}
        <section className="panel settings-card">
          <span className="eyebrow">DATA OWNERSHIP</span>
          <h2>Backup & Restore</h2>
          <p>Export your full history, reflections, skills, and AI analysis reports as a JSON backup.</p>
          
          <div className="settings-actions-group">
            <button type="button" className="primary action-btn" onClick={handleExport}>
              Export Backup JSON
            </button>

            {/* Custom Styled Import Button Wrapping Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden-file-input"
              accept="application/json"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
            <button
              type="button"
              className="secondary action-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Backup File
            </button>
          </div>
        </section>

        {/* Danger Zone Card */}
        <section className="panel settings-card danger-card">
          <span className="eyebrow danger">DANGER ZONE</span>
          <h2>Reset Local Storage</h2>
          <p>Permanently clears your learning journey data from this browser&apos;s local storage.</p>
          <button type="button" className="text danger action-btn" onClick={handleResetData}>
            Reset All Local Data
          </button>
        </section>
      </div>
    </div>
  );
}
