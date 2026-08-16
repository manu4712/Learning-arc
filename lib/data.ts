import { calculateStreak } from "./streak";

export const MODES = ["Learning", "Practicing", "Building", "Reading", "Revising", "Other"] as const;
export type Mode = typeof MODES[number];

export type Independence =
  | "Following a tutorial"
  | "With significant guidance"
  | "With some guidance"
  | "Mostly independently"
  | "Completely independently";

export type Goal = {
  title: string;
  description?: string;
  duration: string;
  createdAt: string;
};

export type Analysis = {
  summary: string;
  skills: string[];
  domain?: string;
  concepts?: string[];
  classification: "guided" | "practice" | "application" | "exploration";
  evidence: "low" | "medium" | "high";
  progression: string;
  concern?: string;
  nextAction: string;
};

export type Session = {
  id: string;
  goalId?: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  mode: Mode;
  customActivity?: string;
  topic: string;
  intent?: string;
  reflection: string;
  independence: Independence;
  difficulty?: string;
  analysis?: Analysis;
  analysisError?: boolean;
  taskId?: string;
};

export type TaskStatus = "planned" | "in_progress" | "completed" | "archived";
export type TaskPriority = "high" | "medium" | "normal";

export type DailyTask = {
  id: string;
  goalId?: string;
  date: string; // current scheduled local YYYY-MM-DD
  originalPlannedDate?: string; // original planned local YYYY-MM-DD
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  completedManually?: boolean;
  linkedSessionIds: string[];
  carriedFromDate?: string;
  rolloverCount?: number;
  rolloverHistory?: string[];
  archivedAt?: string;
  mode?: Mode;
  estimatedFocusMins?: number;
};

export type DailyPlan = {
  date: string; // local YYYY-MM-DD
  intention?: string;
  gratitude: string[]; // max 3 entries
  waterGlasses?: boolean[]; // 8 independent boolean toggles
  waterCount?: number; // legacy optional for migration
  waterGoal?: number; // legacy optional for migration
  affirmation?: string; // legacy optional
  tomorrowIntention?: string; // legacy optional
};

export type Report = {
  createdAt: string;
  narrative: string;
  priority: string;
  pattern: string;
  gap: string;
};

export type PublicProfileInfo = {
  id: string;
  managementToken: string;
  publicUrl: string;
  updatedAt: string;
};

