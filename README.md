# Learning Arc

Learning platforms track what you completed; productivity apps track time. **Learning Arc** helps a self-learner understand how they are growing from guided consumption toward independent application.

## What it does

- Zero-signup, local-first goal setting and focus sessions
- Timestamp-based timer that remains accurate across inactive tabs
- Reflection + optional server-side Gemini interpretation with validated structured output
- GitHub-inspired learning journey, learning-mode balance, skill evolution, and day evidence
- Intentional Learning Intelligence review: local deterministic metrics plus AI interpretation
- Proof of Learning print/share view, JSON export/import, reset, and a confirmation-gated demo seed
- Graceful AI outage experience: sessions and analytics work without Gemini

## Architecture

Next.js App Router + TypeScript + browser localStorage. The browser owns the versioned journey record. `app/api/analyze/route.ts` is the only Gemini boundary; `GEMINI_API_KEY` stays server-side. It limits payload length through Zod, validates model results, rate-limits requests in memory, and tells the model to treat reflections as untrusted data.

## Run locally

```bash
npm install
copy .env.example .env.local
# Add your Gemini API key to .env.local
npm run dev
```

`GEMINI_API_KEY` is optional for the rest of the experience; without it, AI interpretation shows a friendly retry state. Never commit `.env.local`.

## Demo

Open **Settings & Data → Load demo journey**, confirm, then show Journey, Learning Intelligence, and Proof of Learning. The seed is deterministic and does not spend API quota.

## Privacy & limitations

Data is stored only in the current browser until exported. AI requests send only the specific, user-initiated learning evidence required for interpretation. There is no cross-device sync or public share link in this hackathon MVP; use Export for backup.

## Hackathon alignment

The distinctive idea is evidence-based **learning progression**, not a timer or generic AI chat. AI adds value by interpreting reflection and the transition between guided learning, practice, and application; deterministic analytics provide the factual substrate. The result is demoable in three minutes with no account or API dependency thanks to demo data and local analytics.
