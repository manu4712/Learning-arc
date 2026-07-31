import { DailyTask, DailyPlan, Session, localDay } from "./data";

export const DEFAULT_WATER_GOAL = 8;

/**
 * Safely normalizes waterGlasses boolean array and waterGoal number.
 * Clamps goal between 1 and 16.
 * Preserves existing boolean states and pads/truncates array to match goal length.
 */
export function normalizeWaterGlasses(
  existingGlasses?: boolean[],
  goalInput?: number
): { waterGlasses: boolean[]; waterGoal: number } {
  const goal = Math.max(
    1,
    Math.min(16, typeof goalInput === "number" && !isNaN(goalInput) ? goalInput : DEFAULT_WATER_GOAL)
  );

  let glasses: boolean[] = [];
  if (Array.isArray(existingGlasses)) {
    glasses = existingGlasses.map(Boolean);
  }

  if (glasses.length < goal) {
    glasses = [...glasses, ...Array(goal - glasses.length).fill(false)];
  } else if (glasses.length > goal) {
    glasses = glasses.slice(0, goal);
  }

  return { waterGlasses: glasses, waterGoal: goal };
}

export function getTodayStr(): string {
  return localDay(new Date().toISOString());
}

export function createDefaultDailyPlan(dateStr: string): DailyPlan {
  const { waterGlasses, waterGoal } = normalizeWaterGlasses([], DEFAULT_WATER_GOAL);
  return {
    date: dateStr,
    intention: "",
    gratitude: ["", "", ""],
    waterGlasses,
    waterGoal,
  };
}

/**
 * Retrieves the daily plan for dateStr with safe dynamic normalization for any waterGoal (1..16).
 * Handles backward-compatible migration of legacy waterCount numbers.
 */
export function getPlanForDay(
  dailyPlans: Record<string, DailyPlan> | undefined,
  dateStr: string
): DailyPlan {
  if (!dailyPlans || !dailyPlans[dateStr]) {
    return createDefaultDailyPlan(dateStr);
  }
  const existing = dailyPlans[dateStr];
  const gratitude = Array.isArray(existing.gratitude)
    ? [...existing.gratitude, "", "", ""].slice(0, 3)
    : ["", "", ""];

  let rawGlasses = existing.waterGlasses;
  let rawGoal = existing.waterGoal;

  if (!rawGlasses && typeof existing.waterCount === "number") {
    const legacyCount = Math.max(0, Math.min(8, existing.waterCount));
    rawGlasses = Array.from({ length: 8 }, (_, i) => i < legacyCount);
    rawGoal = 8;
  }

  const { waterGlasses, waterGoal } = normalizeWaterGlasses(rawGlasses, rawGoal);

  return {
    ...createDefaultDailyPlan(dateStr),
    ...existing,
    gratitude,
    waterGlasses,
    waterGoal,
  };
}

export function getTasksForDay(
  tasks: DailyTask[] | undefined,
  dateStr: string
): DailyTask[] {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.filter((t) => t.date === dateStr && (t.status as string) !== "archived");
}

export function getUnfinishedPreviousTasks(
  tasks: DailyTask[] | undefined,
  currentDateStr: string
): DailyTask[] {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.filter(
    (t) =>
      t.date < currentDateStr &&
      t.status !== "completed" &&
      (t.status as string) !== "archived"
  );
}

export function getHistoricalTasksForDay(
  tasks: DailyTask[] | undefined,
  dateStr: string
): DailyTask[] {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.filter((t) => {
    if ((t.status as string) === "archived") return false;
    const isScheduledHere = t.date === dateStr;
    const wasOriginallyPlannedHere = t.originalPlannedDate === dateStr;
    const wasCarriedFromHere = t.carriedFromDate === dateStr;
    const wasInRolloverHistory = Array.isArray(t.rolloverHistory) && t.rolloverHistory.includes(dateStr);

    return isScheduledHere || wasOriginallyPlannedHere || wasCarriedFromHere || wasInRolloverHistory;
  });
}

