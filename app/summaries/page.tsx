"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Leaf,
  Calendar,
  Target,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { api, WeeklySummary, categoryColors } from "../lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

export default function SummariesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - diffToMonday,
        0,
        0,
        0,
        0,
      ),
    );
  });

  // Mobile detection for chart responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary();
    }
  }, [isAuthenticated, currentWeekStart]);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Check if it's the current week
      const now = new Date();
      const day = now.getUTCDay();
      const diffToMonday = (day + 6) % 7;
      const thisWeekMonday = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - diffToMonday,
          0,
          0,
          0,
          0,
        ),
      );

      if (currentWeekStart.getTime() === thisWeekMonday.getTime()) {
        // Current week - use the current endpoint
        const data = await api.getCurrentSummary();
        setSummary(data.summary);
      } else {
        // Historical week - use the weekStart endpoint
        const weekStartStr = currentWeekStart.toISOString().split("T")[0];
        const data = await api.getSummaryByWeek(weekStartStr);
        setSummary(data.summary);
      }
    } catch (err: any) {
      if (err.message?.includes("not found") || err.message?.includes("404")) {
        setSummary(null);
        setError("");
      } else {
        setError(err.message || "Failed to load summary");
        setSummary(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setGenerateMessage(null);
    try {
      const result = await api.generateSummary();
      setGenerateMessage({
        type: "success",
        text: result.message || "Summary generated successfully!",
      });
      // Navigate to the previous week to see the generated summary
      const prevWeek = new Date(currentWeekStart);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentWeekStart(prevWeek);
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        setGenerateMessage({
          type: "info",
          text: "Summary already exists for the previous week.",
        });
      } else if (err.message?.includes("No activities")) {
        setGenerateMessage({
          type: "error",
          text: "No activities found for the previous week to generate a summary.",
        });
      } else {
        setGenerateMessage({
          type: "error",
          text: err.message || "Failed to generate summary",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() + (direction === "next" ? 7 : -7));

    // Don't allow navigating to future weeks
    const now = new Date();
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const thisWeekMonday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - diffToMonday,
        0,
        0,
        0,
        0,
      ),
    );

    if (newWeek.getTime() <= thisWeekMonday.getTime()) {
      setCurrentWeekStart(newWeek);
      setGenerateMessage(null);
    }
  };

  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const thisWeekMonday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - diffToMonday,
        0,
        0,
        0,
        0,
      ),
    );
    return currentWeekStart.getTime() === thisWeekMonday.getTime();
  }, [currentWeekStart]);

  const weekEndDate = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Chart data
  const categories = Object.keys(categoryColors);

  const barChartData = useMemo(() => {
    if (!summary) return null;
    const totals = summary.byCategoryTotals || {};
    return {
      labels: categories,
      datasets: [
        {
          label: "CO₂ Emissions (kg)",
          data: categories.map((cat) => totals[cat] || 0),
          backgroundColor: categories.map((cat) => categoryColors[cat]),
          borderRadius: 8,
        },
      ],
    };
  }, [summary, categories]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Emissions by Category",
        color: "rgb(156, 163, 175)",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "rgb(156, 163, 175)" },
        grid: { color: "rgba(156, 163, 175, 0.1)" },
      },
      x: {
        ticks: {
          color: "rgb(156, 163, 175)",
          maxRotation: 45,
          minRotation: 45,
          font: { size: 10 },
        },
        grid: { display: false },
      },
    },
  };

  const doughnutChartData = useMemo(() => {
    if (!summary) return null;
    const totals = summary.byCategoryTotals || {};
    return {
      labels: categories,
      datasets: [
        {
          data: categories.map((cat) => totals[cat] || 0),
          backgroundColor: categories.map((cat) => categoryColors[cat]),
          borderWidth: 0,
        },
      ],
    };
  }, [summary, categories]);

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? ("bottom" as const) : ("right" as const),
        labels: {
          color: "rgb(156, 163, 175)",
          padding: 10,
          usePointStyle: true,
          font: { size: 11 },
          boxWidth: 12,
        },
      },
    },
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
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
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-3xl">
              Weekly Summaries
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Review your carbon footprint analysis
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
          Generate Last Week
        </motion.button>
      </motion.div>

      {/* Generate Message */}
      <AnimatePresence>
        {generateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
              generateMessage.type === "success"
                ? "bg-green-500/10 text-green-500"
                : generateMessage.type === "error"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-blue-500/10 text-blue-500"
            }`}
          >
            {generateMessage.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : generateMessage.type === "error" ? (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{generateMessage.text}</span>
            <button
              onClick={() => setGenerateMessage(null)}
              className="ml-auto underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Week Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <button
          onClick={() => navigateWeek("prev")}
          className="flex items-center gap-1 rounded-lg bg-card px-3 py-2 text-muted transition-colors hover:bg-card/80 hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Previous Week</span>
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-card px-3 sm:px-4 py-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
          <span className="text-sm sm:text-base font-medium text-foreground">
            {formatDate(currentWeekStart)} - {formatDate(weekEndDate)}
          </span>
          {isCurrentWeek && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              Current
            </span>
          )}
        </div>

        <button
          onClick={() => navigateWeek("next")}
          disabled={isCurrentWeek}
          className="flex items-center gap-1 rounded-lg bg-card px-3 py-2 text-muted transition-colors hover:bg-card/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="hidden sm:inline">Next Week</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </motion.div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !summary ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-[400px] flex-col items-center justify-center rounded-xl bg-card p-8 text-center shadow-sm"
        >
          <FileText className="mb-4 h-16 w-16 text-muted opacity-50" />
          <h2 className="mb-2 text-xl font-bold text-foreground">
            No Summary Available
          </h2>
          <p className="mb-6 max-w-md text-muted">
            {isCurrentWeek
              ? "Your current week summary will be generated as you log activities. Check back later or generate last week's summary."
              : "No summary exists for this week. Make sure you had activities logged during this period."}
          </p>
          {!isCurrentWeek && (
            <button
              onClick={() => {
                const now = new Date();
                const day = now.getUTCDay();
                const diffToMonday = (day + 6) % 7;
                setCurrentWeekStart(
                  new Date(
                    Date.UTC(
                      now.getUTCFullYear(),
                      now.getUTCMonth(),
                      now.getUTCDate() - diffToMonday,
                      0,
                      0,
                      0,
                      0,
                    ),
                  ),
                );
              }}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Go to Current Week
            </button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-card p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted">
                    Total Emissions
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                    {summary.totalValue.toFixed(2)} kg
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
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted">
                    Activities Logged
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {summary.activitiesCount}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-card p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: summary.highestEmissionCategory
                      ? `${categoryColors[summary.highestEmissionCategory.category]}20`
                      : "rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <TrendingUp
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    style={{
                      color: summary.highestEmissionCategory
                        ? categoryColors[
                            summary.highestEmissionCategory.category
                          ]
                        : "#ef4444",
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted">
                    Highest Category
                  </p>
                  <p className="text-base sm:text-lg font-bold text-foreground truncate">
                    {summary.highestEmissionCategory?.category || "N/A"}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl bg-card p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: summary.lowestEmissionCategory
                      ? `${categoryColors[summary.lowestEmissionCategory.category]}20`
                      : "rgba(34, 197, 94, 0.1)",
                  }}
                >
                  <TrendingDown
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    style={{
                      color: summary.lowestEmissionCategory
                        ? categoryColors[
                            summary.lowestEmissionCategory.category
                          ]
                        : "#22c55e",
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted">
                    Lowest Category
                  </p>
                  <p className="text-base sm:text-lg font-bold text-foreground truncate">
                    {summary.lowestEmissionCategory?.category || "N/A"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-card p-4 sm:p-6 shadow-sm"
            >
              <div className="h-60 sm:h-80">
                {barChartData && (
                  <Bar data={barChartData} options={barChartOptions} />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="rounded-xl bg-card p-4 sm:p-6 shadow-sm"
            >
              <h3 className="mb-3 sm:mb-4 text-center text-base sm:text-lg font-medium text-muted">
                Emissions Distribution
              </h3>
              <div className="h-60 sm:h-72">
                {doughnutChartData && (
                  <Doughnut
                    data={doughnutChartData}
                    options={doughnutChartOptions}
                  />
                )}
              </div>
            </motion.div>
          </div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 rounded-xl bg-card p-4 shadow-sm sm:p-6"
          >
            <h2 className="mb-4 text-xl font-bold text-foreground">
              Category Breakdown
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const emissions = summary.byCategoryTotals?.[category] || 0;
                const count = summary.byCategoryCounts?.[category] || 0;
                const percentage =
                  summary.totalValue > 0
                    ? ((emissions / summary.totalValue) * 100).toFixed(1)
                    : "0";

                return (
                  <div
                    key={category}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${categoryColors[category]}20`,
                      }}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: categoryColors[category] }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {category}
                      </p>
                      <p className="text-sm text-muted">
                        {emissions.toFixed(2)} kg ({percentage}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted">{count}</p>
                      <p className="text-xs text-muted">activities</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Reduction Target Progress */}
          {summary.reductionTarget && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-8 rounded-xl bg-card p-4 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Reduction Target Progress
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-background p-4">
                  <p className="text-sm text-muted">Target</p>
                  <p className="text-lg font-bold text-foreground">
                    {summary.reductionTarget.targetValue}
                    {summary.reductionTarget.targetType === "percentage"
                      ? "%"
                      : " kg"}{" "}
                    reduction
                  </p>
                </div>

                {summary.reductionTarget.previousWeekEmissions !== null && (
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-muted">Previous Week</p>
                    <p className="text-lg font-bold text-foreground">
                      {summary.reductionTarget.previousWeekEmissions.toFixed(2)}{" "}
                      kg
                    </p>
                  </div>
                )}

                {summary.reductionTarget.reductionAchieved !== null && (
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-muted">Reduction Achieved</p>
                    <p
                      className={`text-lg font-bold ${
                        summary.reductionTarget.reductionAchieved >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {summary.reductionTarget.reductionAchieved > 0 ? "+" : ""}
                      {summary.reductionTarget.reductionAchieved}
                      {summary.reductionTarget.targetType === "percentage"
                        ? "%"
                        : " kg"}
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-background p-4">
                  <p className="text-sm text-muted">Status</p>
                  <div className="flex items-center gap-2">
                    {summary.reductionTarget.targetMet ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-bold text-green-500">
                          Target Met!
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-amber-500">
                          In Progress
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {summary.reductionTarget.progressPercentage !== null && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted">Progress</span>
                    <span className="text-sm font-medium text-foreground">
                      {Math.min(
                        100,
                        summary.reductionTarget.progressPercentage,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-background">
                    <div
                      className={`h-full rounded-full transition-all ${
                        summary.reductionTarget.targetMet
                          ? "bg-green-500"
                          : "bg-primary"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          summary.reductionTarget.progressPercentage,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Personalized Tip */}
          {summary.personalizedTip && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`mb-8 rounded-xl p-4 sm:p-6 ${
                summary.personalizedTip.tipType === "positive"
                  ? "bg-green-500/10"
                  : "bg-amber-500/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    summary.personalizedTip.tipType === "positive"
                      ? "bg-green-500/20"
                      : "bg-amber-500/20"
                  }`}
                >
                  <Lightbulb
                    className={`h-5 w-5 ${
                      summary.personalizedTip.tipType === "positive"
                        ? "text-green-500"
                        : "text-amber-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">
                      {summary.personalizedTip.tipType === "positive"
                        ? "Great Job!"
                        : "Tip for Improvement"}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${
                          categoryColors[summary.personalizedTip.category]
                        }20`,
                        color: categoryColors[summary.personalizedTip.category],
                      }}
                    >
                      {summary.personalizedTip.category}
                    </span>
                  </div>
                  <p className="mt-1 text-muted">
                    {summary.personalizedTip.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-xl bg-primary/10 p-4 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <Leaf className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">
                  About Weekly Summaries
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Weekly summaries are generated based on your logged
                  activities. They provide insights into your carbon footprint
                  patterns, highlight areas for improvement, and track your
                  progress toward reduction targets. Keep logging activities to
                  get more accurate and personalized insights! 🌍
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
