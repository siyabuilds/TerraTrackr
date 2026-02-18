# TerraTrackr (CarbonTrackr)

A full-stack carbon footprint tracking application that lets users log daily activities, visualize their environmental impact, set reduction targets, and compete on a community leaderboard.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | [Next.js](https://nextjs.org) (App Router) | 16.0.10 |
| **UI Library** | [React](https://react.dev) | 19.2.1 |
| **Language** | [TypeScript](https://www.typescriptlang.org) | 5.x |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | 4.x |
| **Charts** | [Chart.js](https://www.chartjs.org) + [react-chartjs-2](https://react-chartjs-2.js.org) | 4.5.1 / 5.3.1 |
| **Animations** | [Framer Motion](https://www.framer.com/motion) | 12.x |
| **Icons** | [Lucide React](https://lucide.dev) | 0.561.0 |
| **Fonts** | [Geist](https://vercel.com/font) via `next/font` | — |
| **Linting** | [ESLint](https://eslint.org) with `eslint-config-next` | 9.x |

---

## Why These Tools?

### Chart.js + react-chartjs-2 over Recharts

Chart.js was chosen for its smaller bundle size and canvas-based rendering, which performs better when rendering multiple chart types (bar, doughnut) on data-heavy pages like the Dashboard and Summaries views. `react-chartjs-2` provides thin React wrappers without adding significant overhead. Recharts, while more "React-native" in its approach, carries a larger bundle and uses SVG rendering that can become sluggish with frequent re-renders.

### Framer Motion over plain CSS animations

The application uses animated page transitions, staggered list reveals, and interactive micro-animations (e.g., modal entry/exit, navbar mobile menu, theme toggle rotation). Framer Motion provides a declarative API with `AnimatePresence` for exit animations and layout animations that would require significantly more boilerplate with CSS `@keyframes` or the Web Animations API. It also integrates cleanly with React's component lifecycle, handling mount/unmount animations that pure CSS cannot.

### Lucide React over FontAwesome / Heroicons

Lucide is tree-shakeable by design — each icon is an individual ES module import, so only the icons actually used are bundled. FontAwesome requires loading icon packs, and Heroicons, while also tree-shakeable, has a smaller icon set. Lucide provides a consistent visual language with a broad library and minimal footprint.

### Tailwind CSS over styled-components / CSS Modules

Tailwind CSS 4 enables rapid UI development with utility classes directly in JSX, avoiding the context-switching of separate style files. It pairs naturally with Next.js and supports theming via CSS custom properties (used here for light/dark mode via the `data-theme` attribute on `<html>`). Styled-components would add a runtime CSS-in-JS cost and complicate server-side rendering in the App Router.

### Context API over Redux / Zustand

The app has exactly two pieces of global state: **authentication** (`AuthContext`) and **theme** (`ThemeContext`). Redux or Zustand would be overkill for this scope. React Context with `useState` keeps the architecture simple and avoids adding external state management dependencies. If the app grows to need more complex cross-cutting state (e.g., real-time notifications, offline caching), a dedicated state library would be reconsidered.

---

## Architecture & Data Flow

### Frontend → Next.js API Routes → Backend

The application uses a **three-layer architecture**:

```
React Components (Client)
        │
        ▼
  app/lib/api.ts  ─── apiRequest() with Bearer token
        │
        ▼
  Next.js API Routes (app/api/**)  ─── server-side proxy
        │
        ▼
  External Backend (default: localhost:3001)
```

**Why a proxy layer?**

The Next.js API routes (`app/api/`) act as a server-side proxy between the React frontend and the actual backend API. This pattern exists for several reasons:

1. **Security** — The backend URL and any server-side secrets stay on the server. The browser never communicates directly with the backend, so the backend address is not exposed to the client.
2. **CORS avoidance** — Since frontend requests go to the same origin (`/api/*`), there are no cross-origin issues regardless of where the backend is hosted.
3. **Request shaping** — The proxy layer can validate, transform, or enrich requests before forwarding them (e.g., checking for an `Authorization` header and returning `401` early).
4. **Deployment flexibility** — The backend URL is configured via the `BACKEND_API_URL` environment variable, so the frontend can be deployed independently and pointed at different backends (staging, production) without code changes.

### API Routes Overview

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/auth/login` | POST | No | Authenticate user, return token |
| `/api/auth/register` | POST | No | Create new account |
| `/api/auth/validate` | GET | Yes | Validate stored token |
| `/api/activities` | GET, POST | Yes | List/create carbon activities |
| `/api/activities/[id]` | DELETE | Yes | Remove an activity |
| `/api/targets` | GET, POST | Yes | Get active / create reduction targets |
| `/api/targets/[id]` | PUT, DELETE | Yes | Update / delete a target |
| `/api/targets/history` | GET | Yes | Fetch historical target data |
| `/api/summaries` | GET | Yes | Redirects to current week summary |
| `/api/summaries/current` | GET | Yes | Current week summary |
| `/api/summaries/[weekStart]` | GET | Yes | Summary for a specific week |
| `/api/summaries/generate` | POST | Yes | Generate previous week summary |
| `/api/leaderboard` | GET | No | Global leaderboard rankings |

---

## Hooks & State Management

### AuthContext (`useAuth`)

Provides authentication state across the app:

- **On mount**: reads token and user from `localStorage`, validates the token against `/api/auth/validate`, and sets `isAuthenticated`.
- **`login(credentials)`**: calls `/api/auth/login`, stores the token and user in `localStorage`, and redirects to `/dashboard`.
- **`register(data)`**: calls `/api/auth/register`, stores credentials, and redirects to `/dashboard`.
- **`logout()`**: clears `localStorage` and redirects to `/`.

All authenticated pages check `isAuthenticated` inside a `useEffect` and redirect to `/login` if the user is not logged in. This guard pattern is repeated per-page rather than using middleware because the auth state lives in client-side context.

### ThemeContext (`useTheme`)

Manages light/dark mode:

- Persists the selected theme in `localStorage` (`carborntrackr-theme`).
- Applies a `data-theme` attribute on the `<html>` element, which drives CSS custom properties defined in `globals.css`.
- `toggleTheme()` and `setTheme(theme)` are exposed for the `ThemeToggle` component.

### Page-Level Data Fetching

Each page (Dashboard, Summaries, Targets, Leaderboard) fetches its own data in `useEffect` hooks after confirming authentication. Data is stored in local `useState` and re-fetched when dependencies change (e.g., switching the active week in Summaries, or toggling weekly/monthly in Targets). There is no global data cache — each page owns its data lifecycle.

---

## Known Inconsistencies & Future Improvements

| Area | Current State | Planned Improvement |
|------|--------------|---------------------|
| **Auth guards** | Each page independently checks `isAuthenticated` in a `useEffect` and redirects. This is duplicated across every protected page. | Extract into a shared `withAuth` higher-order component or a `useRequireAuth` hook, or use Next.js middleware for server-side route protection. |
| **LocalStorage key naming** | Token key is `carbontrackr-token` but theme key is `carborntrackr-theme` (note the typo: "carborn"). | Standardize all keys under a consistent prefix (e.g., `terratrackr-*`). |
| **Project naming** | `package.json` uses `carborntrackr_nextjs`, metadata says `CarbonTrackr`, repo is `TerraTrackr`. | Align all references to a single canonical project name. |
| **No loading skeleton** | Pages show a blank state or spinner while data loads. | Add skeleton UI components for a smoother perceived loading experience. |
| **No data caching** | Every page navigation triggers fresh API calls. | Introduce SWR or React Query for client-side caching, stale-while-revalidate, and optimistic updates. |
| **Error handling** | Errors are caught and displayed as strings; no retry mechanism. | Add structured error types, toast notifications, and automatic retry logic. |
| **No tests** | The project has no unit or integration tests. | Add testing with Jest/Vitest and React Testing Library. |
| **Activity data is client-side** | Predefined emission values (`activityData`) are hardcoded in `app/lib/api.ts`. | Move emission factors to the backend so they can be updated without redeploying the frontend. |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A running instance of the backend API (default: `http://localhost:3001`)

### Installation

```bash
git clone https://github.com/siyabuilds/TerraTrackr.git
cd TerraTrackr
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
BACKEND_API_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Linting

```bash
npm run lint
```

### Production Build

```bash
npm run build
npm start
```

---

## Deployment

### Vercel (Recommended)

The simplest deployment path for a Next.js application:

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set the `BACKEND_API_URL` environment variable in the Vercel project settings to point to your production backend.
4. Deploy. Vercel automatically detects Next.js and configures the build.

### Self-Hosted (Docker / Node.js)

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   BACKEND_API_URL=https://your-backend.example.com npm start
   ```
   The app listens on port `3000` by default. Use a reverse proxy (Nginx, Caddy) to handle TLS and route traffic.

3. Alternatively, containerize with Docker:
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./
   COPY --from=builder /app/public ./public
   ENV NODE_ENV=production
   EXPOSE 3000
   CMD ["npm", "start"]
   ```
   Build and run:
   ```bash
   docker build -t terratrackr .
   docker run -p 3000:3000 -e BACKEND_API_URL=https://your-backend.example.com terratrackr
   ```

### Environment Considerations

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_API_URL` | Yes | `http://localhost:3001` | URL of the backend API server |

> **Note**: The backend API is a separate service and must be deployed independently. Ensure it is accessible from wherever the Next.js server is running.

---

## License

See [LICENSE](./LICENSE) for details.