/**
 * Formats minutes into human-friendly decimal hours without unnecessary trailing .0.
 * Examples:
 * 30m -> 0.5h, 45m -> 0.8h, 50m -> 0.8h, 60m -> 1h, 75m -> 1.3h,
 * 90m -> 1.5h, 100m -> 1.7h, 120m -> 2h, 150m -> 2.5h, 225m -> 3.8h
 */
export function formatFocusHours(mins: number): string {
  if (!mins || mins <= 0) return "0h";
  const hours = mins / 60;
  if (mins % 60 === 0) {
    return `${hours}h`;
  }
  const rounded = Math.round(hours * 10) / 10;
  if (rounded % 1 === 0) {
    return `${Math.round(rounded)}h`;
  }
  return `${rounded}h`;
}

export type TaskEvidence = {
  sessions: Session[];
  sessionCount: number;
  focusedMinutes: number;
  formattedHours: string;
};

/**
 * Canonical helper for task-linked Session evidence.
 * Defensively matches:
 * 1. Primary: session.taskId === task.id
 * 2. Secondary: task.linkedSessionIds.includes(session.id)
 * 3. Fallback for legacy data: session.topic matches task.title AND session date matches task date
 *
 * Optionally filters by local date (filterDateStr) for Journey historical day inspection.
 * Deduplicates matching sessions by session.id.
 */
export function getTaskEvidence(
  task: DailyTask,
  sessions: Session[] | undefined,
  filterDateStr?: string
): TaskEvidence {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return {
      sessions: [],
      sessionCount: 0,
      focusedMinutes: 0,
      formattedHours: "0h",
    };
  }

  const linkedMap = new Map<string, Session>();

  for (const s of sessions) {
    const isPrimary = Boolean(s.taskId && s.taskId === task.id);
    const isSecondary = Boolean(Array.isArray(task.linkedSessionIds) && task.linkedSessionIds.includes(s.id));
    const isLegacyFallback = Boolean(
      !s.taskId &&
      (!task.linkedSessionIds || task.linkedSessionIds.length === 0) &&
      s.topic &&
      task.title &&
      s.topic.trim().toLowerCase() === task.title.trim().toLowerCase() &&
      s.completedAt &&
      localDay(s.completedAt) === task.date
    );

    if (isPrimary || isSecondary || isLegacyFallback) {
      linkedMap.set(s.id, s);
    }
  }

  let matchedSessions = Array.from(linkedMap.values());

  if (filterDateStr) {
    matchedSessions = matchedSessions.filter(
      (s) => s.completedAt && localDay(s.completedAt) === filterDateStr
    );
  }

  const focusedMinutes = matchedSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const sessionCount = matchedSessions.length;

  return {
    sessions: matchedSessions,
    sessionCount,
    focusedMinutes,
    formattedHours: formatFocusHours(focusedMinutes),
  };
}

export function getTaskFocusedMinutes(task: DailyTask, sessions: Session[], filterDateStr?: string): number {
  return getTaskEvidence(task, sessions, filterDateStr).focusedMinutes;
}

export function getTaskSessionCount(task: DailyTask, sessions: Session[], filterDateStr?: string): number {
  return getTaskEvidence(task, sessions, filterDateStr).sessionCount;
}

export function getDailySummary(
  tasks: DailyTask[] | undefined,
  dailyPlans: Record<string, DailyPlan> | undefined,
  sessions: Session[],
  dateStr: string
) {
  const dayTasks = getTasksForDay(tasks, dateStr);
  const completedTasks = dayTasks.filter((t) => t.status === "completed").length;

  const daySessions = sessions.filter(
    (s) => s.completedAt && localDay(s.completedAt) === dateStr
  );
  const totalFocusMins = daySessions.reduce((acc, s) => acc + s.duration, 0);

  const plan = getPlanForDay(dailyPlans, dateStr);
  const activeWaterCount = (plan.waterGlasses || []).filter(Boolean).length;

  return {
    dateStr,
    totalTasks: dayTasks.length,
    completedTasks,
    totalFocusMins,
    sessionsCount: daySessions.length,
    waterCount: activeWaterCount,
    waterGoal: plan.waterGoal || DEFAULT_WATER_GOAL,
  };
}
