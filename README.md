# Learning Arc v3

Learning platforms track what you completed; traditional productivity apps track time. **Learning Arc** is a local-first, evidence-backed personal learning productivity system designed to help self-learners turn focused daily effort into authentic, independent capability over years.

Learning Arc v3 connects daily intention and planning directly to focused execution, candid post-focus learner reflection, lifetime year-based contribution history, and shareable public proof.

---

## Table of Contents

- [Core Philosophy](#core-philosophy)
- [Plan → Focus → Reflection → Journey Workflow](#plan--focus--reflection--journey-workflow)
- [Core Features](#core-features)
  - [Today](#1-today)
  - [Plan](#2-plan)
  - [Focus](#3-focus)
  - [Reflection](#4-reflection)
  - [Journey](#5-journey)
  - [Insights](#6-insights)
  - [Proof / Public Profile](#7-proof--public-profile)
  - [Settings](#8-settings)
- [Data & Privacy Architecture](#data--privacy-architecture)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Data Model Overview](#data-model-overview)
- [Product Principles](#product-principles)
- [Responsive Design & Accessibility](#responsive-design--accessibility)

---

## Core Philosophy

Traditional productivity software treats all completed items identically. Learning Arc introduces a deliberate evidence chain:

```
INTENTION → COMMITMENT → FOCUS → REFLECTION → EVIDENCE → EXECUTION HISTORY → INSIGHT
```

1. **Intention**: Define what matters most today.
2. **Commitment**: Select specific, prioritized daily commitments.
3. **Focus**: Execute structured, timestamp-backed focus sessions.
4. **Reflection**: Record candid learner notes and assess independence levels.
5. **Evidence**: Preserve immutable focus session evidence before deciding task outcomes.
6. **Execution History**: Maintain a lifetime year-based calendar of daily commitments and focus evidence.
7. **Insight**: Translate accumulated evidence into skill evolution matrix signals without artificial scores.

---

## Plan → Focus → Reflection → Journey Workflow

```
┌─────────────────┐
│   Create Task   │  (Plan: Title + Priority: Normal / Medium / High)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click Focus →   │  (Task title prefills Focus topic; taskId attached)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Configure Focus │  (Select mode: Learning/Practicing/Building, durations, cycles)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Complete Round │  (PomodoroContext owns persistent timer runtime)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Reflect Notes   │  (Capture learner reflection & independence level)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Evidence   │  (Session evidence saved FIRST to local storage)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Task Outcome    │  (Mark Task Complete  OR  Continue Later)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Journey History │  (Selected-day displays DAILY EXECUTION + LEARNING EVIDENCE)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Skill Insights  │  (Aggregates accumulated evidence into skill evolution matrix)
└─────────────────┘
```

---

## Core Features

### 1. Today
- **Daily Command Center**: High-level overview of active goal direction, current local date, and quick metrics.
- **Quick Action Triggers**: Immediate single-click navigation to `Plan` or `Focus`.

### 2. Plan
- **Daily Intention**: Set today's single most critical focus direction (*"What matters most today?"*).
- **Simplified Task Creation**: Create task commitments asking ONLY for **Task Title** and **Priority** (`Normal`, `Medium`, `High`).
- **Grouped Commitment Views**: Organizes tasks into `PLANNED`, `IN PROGRESS`, and `COMPLETED` sections. Limits completed view to 4 items with an expandable `Show X more ↓` toggle.
- **Plan → Focus Integration**: Clicking `Focus →` prefills `Topic = Task Title` in Focus Setup while preserving `taskId`.
- **Continue Focus for Existing Tasks**: Click `Continue Focus →` on an in-progress task to launch additional focus rounds. Accumulated focus time (`1h 40m · 2 sessions`) updates dynamically without task duplication.
- **Manual Completion**: Check off commitments completed outside focus sessions (`Completed manually`).
- **Permanent Task Deletion**: Click `✕` to open a styled confirmation modal. Deleting a task permanently removes the task commitment while **100% preserving linked Session evidence** in Journey.
- **Unfinished-Task Rollover**: Compact review banner for past unfinished commitments with explicit choices (`Move to Today`, `Leave Unfinished`, `Delete`). Moving to today preserves original planned dates and rollover history.
- **Customizable Hydration Goal**: Compact goal stepper supporting any target from **1 to 16 glasses**. Automatically pads or truncates boolean arrays while preserving active toggle states.
- **Independent Hydration Toggles**: Independent glass controls (`Active / Goal glasses`). Toggling glass #N alters ONLY index N.
- **365 Deterministic Study Affirmations**: Built-in collection of grounded, hard-hitting affirmations selected deterministically by day-of-year. Operates completely offline with zero API calls.
- **Daily Gratitude**: Three private daily reflection entries.

### 3. Focus
- **Structured Modes**: Choose between `Learning`, `Practicing`, `Building`, `Reading`, `Revising`, or `Other` custom activities.
- **Timer Configuration**: Customize focus duration (default 25m), short break (5m), long break (15m), cycle count (4), and auto-start.
- **Persistent Pomodoro Engine**: Timer state resides in `PomodoroContext` and persists to `localStorage` (`learning-arc-pomodoro-v1`). Active rounds survive internal screen navigation, tab switching, backgrounding, and page refreshes.
- **Runtime Controls**: Pause, resume, and skip short/long breaks. Focus sessions cannot be skipped.

### 4. Reflection
- **Post-Focus Capture**: Record candid learner notes and self-assess independence (`Guided`, `Assisted`, `Independent`, `Mastered`).
- **Evidence-First Preservation**: Session evidence is saved **FIRST** to storage before prompting for task outcome.
- **Task Outcome Flow**: After a task-linked session, select *Mark Task Complete* or *Continue Later*.

### 5. Journey
- **Lifetime Year-Based Calendar**: Full 365-day (or 366-day leap year) contribution calendar. Includes a dynamic year selector for any year containing recorded sessions.
- **Monochrome Activity Intensity**: Visually represents daily focus minutes across 5 intensity levels (`0m`, `1-45m`, `46-90m`, `91-150m`, `150m+`).
- **Selected-Day Execution & Evidence**: Clicking any calendar date inspects that historical day:
  1. **DAILY EXECUTION**: Displays historical Intention and task commitments summary (`✓ Completed`, `Completed manually`, `↗ Carried forward`, `○ Left unfinished`, `Originally planned date`).
  2. **LEARNING EVIDENCE**: Displays completed focus session topics, learner reflections, independence levels, duration, and AI analysis.
- **Private Data Exclusions**: Private Plan details (hydration and gratitude) are excluded from Journey to preserve personal privacy.
- **Streak & Yearly Stats**: Computes calendar streaks, active days count, total focused hours, and longest streak.

### 6. Insights
- **Skill Evolution Matrix**: Group session topics and AI-extracted skill signals into evolutionary stages (`Learned`, `Practiced`, `Applied`).
- **Intention vs. Execution Signals**: Factual execution metrics comparing completed planned tasks against total planned commitments.
- **AI Learning Intelligence**: Optional automated summaries analyzing progression signals and focus patterns.

### 7. Proof / Public Profile
- **Shareable Read-Only Snapshots**: Publish a public learning profile to `/p/[id]` without requiring account creation.
- **Sanitized Public Data**: Published profiles include public journey evidence, year-based calendar, selected-day session evidence, and skill evolution matrix. **Private Plan data (hydration, gratitude, local management tokens) is strictly excluded.**
- **Management Token Security**: Lightweight owner token stored locally permits updating snapshot content or unpublishing profiles at any time.

### 8. Settings
- **Goal Management**: Define primary learning goal title, description, target horizon, and key milestones.
- **Backup & Export**: Download a full JSON backup of your local learning store (`learning-arc-v1`).
- **Restore & Import**: Import an existing backup JSON file with automatic schema migration and archived task stripping.
- **Data Reset**: Reset local workspace data safely.

---

## Data & Privacy Architecture

- **Local-First Ownership**: All personal working data (tasks, daily plans, hydration, gratitude, focus sessions, goals) is stored locally in browser `localStorage` under `learning-arc-v1`.
- **Durable Snapshot Storage**: Public profiles published via `/p/[id]` are stored in a serverless **Neon PostgreSQL** database (`public_profiles` table). If `DATABASE_URL` is omitted during local development, a local JSON store fallback is used automatically.
- **Strict Privacy Boundaries**: Private productivity tracking (hydration, gratitude, local management keys) is never sent to PostgreSQL or included in public snapshots.
- **Pure Learning Streaks**: Learning streaks are computed **EXCLUSIVELY** from completed focus sessions. Hydration tracking, gratitude entries, affirmations, and manual task check-offs do not inflate learning streak calculations.

---

## Tech Stack

Derived directly from `package.json`:

| Layer | Technology | Version / Package |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | `16.2.10` / `latest` |
| **Core Library** | React & React DOM | `19` / `latest` |
| **Language** | TypeScript | `^5.0.0` / `latest` |
| **Styling** | Vanilla CSS (CSS Variables, Light & Dark Tokens) | Standard CSS3 |
| **Database (Production)** | Neon Serverless PostgreSQL | `@neondatabase/serverless ^1.1.0` |
| **AI Integration** | Google Gemini AI SDK | `@google/genai` (`gemini-3.1-flash-lite`) |
| **Schema Validation** | Zod | `zod ^3.0.0` / `latest` |
| **Code Quality** | ESLint & TypeScript Compiler | `eslint`, `tsc --noEmit` |

---

## Project Architecture

```
learning-arc/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # Gemini AI session analysis endpoint (Zod validated)
│   │   └── publish/route.ts       # Public profile publish, update, and unpublish API
│   ├── p/
│   │   └── [id]/page.tsx          # Read-only public shareable profile view
│   ├── globals.css                # Global design system, tokens, theme systems, & navbar scroll rules
│   ├── layout.tsx                 # Root layout with fonts & metadata
│   └── page.tsx                   # Main application entry point wrapped in PomodoroProvider
│
├── components/
│   ├── LearningArc.tsx            # Primary application shell & tab routing
│   ├── context/
│   │   └── PomodoroContext.tsx    # Persistent timer state provider & runtime engine
│   ├── layout/
│   │   ├── Header.tsx             # MasterJi-inspired floating scroll navbar
│   │   └── ThemeToggle.tsx        # Dark / Light theme toggle
│   ├── today/
│   │   └── TodayView.tsx          # Daily command center overview
│   ├── plan/
│   │   ├── PlanView.tsx           # Daily planning workspace container
│   │   ├── TaskList.tsx           # Grouped commitment lists (PLANNED, IN PROGRESS, COMPLETED)
│   │   ├── TaskItem.tsx           # Individual commitment card
│   │   ├── TaskEditor.tsx         # Task creation / editing modal (Title + Priority)
│   │   ├── HydrationTracker.tsx   # Customizable 1–16 hydration tracker with independent toggles
│   │   ├── AffirmationCard.tsx    # 365 deterministic study affirmation card
│   │   ├── GratitudeCard.tsx      # Daily gratitude entries card
│   │   ├── RolloverPrompt.tsx     # Past unfinished commitments review banner & modal
│   │   ├── DailySummary.tsx       # Factual metrics summary row
│   │   └── DailyIntention.tsx     # Main daily focus intention card
│   ├── focus/
│   │   └── PomodoroView.tsx       # Pomodoro focus session setup, timer, & controls
│   ├── reflection/
│   │   ├── ReflectionModal.tsx    # Post-session learner reflection & independence capture
│   │   └── TaskOutcomeModal.tsx   # Post-reflection task outcome prompt
│   ├── journey/
│   │   ├── JourneyView.tsx        # Journey view container & skill evolution section
│   │   └── YearlyContributionCalendar.tsx # Full-year calendar grid & DAILY EXECUTION inspector
│   ├── insights/
│   │   └── InsightsView.tsx       # Skill evolution matrix & planning vs execution intelligence
│   ├── proof/
│   │   └── ProofView.tsx          # Public profile publishing & management interface
│   └── settings/
│       └── SettingsView.tsx       # Goal configuration, backup export/import, data reset
│
├── lib/
│   ├── data.ts                    # Core data types, storage load/save, streak math, year calculations
│   ├── planning.ts                # Daily plan helpers, dynamic hydration normalization (1..16)
│   ├── pomodoro.ts                # Timestamp-based timer calculations & state machine
│   ├── affirmations.ts            # 365 built-in deterministic study affirmations
│   └── db.ts                      # Serverless Neon PostgreSQL database adapter with local fallback
```

---

## Local Development

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/manu4712/Learning-arc.git
cd Learning-arc
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Configure `.env.local`:

```env
# Google Gemini AI Configuration (Optional for AI session analysis)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite

# Database Connection (Optional for local dev; local filesystem fallback is used automatically)
DATABASE_URL=postgres://user:password@ep-sample-project-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

- **Local Development**: Works completely offline. If `DATABASE_URL` is omitted, public profile publishing falls back safely to a local JSON file store (`.data/public_profiles.json`).
- **AI Analysis**: If `GEMINI_API_KEY` is omitted, session reflection saving remains fully functional while AI analysis returns a graceful fallback.

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Code Quality & Type Checks

```bash
npm run typecheck   # Run TypeScript compiler verification
npm run lint        # Run ESLint validation
npm run build       # Run Next.js production build verification
```

---

## Production Deployment

Learning Arc v3 is designed for deployment on **Vercel** with a serverless **Neon PostgreSQL** database.

### Step-by-Step Production Setup:

1. **Create Neon PostgreSQL Database**:
   - Create a project on [Neon.tech](https://neon.tech).
   - Copy the PostgreSQL connection string (`DATABASE_URL`).

2. **Deploy on Vercel**:
   - Push your repository to GitHub and import it into Vercel.
   - In Vercel Project Settings → **Environment Variables**, add:
     - `DATABASE_URL` = `<Neon PostgreSQL connection string>`
     - `GEMINI_API_KEY` = `<Your Google Gemini API Key>`
     - `GEMINI_MODEL` = `gemini-3.1-flash-lite`

3. **Automatic Table Creation**:
   - The Neon database adapter automatically initializes the required `public_profiles` table on first profile publish:
     ```sql
     CREATE TABLE IF NOT EXISTS public_profiles (
       id TEXT PRIMARY KEY,
       management_token TEXT NOT NULL,
       published_at TEXT NOT NULL,
       updated_at TEXT NOT NULL,
       data JSONB NOT NULL
     );
     ```

---

## Data Model Overview

```ts
// Daily Commitment Task
export type DailyTask = {
  id: string;
  date: string;                  // Scheduled local YYYY-MM-DD
  originalPlannedDate?: string;  // Original planned local YYYY-MM-DD
  title: string;
  priority: "high" | "medium" | "normal";
  status: "planned" | "in_progress" | "completed";
  createdAt: string;
  completedAt?: string;
  completedManually?: boolean;
  linkedSessionIds: string[];
  carriedFromDate?: string;
  rolloverCount?: number;
  rolloverHistory?: string[];
};

// Daily Plan Workspace
export type DailyPlan = {
  date: string;                  // Local YYYY-MM-DD
  intention?: string;
  gratitude: string[];           // Max 3 private entries
  waterGlasses?: boolean[];      // Independent boolean toggles for configured goal (1..16)
  waterGoal?: number;            // Configured hydration target (default 8)
};

// Completed Focus Session Evidence
export type Session = {
  id: string;
  startedAt: string;
  completedAt: string;
  duration: number;              // Duration in minutes
  mode: "Learning" | "Practicing" | "Building" | "Reading" | "Revising" | "Other";
  customActivity?: string;
  topic: string;
  intent?: string;
  reflection?: string;
  independence?: "Guided" | "Assisted" | "Independent" | "Mastered";
  taskId?: string;               // Linked DailyTask provenance
  analysis?: {
    summary: string;
    skills: string[];
    progression: string;
  };
};
```

---

## Product Principles

- **Plan decides WHAT — Focus decides HOW**: Planning establishes task commitments; Focus controls execution mode, duration, and cycle structure.
- **Reflection records reality**: Candid learner notes capture genuine understanding and independence levels.
- **Journey preserves evidence**: Lifetime history records authentic daily execution and focus evidence over years.
- **Insights interpret accumulated evidence**: Skill matrix evolution reflects repeated effort rather than vanity metrics.
- **Streaks reward real learning**: Only completed focus sessions count toward streak progression.
- **Private productivity stays private**: Hydration, gratitude, and personal management keys remain strictly local to your device.

---

## Responsive Design & Accessibility

- **Theme Support**: Seamless Dark Mode and Light Mode with tailored HSL tokens.
- **Floating Desktop Navbar**: Features a MasterJi-inspired floating scroll navbar (`.site-header.scrolled`) that smoothly transitions into a compact rounded surface (`border-radius: 20px`) with 100% solid background opacity (`background: var(--paper)`), preventing page text bleed-through.
- **Mobile Responsive Layout**: Adaptive layout supporting screen widths down to 360px without horizontal document overflow.
- **Accessibility**: Includes full keyboard navigation, `aria-label` tags, tabular timer numerals (`font-variant-numeric: tabular-nums`), and `prefers-reduced-motion: reduce` transition safeguards.
