# Learning Arc

Learning platforms track what you complete. Productivity apps track how long you work. **Learning Arc turns focused learning into visible evidence of growth.**

It helps self-learners see how they are progressing from guided consumption toward practice and independent application—whether they are learning to code, improving their English, preparing for an exam, or developing any new skill.

## What it does

- Zero-signup, local-first learning journey
- Goal setting with flexible 30, 90, 180, or custom-day timelines
- Pomodoro focus system with manual or automatic phase transitions
- Accurate focus-time tracking across inactive browser tabs
- Session reflection that records what was learned, difficulties, and learning independence
- Optional server-side Gemini analysis that summarizes evidence and extracts demonstrated skills
- GitHub-inspired contribution graph showing learning consistency and focus intensity
- Skill Evolution that builds from analyzed learning evidence over time
- Day-by-day learning evidence and learning-mode balance
- Learning Intelligence that combines deterministic local metrics with intentional AI interpretation
- Proof of Learning view with print/PDF support
- JSON export/import for portable local backups
- Dark and light themes with responsive desktop and mobile navigation
- A realistic 30-day demo journey for quickly exploring the complete product
- Graceful AI failure handling—focus sessions, evidence, journeys, and local analytics continue working without Gemini

## How it works

**DECLARE → FOCUS → PROVE → GROW**

1. **Declare** a learning goal and timeline.
2. **Focus** through structured learning sessions.
3. **Prove** what you actually learned through reflection and evidence.
4. **Grow** by seeing your consistency, evolving skills, learning patterns, and progression over time.

## Architecture

Learning Arc is built with **Next.js App Router and TypeScript**.

The learning journey is stored locally in the browser using `localStorage`, so no account is required.

`app/api/analyze/route.ts` is the only Gemini boundary. `GEMINI_API_KEY` remains server-side. The API validates input and structured model output with Zod, normalizes model responses to safe limits, applies basic in-memory rate limiting, and instructs the model to treat user reflections as untrusted data.

AI is intentionally user-triggered rather than constantly running in the background.

## Run locally

Install dependencies:

```bash
npm install
```

Copy the environment example:

```bash
copy .env.example .env.local
```

Add your Gemini API key to `.env.local`:

```text
GEMINI_API_KEY=your_key_here
```

Then run:

```bash
npm run dev
```

The Gemini API key is optional for the core local experience. Without it, AI-powered interpretation will be unavailable, but focus tracking, saved evidence, the learning journey, and deterministic analytics continue to work.

Never commit `.env.local`.

## Demo

For the fastest product walkthrough:

1. Open **Settings & Data**.
2. Select **Load demo journey** and confirm.
3. Explore the **30-day English-learning journey**.
4. Open **Journey** to see contribution history, daily evidence, and Skill Evolution.
5. Open **Learning Intelligence** to see evidence-based interpretation.
6. Open **Proof** to see the accumulated Proof of Learning.

The demo journey is generated locally and does not require API quota to load.

## Privacy & Limitations

Learning data is stored in the current browser until the user exports it.

AI requests are made only when the user explicitly requests analysis and contain the learning evidence required for that interpretation.

This hackathon MVP currently has:

- No account system
- No cross-device synchronization
- No public social profiles or community layer
- No permanent cloud storage for learning records

Users can export their journey as JSON for backup and import it later.

## Why Learning Arc?

The core idea is not another Pomodoro timer or generic AI chatbot.

Learning Arc treats **learning itself as something that can accumulate visible evidence**.

Individual focus sessions become reflections. Reflections become structured evidence. Evidence reveals skills and patterns. Over time, those signals become a visible learning journey and a personal Proof of Learning.

**Learning Arc turns the time you spend learning into visible evidence of how far you've actually grown.**
