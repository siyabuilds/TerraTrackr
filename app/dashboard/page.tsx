"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Filter,
  Loader2,
  X,
  ChevronDown,
  TrendingUp,
  Leaf,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { api, Activity, activityData, categoryColors } from "../lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
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
  PointElement,
  LineElement,
);

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Activity logging state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Mobile detection for chart responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const categories = Object.keys(activityData);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivities();
    }
  }, [isAuthenticated]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const data = await api.getActivities();
      setActivities(data);
    } catch (err: any) {
      setError(err.message || "Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!selectedCategory || !selectedActivity) return;

    setIsSubmitting(true);
    try {
      const newActivity = await api.createActivity({
        category: selectedCategory,
        activity: selectedActivity,
      });
      setActivities((prev) => [newActivity, ...prev]);
      setShowAddModal(false);
      setSelectedCategory("");
      setSelectedActivity("");
    } catch (err: any) {
      setError(err.message || "Failed to add activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await api.deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete activity");
    }
  };

  // Filtered activities
  const filteredActivities = useMemo(() => {
    if (filterCategory === "All") return activities;
    return activities.filter((a) => a.category === filterCategory);
  }, [activities, filterCategory]);

  // Chart data calculations
  const emissionsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    categories.forEach((cat) => (totals[cat] = 0));
    activities.forEach((a) => {
      totals[a.category] = (totals[a.category] || 0) + a.value;
    });
    return totals;
  }, [activities, categories]);

  const totalEmissions = useMemo(() => {
    return Object.values(emissionsByCategory).reduce(
      (sum, val) => sum + val,
      0,
    );
  }, [emissionsByCategory]);

  // Bar chart data
  const barChartData = {
    labels: categories,
    datasets: [
      {
        label: "CO₂ Emissions (kg)",
        data: categories.map((cat) => emissionsByCategory[cat] || 0),
        backgroundColor: categories.map((cat) => categoryColors[cat]),
        borderRadius: 8,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
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

  // Doughnut chart data
  const doughnutChartData = {
    labels: categories,
    datasets: [
      {
        data: categories.map((cat) => emissionsByCategory[cat] || 0),
        backgroundColor: categories.map((cat) => categoryColors[cat]),
        borderWidth: 0,
      },
    ],
  };

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
            <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-3xl">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Track your carbon footprint
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-5 w-5" />
          Log Activity
        </motion.button>
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
              <p className="text-xs sm:text-sm text-muted">Total Emissions</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                {totalEmissions.toFixed(2)} kg
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
              <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Activities Logged</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {activities.length}
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
                backgroundColor: `${categoryColors.Transport}20`,
              }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: categoryColors.Transport }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Top Category</p>
              <p className="text-base sm:text-lg font-bold text-foreground truncate">
                {Object.entries(emissionsByCategory).sort(
                  ([, a], [, b]) => b - a,
                )[0]?.[0] || "N/A"}
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
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Avg per Activity</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                {activities.length > 0
                  ? (totalEmissions / activities.length).toFixed(2)
                  : "0.00"}{" "}
                kg
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
            <Bar data={barChartData} options={barChartOptions} />
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
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Activities Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl bg-card p-4 sm:p-6 shadow-sm overflow-hidden"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Activity Log
          </h2>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-card"
            >
              <Filter className="h-4 w-4" />
              {filterCategory}
              <ChevronDown className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-border bg-card py-2 shadow-lg"
                >
                  <button
                    onClick={() => {
                      setFilterCategory("All");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-background ${
                      filterCategory === "All"
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategory(cat);
                        setShowFilterDropdown(false);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-background ${
                        filterCategory === cat
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: categoryColors[cat] }}
                      />
                      {cat}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <Leaf className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No activities logged yet.</p>
            <p className="text-sm">Start tracking your carbon footprint!</p>
          </div>
        ) : (
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <table className="w-full min-w-0 px-4 sm:px-0">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-sm font-medium text-muted">
                    Category
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted hidden sm:table-cell">
                    Activity
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted">
                    Emissions
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted hidden md:table-cell">
                    Date
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => (
                  <motion.tr
                    key={activity._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: categoryColors[activity.category],
                          }}
                        />
                        <div className="min-w-0">
                          <span className="text-foreground block truncate">
                            {activity.category}
                          </span>
                          <span className="text-xs text-muted block truncate sm:hidden">
                            {activity.activity}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-foreground hidden sm:table-cell">
                      {activity.activity}
                    </td>
                    <td className="py-4">
                      <span
                        className="rounded-full px-2 py-1 text-xs sm:text-sm font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: `${categoryColors[activity.category]}20`,
                          color: categoryColors[activity.category],
                        }}
                      >
                        {activity.value.toFixed(2)}
                        <span className="hidden sm:inline"> kg</span> CO₂
                      </span>
                    </td>
                    <td className="py-4 text-muted hidden md:table-cell">
                      {new Date(activity.date).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleDeleteActivity(activity._id)}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                        title="Delete activity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  Log Activity
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-background"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Select */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedActivity("");
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity Select */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Activity
                  </label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary disabled:opacity-50"
                  >
                    <option value="">Select an activity</option>
                    {selectedCategory &&
                      Object.entries(activityData[selectedCategory]).map(
                        ([activity, value]) => (
                          <option key={activity} value={activity}>
                            {activity} ({value} kg CO₂)
                          </option>
                        ),
                      )}
                  </select>
                </div>

                {/* Preview */}
                {selectedActivity && selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: categoryColors[selectedCategory],
                          }}
                        />
                        <span className="text-sm text-muted">
                          {selectedCategory}
                        </span>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-sm font-medium"
                        style={{
                          backgroundColor: `${categoryColors[selectedCategory]}20`,
                          color: categoryColors[selectedCategory],
                        }}
                      >
                        {activityData[selectedCategory][selectedActivity]} kg
                        CO₂
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-foreground">
                      {selectedActivity}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddActivity}
                  disabled={
                    !selectedCategory || !selectedActivity || isSubmitting
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Log Activity
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
