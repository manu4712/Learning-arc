# Learning Arc v2 — Product Evolution

Learning platforms track what you completed; productivity apps track time. **Learning Arc** helps a self-learner understand how they are growing from guided consumption toward independent application.

Learning Arc v2 evolves the application into a reliable, modern, local-first learning productivity product with a shareable read-only public proof system and a refined visual identity.

---

## Core Product Loop

```
DECLARE  →  FOCUS  →  PROVE  →  GROW
```

1. **DECLARE**: Set a goal direction and target horizon.
2. **FOCUS**: Execute structured focus cycles with persistent timestamp-based timing.
3. **PROVE**: Capture candid learning reflections, Web Speech dictation, and evidence.
4. **GROW**: Track calendar streaks, skill evolution, deterministic metrics, AI Learning Intelligence, and shareable public profile proof.

---

## What's New in Learning Arc v2

- **Persistent Application-Level Pomodoro Engine**: Timer state lives in `PomodoroContext` and persists to `localStorage` (`learning-arc-pomodoro-v1`). Active focus sessions survive internal tab navigation, tab backgrounding, browser throttling, and page refreshes.
- **Skip Break Capability**: Skip 5-minute short breaks or 15-minute long breaks instantly. Focus sessions cannot be skipped.
- **Intuitive Calendar Day Streaks**: Streaks are calculated using local calendar days (`YYYY-MM-DD`). Streaks remain active today if yesterday had completed study sessions. Distinguishes **Current Streak** and **Longest Streak**.
- **Gemini 3.1 Flash Lite Migration**: Default AI model updated to `gemini-3.1-flash-lite` with environment variable configuration (`GEMINI_MODEL`).
- **Shareable Read-Only Public Profiles (`/p/[id]`)**: Users can explicitly publish sanitized snapshots of their learning journey. Visitors view a read-only profile without requiring an account.
- **Lightweight Ownership Security**: Management tokens stored on the user's device allow updating or unpublishing profiles without requiring complex authentication platforms.
- **Neon PostgreSQL Production Adapter**: Serverless Neon PostgreSQL database integration (`@neondatabase/serverless`) for production public profile persistence, with safe local filesystem fallback for offline development.
- **Kinetic Precision Design System**: Built with modern typography (`Hanken Grotesk` & `JetBrains Mono`), tabular timer typography, subtle micro-interactions, and mobile responsiveness down to 360px.

---

## Architecture

Next.js App Router + TypeScript + browser `localStorage` + Serverless Neon PostgreSQL / Local Fallback.

```
app/
├── api/
│   ├── analyze/route.ts     # Gemini 3.1 Flash Lite boundary (rate-limited, Zod-validated)
│   └── publish/route.ts     # Public snapshot publish, update, and unpublish API
├── p/
│   └── [id]/page.tsx        # Read-only public shareable learning journey profile
├── globals.css              # Design tokens, Light & Dark theme systems
├── layout.tsx               # Root layout
└── page.tsx                 # App root wrapped in PomodoroProvider

lib/
├── data.ts                  # Store schema, stats calculations, 30-day demo seed
├── pomodoro.ts              # Timestamp timing math & Pomodoro state machine
├── streak.ts                # Local calendar day streak semantics & longest streak logic
└── db.ts                    # Serverless Neon Postgres database adapter with local fallback
```

---

## Local Development Setup

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/manu4712/Learning-arc.git
   cd Learning-arc
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   copy .env.example .env.local
   ```
   Add your Gemini API key to `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.1-flash-lite
   DATABASE_URL=  # Optional for local dev; local filesystem fallback is included
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Verify TypeScript & Production Build**:
   ```bash
   npm run typecheck
   npm run build
   ```

---

## Production Deployment Setup (Neon PostgreSQL + Vercel)

Production public profiles require durable PostgreSQL database storage. We use **Neon Free Tier PostgreSQL**.

### Step-by-Step Setup:

1. **Create a Free Neon PostgreSQL Project**:
   - Sign up / log in to [Neon.tech](https://neon.tech).
   - Create a new PostgreSQL project (e.g. `learning-arc-db`).
   - Copy the PostgreSQL connection string (`DATABASE_URL`).
     Example: `postgres://user:password@ep-sample-123.us-east-2.aws.neon.tech/neondb?sslmode=require`

2. **Configure Vercel Environment Variables**:
   - Push your repository to GitHub and import the project in Vercel.
   - In Vercel Project Settings → **Environment Variables**, add:
     - `DATABASE_URL` = `<Neon PostgreSQL connection string>`
     - `GEMINI_API_KEY` = `<Your Google Gemini API key>`
     - `GEMINI_MODEL` = `gemini-3.1-flash-lite`
   - Apply variables to **Production**, **Preview**, and **Development**.

3. **Automatic Table Initialization**:
   - The database adapter automatically initializes the required table on first publish:
     ```sql
     CREATE TABLE IF NOT EXISTS public_profiles (
       id TEXT PRIMARY KEY,
       management_token TEXT NOT NULL,
       published_at TEXT NOT NULL,
       updated_at TEXT NOT NULL,
       data JSONB NOT NULL
     );
     ```

4. **Deploy & Verify Production Public Sharing**:
   - Deploy to Vercel.
   - Open your deployed application URL.
   - Click **Publish Learning Journey**.
   - Copy the public URL (`/p/<public-id>`) and open it in an **Incognito / Private browser tab**.
   - Verify the profile loads without login or authentication.
   - Verify **Update Snapshot** and **Unpublish** controls work cleanly using the owner management token.

---

## Privacy & Local-First Philosophy

- **Local First**: Private working data lives inside the browser's `localStorage` (`learning-arc-v1`).
- **Explicit Publishing**: Data is **never** uploaded automatically. Public snapshot generation occurs only when the user explicitly clicks **Publish Learning Journey**.
- **Sanitized Snapshots**: Public snapshots include only non-sensitive evidence (topic, reflection, duration, skills, AI summaries). Private keys, environment variables, and local management tokens are never exposed.
