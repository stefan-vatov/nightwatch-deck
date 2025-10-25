# Nightwatch Deck – Agent Playbook

## Overview
- Purpose: Mission-control UI scaffold for Nightwatch Deck built with React 19 + Vite 7, Tailwind CSS v4, and shadcn/ui. Provides a routed shell with a sticky top navigation bar and two primary views.
- Bootstrap: src/main.tsx mounts App inside BrowserRouter and imports global styles from src/index.css.
- Routes (React Router 7):
  - / → Mission Overview
  - /briefing → Agent Briefing
  - * → NotFound fallback
- Source of truth: README is still the default Vite template. Treat this document as the canonical onboarding guide until README is updated.

## Project Layout
| Area | Description |
| ---- | ----------- |
| src/App.tsx | Main UI surface. Renders sticky header with nav (NavLink + buttonVariants), and configures Routes for MissionOverview (index), AgentBriefing (/briefing), and NotFound (*). Local components included: StatusChip (status pill), AgentRow (list row for agents). Uses shadcn/ui Button and Card primitives, cn helper, and lucide-react icons (Shield, Satellite, Compass, Truck, CheckCircle2, FileText, Send, Users). |
| src/main.tsx | React entry. Wraps App with BrowserRouter, enables StrictMode, and imports src/index.css. |
| src/components/ui/button.tsx | shadcn/ui Button with class-variance-authority (cva) variants and sizes. Supports asChild via @radix-ui/react-slot. Styling merged via cn (tailwind-merge + clsx). Exports Button and buttonVariants. |
| src/components/ui/card.tsx | shadcn/ui Card primitives: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter. Tailwind v4 utility classes + theme tokens. |
| src/lib/utils.ts | Exposes cn(...inputs) utility using clsx and tailwind-merge for safe class merging. |
| src/index.css | Tailwind v4 base import (@import "tailwindcss") and animation utilities (@import "tw-animate-css"). Defines CSS custom properties for design tokens (background, foreground, card, primary, etc.), dark theme overrides, and an @theme inline map to surface tokens to Tailwind. Sets base layer styles. |
| src/App.css | Minimal component-scoped styles for #root sizing. |
| vite.config.ts | Vite 7 configuration with @vitejs/plugin-react-swc and @tailwindcss/vite. Defines path alias "@": "./src" for cleaner imports (e.g., "@/components/ui/button"). |
| tsconfig.json / tsconfig.app.json | TypeScript project references and compiler options. Path alias "@/*" → "./src/*", strict mode, bundler resolution, React JSX config. |
| components.json | shadcn/ui configuration (style: "new-york"), Tailwind integration (css: "src/index.css"), and alias map for components, utils, ui, lib, hooks. |
| public/ | Static assets served as-is (e.g., vite.svg). |
| index.html | Minimal document with #root mount. |

## Tooling & Scripts (package.json)
| Script | Purpose |
| ------ | ------- |
| npm run dev | Start Vite dev server with HMR (default port 5173). |
| npm run build | Type-check via project references (tsc -b) and build with Vite. |
| npm run preview | Preview the production build locally. |
| npm run lint | Run ESLint across the repo. |

### Dependencies and Libraries
- Core runtime: react 19, react-dom 19
- Routing: react-router-dom 7 (BrowserRouter, Routes/Route, NavLink)
- Styling: tailwindcss 4 via @tailwindcss/vite; tw-animate-css for animation utilities
- UI primitives: shadcn/ui patterns implemented locally
  - Button: class-variance-authority (cva) for variants/sizes, @radix-ui/react-slot for asChild, tailwind-merge via cn
  - Card primitives for layout and content grouping
- Icons: lucide-react
- Utilities: clsx and tailwind-merge (via cn helper)
- Tooling: vite 7, @vitejs/plugin-react-swc (SWC), TypeScript 5.9, ESLint 9 (+ react-hooks, react-refresh)

## Frontend Stack & Styling
- Router: BrowserRouter wraps App in src/main.tsx; routes defined in src/App.tsx using React Router 7.
- Tailwind v4: Enabled through @tailwindcss/vite and global @import in src/index.css. Design tokens defined as CSS variables with a .dark theme override and surfaced via @theme inline to Tailwind.
- shadcn/ui usage:
  - Button: buttonVariants({ variant: "default" | "secondary" | "ghost", size: "default" | "sm" | "lg" }); supports asChild with Radix Slot.
  - Card: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter for composable panels.
- Utilities: cn(...inputs) combines clsx + tailwind-merge for safe class composition.
- Icons: lucide-react icons used across views for visual semantics.

## UI Surface Map
- App.tsx
  - Header: Sticky top bar with brand (Shield icon + "Nightwatch Deck") and nav buttons using NavLink + buttonVariants.
  - Routes:
    - index ("/"): <MissionOverview />
    - "/briefing": <AgentBriefing />
    - "*": <NotFound />
- MissionOverview
  - Primary Card: "Operation Nightfall" with StatusChip "Active" and actions (Button with FileText icon).
  - Sub-cards grid:
    - Signal Intel (Satellite icon) — StatusChip "Stable"
    - Field Ops (Compass icon) — StatusChip "Staged"
    - Logistics (Truck icon) — StatusChip "Green"
- AgentBriefing
  - Deployment Checklist: Ordered list with CheckCircle2 icons; action Button with Send icon.
  - Active Agents: AgentRow entries with readiness StatusChip ("Ready" or "Standby"); section uses Users icon.
- NotFound
  - Card with message and Link button back to overview styled via buttonVariants.
- Building blocks and utilities
  - Button (src/components/ui/button.tsx), Card primitives (src/components/ui/card.tsx), cn (src/lib/utils.ts), icons from lucide-react, Tailwind v4 theme tokens (src/index.css).

## Conventions & Environment
- TypeScript: Strict settings via tsconfig.app.json; use explicit typing for component props.
- Linting: ESLint 9 configured via eslint.config.js with @eslint/js, typescript-eslint, react-hooks, and react-refresh plugins. Aim for zero warnings before merge.
- Styling: Prefer Tailwind utilities with tokens from src/index.css; use shadcn/ui primitives for consistent UI; avoid ad-hoc CSS unless necessary.
- Runtime: Node 18+ recommended per Vite 7. Use npm (package-lock.json present).

## Quick Actions
1. Install: npm install
2. Develop: npm run dev, iterate in src/App.tsx and UI primitives in src/components/ui/.
3. Build: npm run build (outputs dist/)
4. Preview: npm run preview
5. Lint: npm run lint

## Future Opportunities
- Expand routing and layouts (e.g., route params, nested routes, breadcrumbs).
- Wire real data sources for mission status and agents; introduce state management and data fetching as needed.
- Document and refine design tokens in src/index.css; consider extracting a tokens guide.
- Add unit and component tests (Button/Card variants, routing, StatusChip/AgentRow).
- Align README with this playbook; either point README to AGENTS.md or migrate key sections to README.

## Open Questions
- Documentation ownership: Should AGENTS.md be the canonical onboarding document, or should README become primary with AGENTS as a deeper playbook?
- Content fidelity: Should the current mission flavor text in UI be treated as canonical copy, or is it placeholder to be replaced with product content?

## Resources
- Vite: https://vite.dev/guide/
- React: https://react.dev/
- React Router: https://reactrouter.com/
- Tailwind CSS v4: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Lucide icons: https://lucide.dev/
