# Learning Arc

> A Personal Learning Operating System for self-directed learners.

Learning Arc turns daily study sessions into durable evidence of consistent practice, structured reflection, and long-term skill evolution.

---

## Why Learning Arc?

Conventional productivity applications focus on checking off temporary tasks and measuring raw hours. They treat all completed items identically and offer little guidance on long-term growth.

Learning Arc answers four fundamental questions for self-directed learners:
- **What am I trying to master?** (Long-term goal and mission)
- **What did I work on today?** (Intentional daily commitments and focus sessions)
- **What knowledge have I accumulated?** (Durable skill signals and sub-concepts)
- **Am I actually progressing?** (Timestamped evidence, reflections, and AI progression synthesis)

### The Learning Evidence Chain

```
INTENTION → COMMITMENT → FOCUS → REFLECTION → EVIDENCE → HISTORY → SKILL EVOLUTION
```

1. **Intention**: Establish today's primary focus direction.
2. **Commitment**: Define clear daily tasks with priority signals.
3. **Focus**: Execute structured, timestamp-backed Pomodoro sessions.
4. **Reflection**: Record candid learner notes and assess independence levels.
5. **Evidence**: Save immutable focus session records before marking task outcomes.
6. **History**: Maintain a year-based calendar of daily execution and rollover events.
7. **Skill Evolution**: Aggregate accumulated evidence into durable Core Skills and concept signals.

---

## Features

### Planning
- **Daily Intention & Current Mission**: Set today's single most critical focus direction and align with your primary goal.
- **Priority-Based Commitments**: Plan tasks with `High`, `Medium`, and `Normal` priority signals.
- **Carry-Forward Task Rollover**: Seamlessly carry unfinished commitments forward while preserving original planned dates and rollover provenance.
- **Plan → Focus Integration**: Launch focus sessions directly from tasks with pre-filled topics and linked task IDs.
- **Supporting Tools**: Hydration tracker (1–16 glasses), 365 offline study affirmations, and daily gratitude entries.

### Focus & Reflection
- **Structured Learning Modes**: Log sessions under `Learning`, `Practicing`, `Building`, `Reading`, `Revising`, or custom activities.
- **Precision Interval Controls**: Custom focus minutes, short breaks, long breaks, cycles, and auto-start next phase toggle.
- **Persistent Pomodoro Engine**: Timer state survives tab switching, navigation, and page refreshes.
- **Post-Session Reflection**: Capture learner notes and self-assess independence (`Guided`, `Assisted`, `Independent`, `Mastered`).

### Journey & Evidence Explorer
- **Year-Based Contribution Calendar**: 365-day heat map visualizing daily focus minutes across 5 intensity levels (calculating total accumulated daily focus up to 150m+).
- **Daily Execution Inspector**: Inspect any historical day to see daily commitments, completed tasks, carried-forward items, and linked focus evidence.
- **Interactive Split-View Skill Explorer**:
  - **Left Panel (Evidence Timeline)**: Chronological index of sessions supporting a skill, showing session dates, topics, and durations.
  - **Right Panel (Session Details)**: In-depth evidence view featuring past-tense mode badges (`Learned`, `Practiced`, `Built`, `Read`, `Revised`), learner reflections, AI summaries, and progression signals.

### AI Learning Intelligence
- **Core Skill & Concept Extraction**: Uses Google Gemini to extract durable Core Skills (e.g., `CSS`, `JavaScript`, `React`) and supporting sub-concepts (e.g., `CSS Grid`, `Flexbox`).
- **AI Synthesis Reviews**: On-demand interpretations analyzing learning patterns, focus balance, and progression signals.
- **Privacy Safeguards**: AI is invoked only on explicit user action; keys and private reflections remain safe.

### Public Learning Profile
- **One-Click Publishing**: Generate a verified, read-only public profile at `/p/[id]`.
- **Identical Skill Explorer & History**: Public profiles feature the exact same split-view Skill Explorer and Daily Execution calendar history.
- **Privacy First**: Private daily plan entries (hydration, gratitude, local keys) are strictly excluded from public snapshots.

---

## Application Screens

