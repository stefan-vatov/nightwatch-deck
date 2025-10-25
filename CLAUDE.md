# Nightwatch Deck – Agent Playbook

## Overview
- **Purpose:** Starter React 19 + TypeScript UI scaffold powered by Vite 7 + SWC, currently still the stock counter demo in `src/App.tsx`.
- **Entry point:** `src/main.tsx` mounts `<App />` into the bare `index.html` shell.
- **What’s missing:** README is untouched template, UI is placeholder, and no domain-specific copy exists yet. Treat this repo as a foundation to evolve.

## Project Layout
| Area                                 | Description                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                        | Current UI surface (Vite counter demo plus SVG/Tailwind utility sample). Update this file for feature work. |
| `src/main.tsx`                       | React entry; imports `src/index.css` and renders `App`.                                                     |
| `src/App.css` / `src/index.css`      | Component styles plus Tailwind base import (`@import "tailwindcss";`) and design tokens.                    |
| `index.html`                         | Minimal document with `#root` mount.                                                                        |
| `vite.config.ts`                     | Registers `@vitejs/plugin-react-swc` and `@tailwindcss/vite`.                                               |
| `eslint.config.js`, `tsconfig*.json` | Lint + strict TS compiler settings.                                                                         |
| `public/`                            | Static assets served as-is (currently just defaults).                                                       |

## Tooling & Scripts (`package.json`)
| Script            | Purpose                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `npm run dev`     | Launch Vite dev server with HMR (default port 5173).                |
| `npm run build`   | Type-check via project references (`tsc -b`) then bundle with Vite. |
| `npm run preview` | Serve the production build locally for smoke-testing.               |
| `npm run lint`    | Run ESLint across the repo (`eslint .`).                            |

### Dependencies
- Runtime: `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`.
- Build/Test: `vite`, `@vitejs/plugin-react-swc`, `typescript`, `typescript-eslint`, ESLint core/plugins, React type packages, `@types/node`.

## Frontend Stack & Styling
- Rendering via React 19 hooks + SWC-based JSX transform.
- Vite handles module graph + dev server; entry script declared in `index.html`.
- Tailwind CSS v4 utilities activated through the official Vite plugin (`vite.config.ts`) and global import in `src/index.css`. Custom utilities can be declared inline (see SVG snippet in `src/App.tsx`).
- Projects has ShadCN installed and configured, ready to go. Use ShadCN for all UI related component work

## Conventions & Environment
- **TypeScript:** Strict mode with unused symbol guards and bundler-style resolution configured in `tsconfig.app.json`. Keep `.tsx` components typed explicitly.
- **Linting:** `eslint.config.js` composes `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. Maintain zero-warnings policy before merge.
- **Styling:** Prefer Tailwind utilities for layout/spacing, fall back to component CSS modules (`src/App.css`) when necessary.
- **Runtime expectations:** Node 18+ (per Vite 7 requirement). Use npm or pnpm; lockfile currently `package-lock.json` (npm). Run `npm install` before scripts.

## Quick Actions
1. **Install:** `npm install`
2. **Develop:** `npm run dev`, edit UI in `src/App.tsx` and styles in `src/App.css` / `src/index.css`.
3. **Build:** `npm run build` (produces `dist/`).
4. **Preview prod build:** `npm run preview`.
5. **Lint/Format:** `npm run lint` (add formatting tool if needed).

## Future Opportunities
- Replace the boilerplate UI in `src/App.tsx` with the actual Nightwatch Deck experience (components, routes, data wiring).
- Author a real README describing product goals, deployment steps, and architectural decisions.
- Expand styling tokens/theme in `src/index.css` and consider extracting Tailwind utility presets.
- Add tests, state management, routing, and API integration once requirements are known.
- Clarify whether `AGENTS.md` should supersede README as canonical onboarding.

## Open Questions
- Should `AGENTS.md` become the primary onboarding doc or live alongside an updated README?
- Are there product specs beyond the counter demo that future agents should prioritize?

## Resources
- Vite docs: https://vite.dev/guide/
- React docs: https://react.dev/
- Tailwind CSS v4 preview docs: https://tailwindcss.com/docs

> Assumptions: Node/npm workflow, macOS/Linux shell, no additional backend yet. Update this doc whenever repo structure or tooling changes.
