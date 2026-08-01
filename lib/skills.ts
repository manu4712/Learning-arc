import { Session } from "./data";

export type CoreSkillGroup = {
  skill: string;
  domain?: string;
  concepts: string[];
  sessions: Session[];
  stage: "Applied" | "Practiced" | "Learned";
};

/**
 * Normalizes raw skill/concept names into standardized terms.
 * Merges aliases (e.g. "Responsive Web Design" -> "Responsive Design").
 */
export function normalizeConceptName(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // Strip noise like "Part 1", "Part 2", "Chapter 3", "Lecture 5", "Basics of", "Intro to"
  text = text.replace(/^(part|chapter|lecture|unit|module)\s+\d+[\s:\-–—]*/i, "");
  text = text.replace(/[\s:\-–—]*(part|chapter|lecture|unit|module)\s+\d+$/i, "");
  text = text.replace(/^(intro(duction)?\s+to|basics?\s+of|overview\s+of)\s+/i, "");
  text = text.trim();

  const lower = text.toLowerCase();

  // CSS Concept Rules
  if (/responsive\s+(web\s+)?(design|layout)/i.test(lower)) return "Responsive Design";
  if (/(css\s+)?grid(\s+layout|\s+positioning|\s+areas)?/i.test(lower)) return "CSS Grid";
  if (/(css\s+)?flexbox|\bflex(\s+layout)?\b/i.test(lower)) return "Flexbox";
  if (/tailwind(\s*css)?/i.test(lower)) return "Tailwind CSS";
  if (/(selectors|pseudo\s+classes|pseudo\s+selectors|specificity)/i.test(lower)) return "Selectors & Specificity";
  if (/(box\s+model|margin|padding|border-box)/i.test(lower)) return "Box Model";
  if (/(css\s+fundamentals|css3|cascading\s+style\s+sheets)/i.test(lower)) return "CSS Fundamentals";

  // JavaScript Concept Rules
  if (/async(\s+js|\s+javascript|\s+await|\/await)?|promises?/i.test(lower)) return "Async & Promises";
  if (/es6\+?|modern\s+js/i.test(lower)) return "Modern JavaScript (ES6+)";
  if (/dom(\s+manipulation|\s+api)?/i.test(lower)) return "DOM Manipulation";

  // React Concept Rules
  if (/react\s+hooks?|usestate|useeffect/i.test(lower)) return "React Hooks";
  if (/react\s+router/i.test(lower)) return "React Router";

  // Clean titlecase fallback
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Maps a raw topic/skill/concept to a high-level durable Core Skill & Domain.
 */
export function resolveCoreSkill(raw: string, aiDomain?: string, aiSkills?: string[]): { coreSkill: string; domain: string } {
  // If AI explicitly provided durable core skills, use the first valid clean skill
  if (aiSkills && aiSkills.length > 0) {
    const primary = aiSkills[0].trim();
    if (primary && primary.length <= 40) {
      const normalizedCore = normalizeCoreSkillName(primary);
      const domain = aiDomain || inferDomain(normalizedCore);
      return { coreSkill: normalizedCore, domain };
    }
  }

  const text = raw.trim();
  const lower = text.toLowerCase();

  // Web Dev mapping rules
  if (/(css|flexbox|grid|tailwind|responsive|box\s+model|selectors|style)/i.test(lower)) {
    return { coreSkill: "CSS", domain: aiDomain || "Web Development" };
  }
  if (/(javascript|js\b|typescript|ts\b|async|promises?|dom\b|es6)/i.test(lower)) {
    return { coreSkill: "JavaScript", domain: aiDomain || "Web Development" };
  }
  if (/(react|redux|next\.?js|jsx|hooks)/i.test(lower)) {
    return { coreSkill: "React", domain: aiDomain || "Web Development" };
  }
  if (/(html|markup|semantic\s+html)/i.test(lower)) {
    return { coreSkill: "HTML", domain: aiDomain || "Web Development" };
  }
  if (/(python|django|flask|fastapi)/i.test(lower)) {
    return { coreSkill: "Python", domain: aiDomain || "Software Engineering" };
  }
  if (/(algorithm|sorting|dynamic\s+programming|graph|tree|search)/i.test(lower)) {
    return { coreSkill: "Algorithms", domain: aiDomain || "Computer Science" };
  }
  if (/(data\s+structure|array|linked\s+list|hash\s+table|stack|queue)/i.test(lower)) {
    return { coreSkill: "Data Structures", domain: aiDomain || "Computer Science" };
  }
  if (/(database|sql|postgres|mongodb|orm)/i.test(lower)) {
    return { coreSkill: "Databases", domain: aiDomain || "Software Engineering" };
  }

  const clean = normalizeCoreSkillName(text);
  return { coreSkill: clean, domain: aiDomain || inferDomain(clean) };
}

function normalizeCoreSkillName(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^(part|chapter|lecture|unit|module)\s+\d+[\s:\-–—]*/i, "");
  text = text.replace(/^(intro(duction)?\s+to|basics?\s+of|overview\s+of)\s+/i, "");
  const lower = text.toLowerCase();
  if (/\bcss\b|flexbox|grid|tailwind/i.test(lower)) return "CSS";
  if (/\bjs\b|javascript|typescript/i.test(lower)) return "JavaScript";
  if (/react/i.test(lower)) return "React";
  if (/html/i.test(lower)) return "HTML";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function inferDomain(coreSkill: string): string {
  const lower = coreSkill.toLowerCase();
  if (["css", "javascript", "react", "html", "web development"].some((k) => lower.includes(k))) {
    return "Web Development";
  }
  if (["algorithms", "data structures", "computer science"].some((k) => lower.includes(k))) {
    return "Computer Science";
  }
  if (["python", "databases", "software engineering"].some((k) => lower.includes(k))) {
    return "Software Engineering";
  }
  return "General Knowledge";
}

/**
 * Aggregates sessions into durable Core Skills with supporting concepts.
 */
export function aggregateCoreSkills(sessions: Session[]): CoreSkillGroup[] {
  const map = new Map<string, { domain?: string; conceptsSet: Set<string>; sessions: Session[] }>();

  sessions.forEach((s) => {
    const aiDomain = s.analysis?.domain;
    const aiSkills = s.analysis?.skills;
    const aiConcepts = s.analysis?.concepts;

    // Determine the primary Core Skill for this session
    const { coreSkill, domain } = resolveCoreSkill(s.topic, aiDomain, aiSkills);

    if (!map.has(coreSkill)) {
      map.set(coreSkill, { domain, conceptsSet: new Set<string>(), sessions: [] });
    }

    const entry = map.get(coreSkill)!;
    if (domain && !entry.domain) entry.domain = domain;
    entry.sessions.push(s);

    // Collect concepts
    if (aiConcepts && Array.isArray(aiConcepts)) {
      aiConcepts.forEach((c) => {
        const norm = normalizeConceptName(c);
        if (norm) entry.conceptsSet.add(norm);
      });
    }

    // Fallback: extract concept from session topic
    const topicNorm = normalizeConceptName(s.topic);
    if (topicNorm && topicNorm !== coreSkill) {
      entry.conceptsSet.add(topicNorm);
    }
  });

  const result: CoreSkillGroup[] = [];

  map.forEach((data, skill) => {
    const stage = data.sessions.some((i) => i.mode === "Building")
      ? "Applied"
      : data.sessions.some((i) => i.mode === "Practicing")
      ? "Practiced"
      : "Learned";

    result.push({
      skill,
      domain: data.domain,
      concepts: Array.from(data.conceptsSet),
      sessions: data.sessions,
      stage,
    });
  });

  return result.sort((a, b) => b.sessions.length - a.sessions.length);
}

/**
 * Converts a live mode string into its historical past-tense representation for evidence UI.
 */
export function formatPastTenseMode(mode: string): string {
  if (!mode) return "Completed";
  switch (mode.trim().toLowerCase()) {
    case "learning":
      return "Learned";
    case "practicing":
      return "Practiced";
    case "building":
      return "Built";
    case "reading":
      return "Read";
    case "revising":
      return "Revised";
    default:
      return mode.trim().endsWith("ed") ? mode.trim() : "Completed";
  }
}
