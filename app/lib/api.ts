const TOKEN_KEY = "carbontrackr-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type") || "";

    let data: any = null;

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Failed to parse JSON response");
      }
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} - ${text}`);
      }
      throw new Error("Unexpected non-JSON response from server");
    }

    if (!response.ok) {
      const message =
        (data && data.message) || `Request failed: ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network request failed");
  }
}

export interface Activity {
  _id: string;
  userId: string;
  category: string;
  activity: string;
  value: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export const activityData: Record<string, Record<string, number>> = {
  Transport: {
    "Car (10km)": 2.4,
    "Bus (10km)": 1.5,
    "Train (10km)": 0.6,
    "Bike (10km)": 0.0,
    "Walk (10km)": 0.0,
    "Flight (1hr domestic)": 90.0,
    "Flight (international, economy)": 250.0,
  },
  Food: {
    "Beef (200g)": 6.0,
    "Chicken (200g)": 2.5,
    "Pork (200g)": 3.0,
    "Eggs (2 eggs)": 0.5,
    "Vegetarian Meal": 1.0,
    "Vegan Meal": 0.8,
    "Dairy (250ml milk)": 1.2,
  },
  Energy: {
    "Electricity (5 kWh)": 2.1,
    "Electricity (10 kWh)": 4.2,
    "Gas Heater (1 hr)": 1.8,
    "Air Conditioner (1 hr)": 2.0,
    "LED Lights (1 hr)": 0.05,
    "Boil kettle (1x)": 0.15,
  },
  Waste: {
    "Landfill Waste (1 bag)": 2.0,
    "Recycled Waste (1 bag)": 0.5,
    "Composted Waste (1 bag)": 0.2,
    "Plastic Bottle Thrown": 0.1,
    "Plastic Bottle Recycled": 0.02,
  },
  Water: {
    "Shower (10 mins)": 1.2,
    Bath: 1.8,
    "Tap left running (1 min)": 0.2,
    "Toilet Flush": 0.6,
    "Washing Machine (1 load)": 1.4,
    "Dishwasher (1 load)": 1.0,
  },
  Shopping: {
    "New T-shirt": 3.0,
    "New Jeans": 10.0,
    Smartphone: 70.0,
    Laptop: 200.0,
    "Plastic Bag Used": 0.1,
    "Plastic Bag Reused": 0.01,
  },
};

export const categoryColors: Record<string, string> = {
  Transport: "#3b82f6",
  Food: "#f59e0b",
  Energy: "#ef4444",
  Waste: "#8b5cf6",
  Water: "#06b6d4",
  Shopping: "#ec4899",
};

export const api = {
  login: (credentials: {
    email?: string;
    username?: string;
    password: string;
  }) =>
    apiRequest<{ message: string; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) =>
    apiRequest<{ message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  validateToken: () =>
    apiRequest<{ valid: boolean }>("/api/auth/validate", {
      method: "GET",
    }),

  // Activities
  getActivities: () =>
    apiRequest<Activity[]>("/api/activities", {
      method: "GET",
    }),

  createActivity: (data: {
    category: string;
    activity: string;
    date?: string;
  }) =>
    apiRequest<Activity>("/api/activities", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteActivity: (id: string) =>
    apiRequest<{ message: string }>(`/api/activities/${id}`, {
      method: "DELETE",
    }),

  // Leaderboard
  getLeaderboard: () =>
    apiRequest<LeaderboardEntry[]>("/api/leaderboard", {
      method: "GET",
    }),

  // Summaries
  getCurrentSummary: () =>
    apiRequest<{ summary: WeeklySummary }>("/api/summaries/current", {
      method: "GET",
    }),

  getSummaryByWeek: (weekStart: string) =>
    apiRequest<{ summary: WeeklySummary }>(`/api/summaries/${weekStart}`, {
      method: "GET",
    }),

  generateSummary: () =>
    apiRequest<{ message: string; summary: WeeklySummary }>(
      "/api/summaries/generate",
      {
        method: "POST",
      },
    ),

  // Targets
  getActiveTarget: (period: "weekly" | "monthly" = "weekly") =>
    apiRequest<{ target: ReductionTarget }>(`/api/targets?period=${period}`, {
      method: "GET",
    }),

  createTarget: (data: {
    targetType?: "percentage" | "absolute";
    targetValue: number;
    description?: string;
    targetPeriod?: "weekly" | "monthly";
    categories?: string[];
  }) =>
    apiRequest<{ message: string; target: ReductionTarget }>("/api/targets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTarget: (
    id: string,
    data: {
      targetType?: "percentage" | "absolute";
      targetValue?: number;
      description?: string;
      targetPeriod?: "weekly" | "monthly";
      categories?: string[];
      isActive?: boolean;
    },
  ) =>
    apiRequest<{ message: string; target: ReductionTarget }>(
      `/api/targets/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  deleteTarget: (id: string) =>
    apiRequest<{ message: string }>(`/api/targets/${id}`, {
      method: "DELETE",
    }),

  getTargetHistory: (period: "weekly" | "monthly" = "weekly") =>
    apiRequest<{ targets: ReductionTarget[] }>(
      `/api/targets/history?period=${period}`,
      {
        method: "GET",
      },
    ),
};

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  totalEmissions: number;
  activityCount: number;
}

export interface ReductionTarget {
  _id: string;
  userId: string;
  targetType: "percentage" | "absolute";
  targetValue: number;
  description?: string;
  isActive: boolean;
  targetPeriod: "weekly" | "monthly";
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySummary {
  _id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  totalValue: number;
  activitiesCount: number;
  byCategoryTotals: Record<string, number>;
  byCategoryCounts: Record<string, number>;
  highestEmissionCategory: {
    category: string;
    emissions: number;
    activityCount: number;
  } | null;
  lowestEmissionCategory: {
    category: string;
    emissions: number;
    activityCount: number;
  } | null;
  personalizedTip: {
    category: string;
    message: string;
    tipType: "positive" | "improvement";
  } | null;
  reductionTarget: {
    targetValue: number;
    targetType: "percentage" | "absolute";
    previousWeekEmissions: number | null;
    reductionAchieved: number | null;
    progressPercentage: number | null;
    targetMet: boolean;
  } | null;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}
