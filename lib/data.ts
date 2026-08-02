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

export function loadMultiStore(): MultiGoalStore {
  try {
    if (typeof window === "undefined") return EMPTY_MULTI_STORE;

    // 1. Check if multi-goal v3 store exists
    const rawMulti = localStorage.getItem(multiKey);
    if (rawMulti) {
      const parsed = JSON.parse(rawMulti);
      if (parsed && (parsed.version === 3 || parsed.goals) && typeof parsed.goals === "object") {
        const goalIds = Object.keys(parsed.goals);
        if (goalIds.length > 0) {
          let activeId = parsed.activeGoalId;
          if (!activeId || !parsed.goals[activeId]) {
            activeId = goalIds[0];
          }
          return {
            version: 3,
            activeGoalId: activeId,
            goals: parsed.goals,
          };
        }
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

    const defaultGoalId = legacyStore.goal?.title
      ? "goal_" + legacyStore.goal.title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20)
      : "goal_default";

    const defaultGoalTitle = legacyStore.goal?.title || "My Primary Learning Goal";
    const defaultGoalDesc = legacyStore.goal?.description || "";
    const defaultGoalDuration = legacyStore.goal?.duration || "Self-Paced";
    const defaultCreatedAt = legacyStore.goal?.createdAt || new Date().toISOString();

    const rawTasks = Array.isArray(legacyStore.tasks) ? legacyStore.tasks : [];
    const cleanTasks = rawTasks.filter((t: DailyTask) => t && (t.status as string) !== "archived");

    const defaultGoalStore: GoalStore = {
      id: defaultGoalId,
      version: 3,
      goal: {
        title: defaultGoalTitle,
        description: defaultGoalDesc,
        duration: defaultGoalDuration,
        createdAt: defaultCreatedAt,
      },
      sessions: Array.isArray(legacyStore.sessions) ? legacyStore.sessions : [],
      tasks: cleanTasks,
      dailyPlans: legacyStore.dailyPlans && typeof legacyStore.dailyPlans === "object" ? legacyStore.dailyPlans : {},
      report: legacyStore.report,
      createdAt: defaultCreatedAt,
      updatedAt: new Date().toISOString(),
    };

    const newMultiStore: MultiGoalStore = {
      version: 3,
      activeGoalId: defaultGoalId,
      goals: {
        [defaultGoalId]: defaultGoalStore,
      },
    };

    localStorage.setItem(multiKey, JSON.stringify(newMultiStore));
    return newMultiStore;
  } catch (e) {
    console.error("Error loading multi-goal store:", e);
    return EMPTY_MULTI_STORE;
  }
}

export function saveMultiStore(data: MultiGoalStore): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(multiKey, JSON.stringify(data));
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
  const newId = "goal_" + Date.now();
  const nowIso = new Date().toISOString();

  const newGoalStore: GoalStore = {
    id: newId,
    version: 3,
    goal: {
      title: title.trim(),
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
    ...multi,
    activeGoalId: newId,
    goals: {
      ...multi.goals,
      [newId]: newGoalStore,
    },
  };

  saveMultiStore(updatedMulti);
  return updatedMulti;
}

export function switchGoal(multi: MultiGoalStore, goalId: string): MultiGoalStore {
  if (!multi.goals[goalId]) return multi;
  const updated: MultiGoalStore = {
    ...multi,
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
  const target = multi.goals[goalId];
  if (!target) return multi;

  const currentGoal = target.goal || {
    title: title.trim(),
    duration: "Self-Paced",
    createdAt: new Date().toISOString(),
  };

  const updatedTarget: GoalStore = {
    ...target,
    goal: {
      ...currentGoal,
      title: title.trim(),
      description: description?.trim() || undefined,
      duration: duration?.trim() || currentGoal.duration || "Self-Paced",
      createdAt: currentGoal.createdAt || new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  const updatedMulti: MultiGoalStore = {
    ...multi,
    goals: {
      ...multi.goals,
      [goalId]: updatedTarget,
    },
  };

  saveMultiStore(updatedMulti);
  return updatedMulti;
}

export function archiveGoalInStore(multi: MultiGoalStore, goalId: string): MultiGoalStore {
  const target = multi.goals[goalId];
  if (!target) return multi;

  const isArchived = Boolean(target.archivedAt);
  const updatedTarget: GoalStore = {
    ...target,
    archivedAt: isArchived ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedGoals = {
    ...multi.goals,
    [goalId]: updatedTarget,
  };

  let nextActiveId = multi.activeGoalId;
  if (!isArchived && multi.activeGoalId === goalId) {
    const unarchivedIds = Object.keys(updatedGoals).filter((id) => id !== goalId && !updatedGoals[id].archivedAt);
    if (unarchivedIds.length > 0) {
      nextActiveId = unarchivedIds[0];
    }
  }

  const updatedMulti: MultiGoalStore = {
    ...multi,
    activeGoalId: nextActiveId,
    goals: updatedGoals,
  };

  saveMultiStore(updatedMulti);
  return updatedMulti;
}

export function deleteGoalFromStore(multi: MultiGoalStore, goalId: string): MultiGoalStore {
  if (Object.keys(multi.goals).length <= 1) return multi;

  const updatedGoals = { ...multi.goals };
  delete updatedGoals[goalId];

  let nextActiveId = multi.activeGoalId;
  if (multi.activeGoalId === goalId) {
    const remainingIds = Object.keys(updatedGoals);
    const unarchived = remainingIds.filter((id) => !updatedGoals[id].archivedAt);
    nextActiveId = unarchived.length > 0 ? unarchived[0] : remainingIds[0];
  }

  const updatedMulti: MultiGoalStore = {
    ...multi,
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