- **Home**: Daily command center displaying the Current Mission, quick metrics, active goal status, and a primary `Open Plan →` action.
- **Plan**: Daily planning workspace for managing commitments, unfinished task rollovers, hydration, gratitude, and study affirmations.
- **Focus**: Pomodoro setup and timer execution view with styled numeric interval controls and post-session reflection modals.
- **Journey**: Long-term contribution calendar, Daily Execution inspector, and interactive split-view Skill Evolution explorer.
- **Insights**: AI Learning Intelligence reports and deterministic mode balance breakdowns.
- **Proof**: Management interface for publishing, updating, and unpublishing read-only public learning profiles.
- **Settings**: Primary goal configuration, full JSON backup export/import with automatic schema migration, and workspace reset.

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Server & client rendering architecture |
| **UI Library** | React 19 | Core UI library |
| **Language** | TypeScript | Strict type safety across components, schemas, and API routes |
| **Styling** | Vanilla CSS | CSS variables, design tokens, light & dark theme support, glassmorphism |
| **Database** | Neon Serverless PostgreSQL | Durable storage for public profile snapshots (with local JSON file fallback) |
| **AI Integration** | Google Gemini AI (`@google/genai`) | Session intelligence, Core Skill extraction, and evidence synthesis |
| **Validation** | Zod | API request payload and data store schema validation |

---

## Project Philosophy

- **Evidence over Streaks**: Long-term capability is built through repeated focus evidence, not vanity metrics.
- **Learning over Productivity**: Focus on knowledge accumulation rather than checking off arbitrary tasks.
- **Reflection over Completion**: Candid notes capture genuine understanding and independence levels.
- **Durable Knowledge Growth**: Tasks are temporary; accumulated skill signals are permanent.

---

## Getting Started

### 1. Installation

```bash
git clone https://github.com/manu4712/Learning-arc.git
cd Learning-arc
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Optional: Google Gemini AI API Key for session analysis and insights
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite

# Optional: Neon PostgreSQL connection string for public profile publishing
# (If omitted, publishing automatically falls back to local JSON file storage)
DATABASE_URL=postgres://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Verification Commands

```bash
npm run typecheck   # Run TypeScript type checking
npm run lint        # Run ESLint checks
npm run build       # Build Next.js production bundle
```

---

## Folder Structure

```
learning-arc/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # Gemini AI analysis & skill extraction endpoint
│   │   └── publish/route.ts       # Public profile publish, update, and unpublish API
│   ├── p/
│   │   └── [id]/page.tsx          # Public read-only learning profile route
│   ├── globals.css                # Design system tokens, utilities, and component styles
│   ├── layout.tsx                 # Root application layout
│   └── page.tsx                   # Main entry point with PomodoroProvider wrapper
│
├── components/
│   ├── LearningArc.tsx            # Main shell & navigation router
│   ├── context/
│   │   └── PomodoroContext.tsx    # Persistent Pomodoro timer runtime provider
│   ├── layout/
│   │   ├── Header.tsx             # Sticky glassmorphic navigation header
│   │   └── ThemeToggle.tsx        # Dark / Light mode toggle
│   ├── today/
│   │   └── HomeView.tsx           # Home screen & Current Mission banner
│   ├── plan/
│   │   └── PlanView.tsx           # Daily planning workspace & commitment lists
│   ├── focus/
│   │   └── PomodoroView.tsx       # Focus setup, active timer, & reflection modals
│   ├── journey/
│   │   ├── JourneyView.tsx        # Journey view container
│   │   ├── SkillEvolutionSection.tsx # Shared interactive split-view Skill Explorer
│   │   └── YearlyContributionCalendar.tsx # 365-day calendar & Daily Execution inspector
│   ├── insights/
│   │   └── InsightsView.tsx       # AI Learning Intelligence & evidence balance
│   ├── proof/
│   │   ├── ProofView.tsx          # Public profile publishing setup & management
│   │   └── PublicProfileView.tsx  # Shared public profile renderer
│   └── settings/
│       └── SettingsView.tsx       # Goal configuration & JSON backup export/import
│
├── lib/
│   ├── data.ts                    # Store data models, statistics, and storage adapters
│   ├── skills.ts                  # Core Skill aggregation & concept normalization engine
│   ├── planning.ts                # Daily plan helpers & historical task mapping
│   ├── pomodoro.ts                # Timer calculations & state transitions
│   └── db.ts                      # Serverless Neon PostgreSQL adapter & local fallback
```

---

## Future Roadmap

Future refinements will be driven by real-world usage rather than feature bloat:
- **Advanced Evidence Search**: Full-text search across session topics and reflections.
- **Custom Tag Filtering**: Filter calendar and skill views by custom tags or activity modes.
- **Data Export Formats**: Additional export options (e.g., Markdown, CSV).
- **Performance Optimizations**: Further rendering and memoization enhancements for large multi-year datasets.

---

## Screenshots

*(Insert application screenshots or animated GIFs here)*

---

## License

This project is open source and available under the [MIT License](LICENSE).
