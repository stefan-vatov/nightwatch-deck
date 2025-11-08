# Nightwatch Deck – Agent Playbook

## Overview
- Purpose: Collaborative Planning Poker surface for Nightwatch Deck built with React 19 + Vite 7, Tailwind CSS v4, and shadcn/ui. The former Mission Overview/Agent Briefing screens have been removed; the app now boots directly into the estimation experience.
- Bootstrap: src/main.tsx mounts App inside BrowserRouter and imports global styles from src/index.css.
- Routes (React Router 7):
  - / → Planning Poker (PlanningPokerView → PlanningPokerApp)
- Source of truth: README is still the default Vite template. Treat this document as the canonical onboarding guide until README is updated.

## Project Layout
| Area | Description |
| ---- | ----------- |
| src/App.tsx | Main UI surface. Wraps the PlanningPokerView in the global layout (min-height screen, centered content). React Router remains mounted for future expansion but only renders the PlanningPokerView. |
| src/views/PlanningPokerView.tsx | Lightweight wrapper that calls ensureLightMode on mount and provides the gradient container + spacing for the generated PlanningPokerApp. |
| src/components/generated/PlanningPokerApp.tsx | Generated Planning Poker implementation (room creation/join, estimation decks, reveal/reset, clipboard helper). Depends on framer-motion, lucide-react, and local utility helpers. |
| src/main.tsx | React entry. Wraps App with BrowserRouter, enables StrictMode, and imports src/index.css. |
| src/components/ui/button.tsx | shadcn/ui Button with class-variance-authority (cva) variants and sizes. Supports asChild via @radix-ui/react-slot. Styling merged via cn (tailwind-merge + clsx). Exports Button and buttonVariants. |
| src/components/ui/card.tsx | shadcn/ui Card primitives: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter. Tailwind v4 utility classes + theme tokens. |
| src/lib/utils.ts | Exposes cn(...inputs) plus ensureLightMode() and removeDarkClasses() for theming control on the Planning Poker route. |
| src/index.css | Tailwind v4 base import (@import "tailwindcss") and animation utilities (@import "tw-animate-css"). Defines CSS custom properties for design tokens (background, foreground, card, primary, etc.), dark theme overrides, and an @theme inline map to surface tokens to Tailwind. Sets base layer styles. |
| src/App.css | Minimal component-scoped styles for #root sizing. |
| vite.config.ts | Vite 7 configuration with @vitejs/plugin-react-swc and @tailwindcss/vite. Defines path alias "@": "./src" for cleaner imports (e.g., "@/components/ui/button"). |
| tsconfig.json / tsconfig.app.json | TypeScript project references and compiler options. Path alias "@/*" → "./src/*", strict mode, bundler resolution, React JSX config. |
| components.json | shadcn/ui configuration (style: "new-york"), Tailwind integration (css: "src/index.css"), and alias map for components, utils, ui, lib, hooks. |
| public/ | Static assets served as-is (e.g., vite.svg). |
| index.html | Minimal document with #root mount. |
| wrangler.toml | Cloudflare Pages configuration (build output + compatibility date). |
| wrangler.worker.toml | Worker + Durable Object config (`functions/_worker.ts`, migrations, bindings). |

## Tooling & Scripts (package.json)
| Script | Purpose |
| ------ | ------- |
| npm run dev | Start the Vite dev server on 127.0.0.1:5173 (strict port). |
| npm run dev:app | Same as `dev`, but injects `VITE_WS_BASE=http://127.0.0.1:8787` for Worker connectivity. |
| npm run dev:worker | Launch wrangler dev (via `wrangler.worker.toml`) for the Cloudflare Worker/Durable Object on http://127.0.0.1:8787. |
| npm run dev:stack | Run `dev:worker` and `dev:app` in parallel (full local stack). |
| npm run stack:stop | Stop lingering Vite/Wrangler/workerd processes when ports are stuck. |
| npm run worker:deploy | Deploy the Durable Object Worker defined in `wrangler.worker.toml`. |
| npm run pages:dev | Build + run `wrangler pages dev dist` for the Pages + Worker emulator. |
| npm run pages:deploy | Build + run `wrangler pages deploy dist` to publish the static site. |
| npm run build | Type-check via project references (tsc -b) and build with Vite. |
| npm run preview | Preview the production build locally. |
| npm run lint | Run ESLint across the repo. |

> Vite runs with `--strictPort`, so free port 5173 first (e.g., `npm run stack:stop`) if the dev server refuses to start.

### Dependencies and Libraries
- Core runtime: react 19, react-dom 19
- Routing: react-router-dom 7 (BrowserRouter + Routes kept for future, but current UI is single-route)
- Styling: tailwindcss 4 via @tailwindcss/vite; tw-animate-css for animation utilities
- UI primitives: shadcn/ui patterns implemented locally
  - Button: class-variance-authority (cva) for variants/sizes, @radix-ui/react-slot for asChild, tailwind-merge via cn
  - Card primitives for layout and content grouping
- Icons: lucide-react (used throughout PlanningPokerApp)
- Animation: framer-motion powers the generated Planning Poker interactions
- Utilities: clsx and tailwind-merge (via cn helper)
- Tooling: vite 7, @vitejs/plugin-react-swc (SWC), TypeScript 5.9, ESLint 9 (+ react-hooks, react-refresh)

## Frontend Stack & Styling
- Router: BrowserRouter wraps App in src/main.tsx; React Router currently renders a single Planning Poker view but provides room for future expansion.
- Tailwind v4: Enabled through @tailwindcss/vite and global @import in src/index.css. Design tokens defined as CSS variables with a .dark theme override and surfaced via @theme inline to Tailwind.
- shadcn/ui usage:
  - Button: buttonVariants({ variant: "default" | "secondary" | "ghost", size: "default" | "sm" | "lg" }); supports asChild with Radix Slot.
  - Card: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter for composable panels.
- Utilities: cn(...inputs) combines clsx + tailwind-merge for safe class composition.
- Icons: lucide-react icons used across the Planning Poker flows for avatars, actions, and status indicators.

## UI Surface Map
- App.tsx
  - Provides the global min-height layout and padding.
  - Renders <PlanningPokerView /> as the sole child.
- PlanningPokerView
  - Calls ensureLightMode() on mount to prevent dark-mode overrides from affecting the gradient background.
  - Hosts the rounded gradient container and centers <PlanningPokerApp />.
- PlanningPokerApp (generated)
  - Handles room creation, joining via room codes, participant list, estimation cards, reveal/reset flow, and clipboard copy helpers.
  - Uses framer-motion for list/card transitions and lucide-react icons for visual cues.
- Building blocks and utilities
  - Button/Card primitives remain available for future bespoke UI.
  - cn helper plus ensureLightMode/removeDarkClasses in src/lib/utils.

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
- Expand Planning Poker with authentication, persistence, or spectator-only links.
- Expose additional estimation templates (T-shirt sizing, custom decks) and responsive tweaks via hooks such as useIsMobile.
- Document and refine design tokens in src/index.css; consider extracting a tokens guide.
- Add unit/component tests around PlanningPokerApp interactions plus utility coverage.
- Align README with this playbook; either point README to AGENTS.md or migrate key sections to README.

## Open Questions
- Documentation ownership: Should AGENTS.md be the canonical onboarding document, or should README become primary with AGENTS as a deeper playbook?
- Content fidelity: which copy/design elements in the Planning Poker experience are canonical vs. prototype placeholders?

## Resources
- Vite: https://vite.dev/guide/
- React: https://react.dev/
- React Router: https://reactrouter.com/
- Tailwind CSS v4: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Lucide icons: https://lucide.dev/
