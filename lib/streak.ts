import { Session, localDay } from "./data";

export type StreakStats = {
  currentStreak: number;
  longestStreak: number;
  isStreakActiveToday: boolean;
};

/**
 * Calculates current streak and longest streak based on local calendar days.
 * 
 * Rules:
 * - Current streak: If today has a session, streak counts today + consecutive past days.
 * - If today does NOT have a session yet, but yesterday DOES, streak counts consecutive past days starting from yesterday (streak is alive today!).
 * - If neither today nor yesterday has a session, current streak is 0.
 * - Longest streak: The maximum number of consecutive active calendar days in history.
 */
export function calculateStreak(sessions: Session[]): StreakStats {
  const completed = sessions.filter((s) => s.completedAt);
  if (!completed.length) {
    return { currentStreak: 0, longestStreak: 0, isStreakActiveToday: false };
  }

  // Set of all unique calendar days with completed sessions
  const activeDays = new Set<string>();
  completed.forEach((s) => {
    activeDays.add(localDay(s.completedAt));
  });

  const todayStr = localDay(new Date().toISOString());
  const isStreakActiveToday = activeDays.has(todayStr);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  const cursor = new Date();
  
  // Check if today has a session
  if (activeDays.has(localDay(cursor.toISOString()))) {
    while (activeDays.has(localDay(cursor.toISOString()))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else {
    // Check if yesterday has a session
    cursor.setDate(cursor.getDate() - 1);
    while (activeDays.has(localDay(cursor.toISOString()))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // 2. Calculate Longest Streak across all history
  const sortedDays = Array.from(activeDays).sort(); // Lexicographical YYYY-MM-DD sort works correctly
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: Date | null = null;

  for (const dayStr of sortedDays) {
    const [year, month, day] = dayStr.split("-").map(Number);
    const currentDate = new Date(year, month - 1, day);

    if (!previousDate) {
      runningStreak = 1;
    } else {
      const diffMs = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }
    previousDate = currentDate;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  return {
    currentStreak,
    longestStreak,
    isStreakActiveToday,
  };
}
