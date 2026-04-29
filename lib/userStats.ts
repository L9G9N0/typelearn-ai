export interface UserStats {
  totalSessions: number;
  highestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  activityLog: Record<string, number>; // Stores {"YYYY-MM-DD": count}
}

export const getUserStats = (): UserStats => {
  if (typeof window === "undefined") {
    return { totalSessions: 0, highestWpm: 0, averageWpm: 0, averageAccuracy: 0, activityLog: {} };
  }
  const saved = localStorage.getItem("typelearn-stats");
  if (saved) return JSON.parse(saved);
  return { totalSessions: 0, highestWpm: 0, averageWpm: 0, averageAccuracy: 0, activityLog: {} };
};

export const recordSession = (wpm: number = 0, accuracy: number = 0) => {
  const stats = getUserStats();
  const today = new Date().toISOString().split("T")[0];

  // Update averages (only if WPM/Accuracy are provided)
  if (wpm > 0 && accuracy > 0) {
    const newTotal = stats.totalSessions + 1;
    stats.averageWpm = Math.round(((stats.averageWpm * stats.totalSessions) + wpm) / newTotal);
    stats.averageAccuracy = Math.round(((stats.averageAccuracy * stats.totalSessions) + accuracy) / newTotal);
    if (wpm > stats.highestWpm) stats.highestWpm = wpm;
    stats.totalSessions = newTotal;
  } else {
    // If it's just a tutor session, just increment the session count
    stats.totalSessions += 1;
  }

  // Update Heatmap Log
  stats.activityLog[today] = (stats.activityLog[today] || 0) + 1;

  localStorage.setItem("typelearn-stats", JSON.stringify(stats));
};