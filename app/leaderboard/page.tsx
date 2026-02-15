"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Loader2,
  Leaf,
  Users,
  TrendingDown,
  Activity,
} from "lucide-react";
import { api, LeaderboardEntry } from "../lib/api";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Get medal color based on rank
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#FFD700"; // Gold - for first place
      case 2:
        return "#C0C0C0"; // Silver - for second place
      case 3:
        return "#CD7F32"; // Bronze - for third place
      default:
        return null; // No medal for other ranks
    }
  };

  // Get rank icon
  const getRankDisplay = (rank: number) => {
    const medalColor = getMedalColor(rank);
    if (medalColor) {
      return (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10"
          style={{ backgroundColor: `${medalColor}20` }}
        >
          <Medal
            className="h-4 w-4 sm:h-5 sm:w-5"
            style={{ color: medalColor }}
          />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 sm:h-10 sm:w-10">
        <span className="text-sm font-bold text-muted">{rank}</span>
      </div>
    );
  };

  // Calculate stats
  const totalParticipants = leaderboard.length;
  const averageEmissions =
    totalParticipants > 0
      ? leaderboard.reduce((sum, entry) => sum + entry.totalEmissions, 0) /
        totalParticipants
      : 0;
  const totalActivities = leaderboard.reduce(
    (sum, entry) => sum + entry.activityCount,
    0,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-3xl">
              Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Top eco-warriors with lowest emissions
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-500"
        >
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-card p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Participants</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {totalParticipants}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-card p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Avg. Emissions</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                {averageEmissions.toFixed(2)} kg
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-card p-4 sm:p-6 shadow-sm col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Total Activities</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {totalActivities}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top 3 Podium (Desktop) */}
      {leaderboard.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-8 hidden rounded-xl bg-card p-6 shadow-sm md:block"
        >
          <h2 className="mb-6 text-center text-lg font-bold text-foreground">
            🏆 Top 3 Eco Champions
          </h2>
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div
                className="mb-2 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: "#C0C0C020" }}
              >
                <Medal className="h-8 w-8" style={{ color: "#C0C0C0" }} />
              </div>
              <div className="flex h-24 w-28 flex-col items-center justify-center rounded-t-lg bg-gradient-to-t from-gray-300/20 to-gray-300/10">
                <p className="font-bold text-foreground">
                  {leaderboard[1]?.username || "N/A"}
                </p>
                <p className="text-sm text-muted">
                  {leaderboard[1]?.totalEmissions.toFixed(2)} kg
                </p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div
                className="mb-2 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FFD70020" }}
              >
                <Trophy className="h-10 w-10" style={{ color: "#FFD700" }} />
              </div>
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-t-lg bg-gradient-to-t from-yellow-500/20 to-yellow-500/10">
                <p className="text-lg font-bold text-foreground">
                  {leaderboard[0]?.username || "N/A"}
                </p>
                <p className="text-sm text-muted">
                  {leaderboard[0]?.totalEmissions.toFixed(2)} kg
                </p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div
                className="mb-2 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "#CD7F3220" }}
              >
                <Medal className="h-7 w-7" style={{ color: "#CD7F32" }} />
              </div>
              <div className="flex h-20 w-28 flex-col items-center justify-center rounded-t-lg bg-gradient-to-t from-orange-700/20 to-orange-700/10">
                <p className="font-bold text-foreground">
                  {leaderboard[2]?.username || "N/A"}
                </p>
                <p className="text-sm text-muted">
                  {leaderboard[2]?.totalEmissions.toFixed(2)} kg
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-card p-4 shadow-sm sm:p-6"
      >
        <h2 className="mb-4 text-xl font-bold text-foreground">Rankings</h2>

        {leaderboard.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <Leaf className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No leaderboard data available yet.</p>
            <p className="text-sm">Start logging activities to compete!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-0">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-sm font-medium text-muted">Rank</th>
                  <th className="pb-3 text-sm font-medium text-muted">User</th>
                  <th className="pb-3 text-sm font-medium text-muted">
                    <span className="hidden sm:inline">Emissions</span>
                    <span className="sm:hidden">CO₂</span>
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted hidden sm:table-cell">
                    Activities
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <motion.tr
                    key={entry.userId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-border/50 last:border-0 ${
                      entry.rank <= 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="py-3 sm:py-4">
                      {getRankDisplay(entry.rank)}
                    </td>
                    <td className="py-3 sm:py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {entry.username}
                        </p>
                        <p className="text-xs text-muted truncate hidden sm:block">
                          {entry.fullName}
                        </p>
                        <p className="text-xs text-muted sm:hidden">
                          {entry.activityCount} activities
                        </p>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium sm:text-sm ${
                          entry.rank === 1
                            ? "bg-yellow-500/20 text-yellow-600"
                            : entry.rank === 2
                              ? "bg-gray-400/20 text-gray-500"
                              : entry.rank === 3
                                ? "bg-orange-500/20 text-orange-600"
                                : "bg-primary/10 text-primary"
                        }`}
                      >
                        {entry.totalEmissions.toFixed(2)}
                        <span className="ml-1 hidden sm:inline">kg CO₂</span>
                      </span>
                    </td>
                    <td className="py-3 text-muted hidden sm:table-cell sm:py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {entry.activityCount}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 rounded-xl bg-primary/10 p-4 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <Leaf className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <h3 className="font-medium text-foreground">
              How the Leaderboard Works
            </h3>
            <p className="mt-1 text-sm text-muted">
              Rankings are based on total carbon emissions. Users with the
              lowest emissions rank highest. Keep logging your activities to
              track your impact and climb the leaderboard! Every small action
              counts towards a greener planet. 🌍
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
