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

export type Store = {
  version: 2;
  goal?: Goal;
  sessions: Session[];
  report?: Report;
  tasks?: DailyTask[];
  dailyPlans?: Record<string, DailyPlan>;
};

export const EMPTY: Store = { version: 2, sessions: [], tasks: [], dailyPlans: {} };

const key = "learning-arc-v1";

export function load(): Store {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw);
    if (p && typeof p === "object") {
      // Migrate Version 1 store seamlessly to Version 2
      if (p.version === 1 && Array.isArray(p.sessions)) {
        return {
          version: 2,
          goal: p.goal,
          sessions: p.sessions,
          report: p.report,
          tasks: [],
          dailyPlans: {},
        };
      }
      // Version 2 store
      if (p.version === 2 && Array.isArray(p.sessions)) {
        const rawTasks = Array.isArray(p.tasks) ? p.tasks : [];
        // Permanently strip legacy archived DailyTask objects from store.tasks (Session evidence preserved!)
        const cleanTasks = rawTasks.filter((t: DailyTask) => t && (t.status as string) !== "archived");
        return {
          version: 2,
          goal: p.goal,
          sessions: p.sessions,
          report: p.report,
          tasks: cleanTasks,
          dailyPlans: p.dailyPlans && typeof p.dailyPlans === "object" ? p.dailyPlans : {},
        };
      }
    }
    return EMPTY;
  } catch {
    return EMPTY;
  }
}

export function save(data: Store) {
  const cleanTasks = (data.tasks || []).filter((t) => (t.status as string) !== "archived");
  // Ensure version is 2 on save
  const toSave: Store = {
    ...data,
    version: 2,
    tasks: cleanTasks,
    dailyPlans: data.dailyPlans || {},
  };
  localStorage.setItem(key, JSON.stringify(toSave));
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

export function validateImport(value: unknown): value is Store {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const isV1 = obj.version === 1 && Array.isArray(obj.sessions);
  const isV2 = obj.version === 2 && Array.isArray(obj.sessions);
  return isV1 || isV2;
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