export type GoalStore = {
  id: string;
  version: 3;
  goal?: Goal;
  sessions: Session[];
  tasks?: DailyTask[];
  dailyPlans?: Record<string, DailyPlan>;
  report?: Report;
  publicProfile?: PublicProfileInfo;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export type MultiGoalStore = {
  version: 3;
  activeGoalId: string;
  goals: Record<string, GoalStore>;
};

export type Store = GoalStore;

export const EMPTY_GOAL_STORE: GoalStore = {
  id: "goal_default",
  version: 3,
  sessions: [],
  tasks: [],
  dailyPlans: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const EMPTY_MULTI_STORE: MultiGoalStore = {
  version: 3,
  activeGoalId: "goal_default",
  goals: {
    goal_default: EMPTY_GOAL_STORE,
  },
};

export const EMPTY: Store = EMPTY_GOAL_STORE;

const multiKey = "learning-arc-multi-v3";
const legacyKey = "learning-arc-v1";

/**
 * Normalizes any raw, legacy, imported, or partially corrupted multi-goal or single-goal
 * payload into a canonical, self-healed MultiGoalStore.
 * 
 * Guarantees:
 * 1. Every goal is stored under key === goal.id.
 * 2. Every goal has a valid, non-empty, unique ID string.
 * 3. Every session and task inside a goal has its goalId stamped matching goal.id.
 * 4. Obsolete/legacy archive state is stripped cleanly.
 * 5. Minimum 1 goal is strictly enforced (creates a valid default if empty).
 * 6. activeGoalId is strictly validated against available goal keys.
 */
export function normalizeMultiStore(data: unknown): MultiGoalStore {
  const nowIso = new Date().toISOString();
  const normalizedGoals: Record<string, GoalStore> = {};
  let targetActiveId: string | undefined = undefined;

  if (data && typeof data === "object") {
    const raw = data as Record<string, unknown>;

    // 1. Check if activeGoalId was specified
    if (typeof raw.activeGoalId === "string" && raw.activeGoalId.trim()) {
      targetActiveId = raw.activeGoalId.trim();
    }

    // 2. Extract raw goal list from whatever format it arrived in
    let rawGoalsList: Array<{ key?: string; store: Record<string, unknown> }> = [];

    if (raw.goals && typeof raw.goals === "object") {
      if (Array.isArray(raw.goals)) {
        // If goals was serialized as an array
        rawGoalsList = raw.goals
          .filter((g) => g && typeof g === "object")
          .map((g, idx) => ({
            key: typeof g.id === "string" && g.id.trim() ? g.id.trim() : `goal_${idx + 1}`,
            store: g as Record<string, unknown>,
          }));
      } else {
        // Standard object map
        const rawGoalsObj = raw.goals as Record<string, unknown>;
        rawGoalsList = Object.entries(rawGoalsObj)
          .filter(([, g]) => g && typeof g === "object")
          .map(([k, g]) => ({
            key: k,
            store: g as Record<string, unknown>,
          }));
      }
    } else if (Array.isArray(raw.sessions) || raw.goal || raw.tasks) {
      // Single-goal store (legacy v1/v2 or single-goal v3)
      const singleId =
        typeof raw.id === "string" && raw.id.trim() && raw.id !== "goal_default"
          ? raw.id.trim()
          : "goal_" + Date.now();
      rawGoalsList = [{ key: singleId, store: raw }];
    }

    // 3. Normalize each goal store into normalizedGoals
    const usedIds = new Set<string>();

    for (let i = 0; i < rawGoalsList.length; i++) {
      const entry = rawGoalsList[i];
      const s = entry.store;

      // Determine canonical ID
      let canonicalId = "";
      if (typeof s.id === "string" && s.id.trim() && s.id.trim() !== "goal_default" && s.id.trim() !== "default") {
        canonicalId = s.id.trim();
      } else if (entry.key && entry.key.trim() && entry.key.trim() !== "goal_default" && entry.key.trim() !== "default") {
        canonicalId = entry.key.trim();
      } else {
        canonicalId = `goal_${Date.now()}_${i}`;
      }

      // Ensure uniqueness
      let uniqueId = canonicalId;
      let counter = 1;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${canonicalId}_${counter}`;
        counter++;
      }
      usedIds.add(uniqueId);

      // Normalize Goal metadata
      let rawGoalObj: Record<string, unknown> = {};
      if (s.goal && typeof s.goal === "object") {
        rawGoalObj = s.goal as Record<string, unknown>;
      }

      const rawTitle =
        typeof rawGoalObj.title === "string"
          ? rawGoalObj.title
          : typeof s.title === "string"
          ? s.title
          : "";
      const cleanTitle = rawTitle.trim() || `Learning Goal ${i + 1}`;

      const rawDesc =
        typeof rawGoalObj.description === "string"
          ? rawGoalObj.description
          : typeof s.description === "string"
          ? s.description
          : undefined;
      const cleanDesc = rawDesc?.trim() || undefined;

      const rawDuration =
        typeof rawGoalObj.duration === "string"
          ? rawGoalObj.duration
          : typeof s.duration === "string"
          ? s.duration
          : "Self-Paced";
      const cleanDuration = rawDuration.trim() || "Self-Paced";

      const goalCreatedAt =
        typeof rawGoalObj.createdAt === "string" && rawGoalObj.createdAt.trim()
          ? rawGoalObj.createdAt
          : typeof s.createdAt === "string" && s.createdAt.trim()
          ? s.createdAt
          : nowIso;

      const goalObject: Goal = {
        title: cleanTitle,
        description: cleanDesc,
        duration: cleanDuration,
        createdAt: goalCreatedAt,
      };

      // Normalize Sessions
      const rawSessions = Array.isArray(s.sessions) ? s.sessions : [];
      const cleanSessions: Session[] = rawSessions
        .filter((sess) => sess && typeof sess === "object")
        .map((sess: Record<string, unknown>) => ({
          ...(sess as unknown as Session),
          goalId: uniqueId,
        }));

      // Normalize Tasks
      const rawTasks = Array.isArray(s.tasks) ? s.tasks : [];
      const cleanTasks: DailyTask[] = rawTasks
        .filter((t) => t && typeof t === "object")
        .map((t: Record<string, unknown>) => ({
          ...(t as unknown as DailyTask),
          goalId: uniqueId,
        }));

      // Normalize Daily Plans
      const cleanPlans: Record<string, DailyPlan> =
        s.dailyPlans && typeof s.dailyPlans === "object" && !Array.isArray(s.dailyPlans)
          ? (s.dailyPlans as Record<string, DailyPlan>)
          : {};

      // Normalize Public Profile
      let cleanPublicProfile: PublicProfileInfo | undefined = undefined;
      if (s.publicProfile && typeof s.publicProfile === "object") {
        const pp = s.publicProfile as Record<string, unknown>;
        if (typeof pp.id === "string" && typeof pp.publicUrl === "string") {
          cleanPublicProfile = {
            id: pp.id,
            managementToken: typeof pp.managementToken === "string" ? pp.managementToken : "",
            publicUrl: pp.publicUrl,
            updatedAt: typeof pp.updatedAt === "string" ? pp.updatedAt : nowIso,
          };
        }
      }

      const normalizedGoalStore: GoalStore = {
        id: uniqueId,
        version: 3,
        goal: goalObject,
        sessions: cleanSessions,
        tasks: cleanTasks,
        dailyPlans: cleanPlans,
        report: s.report && typeof s.report === "object" ? (s.report as Report) : undefined,
        publicProfile: cleanPublicProfile,
        createdAt: typeof s.createdAt === "string" && s.createdAt.trim() ? s.createdAt : goalCreatedAt,
        updatedAt: typeof s.updatedAt === "string" && s.updatedAt.trim() ? s.updatedAt : nowIso,
      };

      normalizedGoals[uniqueId] = normalizedGoalStore;
    }
  }

  // 4. Enforce Minimum 1 Goal requirement
  const goalIds = Object.keys(normalizedGoals);
  if (goalIds.length === 0) {
    const defaultId = "goal_" + Date.now();
    normalizedGoals[defaultId] = {
      id: defaultId,
      version: 3,
      goal: {
        title: "My Primary Learning Goal",
        duration: "Self-Paced",
        createdAt: nowIso,
      },
      sessions: [],
      tasks: [],
      dailyPlans: {},
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  // 5. Strictly validate activeGoalId
  const finalGoalIds = Object.keys(normalizedGoals);
  const finalActiveId =
    targetActiveId && normalizedGoals[targetActiveId] ? targetActiveId : finalGoalIds[0];

  return {
    version: 3,
    activeGoalId: finalActiveId,
    goals: normalizedGoals,
  };
}

/**
 * Safely merges an imported MultiGoalStore into the current one.
 * - New goals are added.
 * - Existing goals are preserved. Sessions, tasks, and daily plans are merged by ID/Date.
 * - Current activeGoalId is preserved.
 */
export function mergeMultiStore(current: MultiGoalStore, imported: MultiGoalStore): MultiGoalStore {
  const currentNorm = normalizeMultiStore(current);
  const importedNorm = normalizeMultiStore(imported);

  const mergedGoals: Record<string, GoalStore> = { ...currentNorm.goals };

  for (const [goalId, importedGoal] of Object.entries(importedNorm.goals)) {
    if (!mergedGoals[goalId]) {
      mergedGoals[goalId] = importedGoal;
    } else {
      const existing = mergedGoals[goalId];

      const sessionMap = new Map<string, Session>();
      existing.sessions.forEach(s => sessionMap.set(s.id, s));
      importedGoal.sessions.forEach(s => {
        if (!sessionMap.has(s.id)) sessionMap.set(s.id, s);
      });
      const mergedSessions = Array.from(sessionMap.values());

      const taskMap = new Map<string, DailyTask>();
      (existing.tasks || []).forEach(t => taskMap.set(t.id, t));
      (importedGoal.tasks || []).forEach(t => {
        if (!taskMap.has(t.id)) taskMap.set(t.id, t);
      });
      const mergedTasks = Array.from(taskMap.values());

      const mergedPlans = { ...(importedGoal.dailyPlans || {}), ...(existing.dailyPlans || {}) };

      mergedGoals[goalId] = {
        ...existing,
        goal: existing.goal && importedGoal.goal
          ? {
              title: existing.goal.title || importedGoal.goal.title,
              description: existing.goal.description || importedGoal.goal.description,
              duration: existing.goal.duration || importedGoal.goal.duration,
              createdAt: existing.goal.createdAt || importedGoal.goal.createdAt
            }
          : (existing.goal || importedGoal.goal),
        sessions: mergedSessions,
        tasks: mergedTasks,
        dailyPlans: mergedPlans,
        publicProfile: existing.publicProfile || importedGoal.publicProfile,
        report: existing.report || importedGoal.report,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  let activeId = currentNorm.activeGoalId;
  if (!mergedGoals[activeId]) {
    activeId = Object.keys(mergedGoals)[0];
  }

  return {
    version: 3,
    activeGoalId: activeId,
    goals: mergedGoals,
  };
}

export function loadMultiStore(): MultiGoalStore {
  try {
    if (typeof window === "undefined") return EMPTY_MULTI_STORE;

    // 1. Check if multi-goal v3 store exists
    const rawMulti = localStorage.getItem(multiKey);
    if (rawMulti) {
      const parsed = JSON.parse(rawMulti);
      if (parsed && typeof parsed === "object") {
        const normalized = normalizeMultiStore(parsed);

        // One-time check if legacy global public profile exists to migrate
        const rawLegacyProfile = localStorage.getItem("learning-arc-public-profile-v1");
        if (rawLegacyProfile) {
          try {
            const legacyProf = JSON.parse(rawLegacyProfile);
            if (
              legacyProf &&
              legacyProf.id &&
              legacyProf.publicUrl &&
              !normalized.goals[normalized.activeGoalId]?.publicProfile
            ) {
              normalized.goals[normalized.activeGoalId].publicProfile = legacyProf;
            }
            localStorage.removeItem("learning-arc-public-profile-v1");
          } catch {}
        }

        // Persist normalized structure
        localStorage.setItem(multiKey, JSON.stringify(normalized));
        return normalized;
      }
    }

    // 2. Migrate legacy v1/v2 single-goal store
    const rawLegacy = localStorage.getItem(legacyKey);
    let legacyStore: Partial<Store> = {};
    if (rawLegacy) {
      try {
        legacyStore = JSON.parse(rawLegacy) || {};
      } catch {}
    }

    // Legacy public profile check
    let legacyPublicProfile: PublicProfileInfo | undefined = legacyStore.publicProfile;
    if (!legacyPublicProfile) {
      const rawLegacyProf = localStorage.getItem("learning-arc-public-profile-v1");
      if (rawLegacyProf) {
        try {
          legacyPublicProfile = JSON.parse(rawLegacyProf);
          localStorage.removeItem("learning-arc-public-profile-v1");
        } catch {}
      }
    }

    const migrated = normalizeMultiStore({
      ...legacyStore,
      publicProfile: legacyPublicProfile,
    });

    localStorage.setItem(multiKey, JSON.stringify(migrated));
    return migrated;
  } catch (e) {
    console.error("Error loading multi-goal store:", e);
    return EMPTY_MULTI_STORE;
  }
}

export function saveMultiStore(data: MultiGoalStore): void {
  try {
    if (typeof window === "undefined") return;
    const normalized = normalizeMultiStore(data);
    localStorage.setItem(multiKey, JSON.stringify(normalized));
  } catch (e) {
    console.error("Error saving multi-goal store:", e);
  }
}

export function load(): Store {
  const multi = loadMultiStore();
  const active = multi.goals[multi.activeGoalId];
  if (active) return active;
  const first = Object.values(multi.goals)[0];
  return first || EMPTY_GOAL_STORE;
}

export function save(data: Store): void {
  const multi = loadMultiStore();
  const activeId = multi.activeGoalId || data.id || "goal_default";
  const cleanTasks = (data.tasks || []).filter((t) => (t.status as string) !== "archived");

  const updatedGoalStore: GoalStore = {
    ...data,
    id: activeId,
    version: 3,
    tasks: cleanTasks,
    dailyPlans: data.dailyPlans || {},
    updatedAt: new Date().toISOString(),
  };

  const updatedMulti: MultiGoalStore = {
    ...multi,
    activeGoalId: activeId,
    goals: {
      ...multi.goals,
      [activeId]: updatedGoalStore,
    },
  };

  saveMultiStore(updatedMulti);
}

export function createGoal(
  multi: MultiGoalStore,
  title: string,
  description?: string,
  duration?: string
): MultiGoalStore {
  const normalized = normalizeMultiStore(multi);
  const newId = "goal_" + Date.now();
  const nowIso = new Date().toISOString();

  const newGoalStore: GoalStore = {
    id: newId,
    version: 3,
    goal: {
      title: title.trim() || "New Learning Goal",
      description: description?.trim() || undefined,
      duration: duration?.trim() || "Self-Paced",
      createdAt: nowIso,
    },
    sessions: [],
    tasks: [],
    dailyPlans: {},
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const updatedMulti: MultiGoalStore = {
    version: 3,
    activeGoalId: newId,
    goals: {
      ...normalized.goals,
      [newId]: newGoalStore,
    },
  };

  saveMultiStore(updatedMulti);
  return updatedMulti;
}

export function switchGoal(multi: MultiGoalStore, goalId: string): MultiGoalStore {
  const normalized = normalizeMultiStore(multi);
  if (!normalized.goals[goalId]) return normalized;

  const updated: MultiGoalStore = {
    ...normalized,
    activeGoalId: goalId,
  };
  saveMultiStore(updated);
  return updated;
}

export function renameGoalInStore(
  multi: MultiGoalStore,
  goalId: string,
  title: string,
  description?: string,
  duration?: string
): MultiGoalStore {
  const normalized = normalizeMultiStore(multi);
  const target = normalized.goals[goalId];
  if (!target) return normalized;

  const currentGoal = target.goal || {
    title: title.trim(),
    duration: "Self-Paced",
    createdAt: new Date().toISOString(),
  };

  const updatedTarget: GoalStore = {
    ...target,
    id: goalId, // PRESERVE CANONICAL ID IMMUTABLY
    goal: {
      ...currentGoal,
      title: title.trim() || currentGoal.title,
      description: description !== undefined ? (description.trim() || undefined) : currentGoal.description,
      duration: duration?.trim() || currentGoal.duration || "Self-Paced",
      createdAt: currentGoal.createdAt || new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  const updatedMulti: MultiGoalStore = {
    ...normalized,
    goals: {
      ...normalized.goals,
      [goalId]: updatedTarget,
    },
  };

  saveMultiStore(updatedMulti);
  return updatedMulti;
}

export function deleteGoalFromStore(multi: MultiGoalStore, goalId: string): MultiGoalStore {
  const normalized = normalizeMultiStore(multi);
  const goalIds = Object.keys(normalized.goals);
  if (goalIds.length <= 1) {
    // Cannot delete the final remaining goal
    return normalized;
  }

  const updatedGoals = { ...normalized.goals };
  delete updatedGoals[goalId];

  const remainingIds = Object.keys(updatedGoals);
  let nextActiveId = normalized.activeGoalId;
  if (normalized.activeGoalId === goalId) {
    nextActiveId = remainingIds[0];
  }

  const updatedMulti: MultiGoalStore = {
    version: 3,
    activeGoalId: nextActiveId,
    goals: updatedGoals,
  };

  saveMultiStore(updatedMulti);
  return updatedMulti;
}

export function validateImport(value: unknown): value is MultiGoalStore | Store {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const isV1 = obj.version === 1 && Array.isArray(obj.sessions);
  const isV2 = obj.version === 2 && Array.isArray(obj.sessions);
  const isV3Single = obj.version === 3 && Array.isArray(obj.sessions);
  const isV3Multi = obj.version === 3 && typeof obj.goals === "object" && obj.goals !== null;
  return isV1 || isV2 || isV3Single || isV3Multi;
}

export function localDay(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function minutes(n: number) {
  const h = Math.floor(n / 60);
  return h ? `${h}h ${n % 60}m` : `${n}m`;
}

export function stats(sessions: Session[]) {
  const done = sessions.filter((s) => s.completedAt);
  const total = done.reduce((n, s) => n + s.duration, 0);
  const today = localDay(new Date().toISOString());
  const daily: Record<string, number> = {};
  
  done.forEach((s) => {
    const day = localDay(s.completedAt);
    if (day) daily[day] = (daily[day] || 0) + s.duration;
  });

  const { currentStreak, longestStreak, isStreakActiveToday } = calculateStreak(sessions);

  const byMode = Object.fromEntries(
    MODES.map((m) => [m, done.filter((s) => s.mode === m).reduce((n, s) => n + s.duration, 0)])
  );

  const top = Object.entries(
    done.reduce<Record<string, number>>((a, s) => {
      a[s.topic] = (a[s.topic] || 0) + s.duration;
      return a;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    done,
    total,
    today: daily[today] || 0,
    week: done
      .filter((s) => Date.now() - new Date(s.completedAt).getTime() < 6048e5)
      .reduce((n, s) => n + s.duration, 0),
    streak: currentStreak,
    currentStreak,
    longestStreak,
    isStreakActiveToday,
    daily,
    byMode,
    top,
  };
}


export type CalendarDayInfo = {
  dateStr: string; // "YYYY-MM-DD"
  dateObj: Date;
  monthIndex: number; // 0..11
  dayOfWeek: number; // 0 (Sun) .. 6 (Sat)
  dayOfMonth: number;
};

/**
 * Returns all calendar day objects for a given full calendar year (Jan 1 to Dec 31).
 * Handles leap years automatically (366 days for leap years, 365 days otherwise).
 */
export function getYearCalendarDays(year: number): CalendarDayInfo[] {
  const days: CalendarDayInfo[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const current = new Date(start);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    days.push({
      dateStr: `${y}-${m}-${d}`,
      dateObj: new Date(current),
      monthIndex: current.getMonth(),
      dayOfWeek: current.getDay(),
      dayOfMonth: current.getDate(),
    });
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Dynamically computes all available years:
 * = all years containing recorded Learning Arc sessions + current local calendar year.
 * Sorted descending (e.g. [2026] or [2027, 2026]).
 */
export function getAvailableYears(sessions: Session[]): number[] {
  const currentYear = new Date().getFullYear();
  const sessionYears = sessions
    .map((s) => {
      if (!s.completedAt) return null;
      const d = new Date(s.completedAt);
      return isNaN(d.getTime()) ? null : d.getFullYear();
    })
    .filter((y): y is number => y !== null);

  const yearsSet = new Set([...sessionYears, currentYear]);
  return Array.from(yearsSet).sort((a, b) => b - a);
}

/**
 * Calculates factual stats for a specific selected calendar year.
 */
export function getYearStats(sessions: Session[], year: number) {
  // Deduplicate sessions by Session.id defensively
  const uniqueMap = new Map<string, Session>();
  if (Array.isArray(sessions)) {
    sessions.forEach((s) => {
      if (s && s.id) uniqueMap.set(s.id, s);
    });
  }
  const uniqueSessions = Array.from(uniqueMap.values());

  const yearSessions = uniqueSessions.filter((s) => {
    if (!s.completedAt) return false;
    const day = localDay(s.completedAt);
    return Boolean(day && day.startsWith(String(year)));
  });

  const totalMinutes = yearSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  const dailyTotals: Record<string, number> = {};
  yearSessions.forEach((s) => {
    const day = localDay(s.completedAt);
    if (day) dailyTotals[day] = (dailyTotals[day] || 0) + (s.duration || 0);
  });

  const activeDaysCount = Object.keys(dailyTotals).length;

  // Calculate longest streak specifically within this year
  const sortedActiveDays = Object.keys(dailyTotals).sort();
  let maxStreakInYear = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  sortedActiveDays.forEach((dayStr) => {
    const curDate = new Date(`${dayStr}T00:00:00`);
    if (prevDate) {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / 86400000);
      if (diffDays === 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
    } else {
      currentRun = 1;
    }
    if (currentRun > maxStreakInYear) {
      maxStreakInYear = currentRun;
    }
    prevDate = curDate;
  });

  return {
    yearSessions,
    totalMinutes,
    activeDaysCount,
    totalSessionsCount: yearSessions.length,
    maxStreakInYear,
    dailyTotals,
  };
}
