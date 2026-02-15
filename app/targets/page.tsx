"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  X,
  TrendingDown,
  CheckCircle2,
  Clock,
  History,
  ChevronDown,
  Percent,
  Weight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { api, ReductionTarget } from "../lib/api";

export default function TargetsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTarget, setActiveTarget] = useState<ReductionTarget | null>(
    null,
  );
  const [targetHistory, setTargetHistory] = useState<ReductionTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Period toggle
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<ReductionTarget | null>(
    null,
  );

  // Form state
  const [formTargetType, setFormTargetType] = useState<
    "percentage" | "absolute"
  >("percentage");
  const [formTargetValue, setFormTargetValue] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTargetPeriod, setFormTargetPeriod] = useState<
    "weekly" | "monthly"
  >("weekly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History expand
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTargets();
    }
  }, [isAuthenticated, period]);

  const fetchTargets = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [activeRes, historyRes] = await Promise.allSettled([
        api.getActiveTarget(period),
        api.getTargetHistory(period),
      ]);

      if (activeRes.status === "fulfilled") {
        setActiveTarget(activeRes.value.target);
      } else {
        setActiveTarget(null);
      }

      if (historyRes.status === "fulfilled") {
        setTargetHistory(historyRes.value.targets);
      } else {
        setTargetHistory([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load targets");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTarget(null);
    setFormTargetType("percentage");
    setFormTargetValue("");
    setFormDescription("");
    setFormTargetPeriod(period);
    setShowModal(true);
  };

  const openEditModal = (target: ReductionTarget) => {
    setEditingTarget(target);
    setFormTargetType(target.targetType);
    setFormTargetValue(String(target.targetValue));
    setFormDescription(target.description || "");
    setFormTargetPeriod(target.targetPeriod);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const value = parseFloat(formTargetValue);
    if (isNaN(value) || value <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }
    if (formTargetType === "percentage" && value > 100) {
      setError("Percentage target cannot exceed 100%.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (editingTarget) {
        const res = await api.updateTarget(editingTarget._id, {
          targetType: formTargetType,
          targetValue: value,
          description: formDescription || undefined,
          targetPeriod: formTargetPeriod,
        });
        setSuccessMsg("Target updated successfully!");
        setActiveTarget(res.target);
      } else {
        const res = await api.createTarget({
          targetType: formTargetType,
          targetValue: value,
          description: formDescription || undefined,
          targetPeriod: formTargetPeriod,
        });
        setSuccessMsg("Target created successfully!");
        setActiveTarget(res.target);
      }
      setShowModal(false);
      fetchTargets();
    } catch (err: any) {
      setError(err.message || "Failed to save target");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError("");
      await api.deleteTarget(id);
      setSuccessMsg("Target deactivated successfully.");
      if (activeTarget?._id === id) {
        setActiveTarget(null);
      }
      fetchTargets();
    } catch (err: any) {
      setError(err.message || "Failed to delete target");
    }
  };

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

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
        className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-3xl">
              Reduction Targets
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Set goals to reduce your carbon footprint
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-5 w-5" />
          Set Target
        </motion.button>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 sm:mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 sm:p-4 text-sm sm:text-base text-red-500"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 min-w-0">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-2 flex-shrink-0 underline text-sm"
            >
              Dismiss
            </button>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 sm:mb-6 flex items-center gap-2 rounded-lg bg-primary/10 p-3 sm:p-4 text-sm sm:text-base text-primary"
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Period Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 sm:mb-8"
      >
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setPeriod("weekly")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === "weekly"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === "monthly"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Monthly
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Active Target Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 sm:mb-8"
          >
            {activeTarget ? (
              <div className="rounded-xl bg-card p-4 sm:p-6 shadow-sm">
                {/* Active badge */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wide">
                      Active {period} Target
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(activeTarget)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(activeTarget._id)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Deactivate</span>
                    </motion.button>
                  </div>
                </div>

                {/* Target value display */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Main value */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      {activeTarget.targetType === "percentage" ? (
                        <Percent className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      ) : (
                        <Weight className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted">
                        Reduction Goal
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">
                        {activeTarget.targetValue}
                        {activeTarget.targetType === "percentage" ? "%" : " kg"}
                      </p>
                      <p className="text-xs text-muted capitalize">
                        {activeTarget.targetType} reduction
                      </p>
                    </div>
                  </div>

                  {/* Period info */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted">Period</p>
                      <p className="text-base sm:text-lg font-semibold text-foreground capitalize">
                        {activeTarget.targetPeriod}
                      </p>
                    </div>
                  </div>

                  {/* Created date */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                      <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted">Created</p>
                      <p className="text-sm sm:text-base font-medium text-foreground">
                        {new Date(activeTarget.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {activeTarget.description && (
                  <div className="mt-4 rounded-lg border border-border bg-background p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted">
                      <span className="font-medium text-foreground">
                        Note:{" "}
                      </span>
                      {activeTarget.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* No active target */
              <div className="rounded-xl bg-card p-8 sm:p-12 shadow-sm text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-8 w-8 text-primary opacity-60" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  No Active {period === "weekly" ? "Weekly" : "Monthly"} Target
                </h3>
                <p className="text-sm sm:text-base text-muted mb-6 max-w-md mx-auto">
                  Set a carbon reduction target to track your progress and stay
                  motivated on your sustainability journey.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Target
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Target History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl bg-card shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center justify-between p-4 sm:p-6 text-left transition-colors hover:bg-background/50"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <History className="h-5 w-5 text-muted" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Target History
                  </h2>
                  <p className="text-xs sm:text-sm text-muted">
                    {targetHistory.length} target
                    {targetHistory.length !== 1 ? "s" : ""} total
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showHistory ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-muted" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border">
                    {targetHistory.length === 0 ? (
                      <div className="py-8 sm:py-12 text-center text-muted">
                        <History className="mx-auto mb-3 h-10 w-10 opacity-40" />
                        <p className="text-sm sm:text-base">
                          No target history yet.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {targetHistory.map((target, index) => (
                          <motion.div
                            key={target._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex flex-col gap-2 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                                  target.isActive
                                    ? "bg-primary/10"
                                    : "bg-muted/10"
                                }`}
                              >
                                {target.targetType === "percentage" ? (
                                  <Percent
                                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                      target.isActive
                                        ? "text-primary"
                                        : "text-muted"
                                    }`}
                                  />
                                ) : (
                                  <Weight
                                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                      target.isActive
                                        ? "text-primary"
                                        : "text-muted"
                                    }`}
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-foreground">
                                    {target.targetValue}
                                    {target.targetType === "percentage"
                                      ? "%"
                                      : " kg"}
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                      target.isActive
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted/10 text-muted"
                                    }`}
                                  >
                                    {target.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                {target.description && (
                                  <p className="text-xs sm:text-sm text-muted truncate mt-0.5">
                                    {target.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted mt-0.5">
                                  {new Date(
                                    target.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {target.isActive && (
                                <>
                                  <button
                                    onClick={() => openEditModal(target)}
                                    className="rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground"
                                    title="Edit target"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(target._id)}
                                    className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                    title="Deactivate target"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Create/Edit Target Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-card p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              {/* Drag handle for mobile */}
              <div className="mb-4 flex justify-center sm:hidden">
                <div className="h-1.5 w-12 rounded-full bg-border" />
              </div>

              <div className="mb-5 sm:mb-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {editingTarget ? "Edit Target" : "Set Reduction Target"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-background"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Target Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Target Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFormTargetType("percentage")}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                        formTargetType === "percentage"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/50"
                      }`}
                    >
                      <Percent className="h-4 w-4" />
                      Percentage
                    </button>
                    <button
                      onClick={() => setFormTargetType("absolute")}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                        formTargetType === "absolute"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/50"
                      }`}
                    >
                      <Weight className="h-4 w-4" />
                      Absolute (kg)
                    </button>
                  </div>
                </div>

                {/* Target Value */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Target Value
                    {formTargetType === "percentage" ? " (%)" : " (kg CO₂)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formTargetType === "percentage" ? "100" : undefined}
                    step="any"
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(e.target.value)}
                    placeholder={
                      formTargetType === "percentage" ? "e.g. 10" : "e.g. 5.0"
                    }
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted/50"
                  />
                  {formTargetType === "percentage" && (
                    <p className="mt-1 text-xs text-muted">
                      Reduce emissions by this percentage compared to the
                      previous period.
                    </p>
                  )}
                </div>

                {/* Period */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Period
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFormTargetPeriod("weekly")}
                      className={`rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                        formTargetPeriod === "weekly"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/50"
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setFormTargetPeriod("monthly")}
                      className={`rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                        formTargetPeriod === "monthly"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/50"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Note{" "}
                    <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Focus on reducing transport emissions"
                    maxLength={200}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted/50"
                  />
                  <p className="mt-1 text-xs text-muted text-right">
                    {formDescription.length}/200
                  </p>
                </div>

                {/* Preview */}
                {formTargetValue && parseFloat(formTargetValue) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border bg-background p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Your target</span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                        {formTargetValue}
                        {formTargetType === "percentage" ? "%" : " kg CO₂"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      Reduce your {formTargetPeriod} emissions by{" "}
                      <span className="font-medium text-foreground">
                        {formTargetValue}
                        {formTargetType === "percentage" ? "%" : " kg of CO₂"}
                      </span>
                    </p>
                  </motion.div>
                )}

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  disabled={
                    !formTargetValue ||
                    parseFloat(formTargetValue) <= 0 ||
                    isSubmitting
                  }
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {editingTarget ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Target className="h-5 w-5" />
                      )}
                      {editingTarget ? "Update Target" : "Set Target"}
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
