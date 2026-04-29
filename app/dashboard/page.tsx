"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserStats, UserStats } from "../../lib/userStats";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [heatmapDays, setHeatmapDays] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    const loadedStats = getUserStats();
    setStats(loadedStats);

    // Generate the last 84 days (12 weeks) for the heatmap
    const days = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      days.push({
        date: dateString,
        count: loadedStats.activityLog[dateString] || 0,
      });
    }
    setHeatmapDays(days);
  }, []);

  if (!stats) return null;

  // Helper to determine the green color intensity
  const getColor = (count: number) => {
    if (count === 0) return "bg-neutral-800"; // Empty
    if (count === 1) return "bg-green-900";  // Light activity
    if (count <= 3) return "bg-green-700";   // Medium activity
    return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"; // High activity
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center pt-24 p-6 font-sans">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Developer Profile</h1>
            <p className="text-neutral-400 mt-1">Track your consistency and typing speed.</p>
          </div>
          <button onClick={() => router.push("/")} className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-lg font-bold transition-all">
            Back to Home
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg text-center">
            <span className="block text-4xl font-mono font-bold text-blue-400">{stats.totalSessions}</span>
            <span className="text-sm text-neutral-500 uppercase tracking-wider mt-2 block">Lessons Completed</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg text-center">
            <span className="block text-4xl font-mono font-bold text-purple-400">{stats.highestWpm}</span>
            <span className="text-sm text-neutral-500 uppercase tracking-wider mt-2 block">Highest WPM</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg text-center">
            <span className="block text-4xl font-mono font-bold text-white">{stats.averageWpm}</span>
            <span className="text-sm text-neutral-500 uppercase tracking-wider mt-2 block">Average WPM</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg text-center">
            <span className="block text-4xl font-mono font-bold text-green-400">{stats.averageAccuracy}%</span>
            <span className="text-sm text-neutral-500 uppercase tracking-wider mt-2 block">Avg Accuracy</span>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-white">Activity Heatmap (Last 12 Weeks)</h2>
          
          <div className="flex flex-col items-end space-y-2">
            {/* The Grid */}
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-2">
              {heatmapDays.map((day, i) => (
                <div 
                  key={i} 
                  title={`${day.count} sessions on ${day.date}`}
                  className={`w-4 h-4 rounded-sm ${getColor(day.count)} transition-all hover:scale-125 hover:ring-2 ring-white cursor-pointer`}
                />
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center text-xs text-neutral-500 space-x-2">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-neutral-800"></div>
              <div className="w-3 h-3 rounded-sm bg-green-900"></div>
              <div className="w-3 h-3 rounded-sm bg-green-700"></div>
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              <span>More</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}