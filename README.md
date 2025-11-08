# Nightwatch Deck – Planning Poker

Nightwatch Deck now ships as a collaborative Planning Poker surface for sprint estimation. The legacy Mission Overview / Agent Briefing screens and the standalone `prototype/` folder have been removed—the app boots directly into the estimation experience hosted under `src/components/generated/PlanningPokerApp.tsx`.

## Feature Highlights
- Create or join estimation rooms via short alphanumeric codes (URL query string `?room=CODE` supported).
- Owner-only controls for reveal/reset once every participant has voted.
- Fibonacci card deck with framer-motion micro-interactions.
- Clipboard helper for sharing room links (auto-selects `window.location.origin` + code).
- Light-mode wrapper enforced through `ensureLightMode()` so the gradient background stays pristine regardless of global theme toggles.

## Tech Stack
- **Runtime**: React 19 + TypeScript 5.9
- **Build tool**: Vite 7 with `@vitejs/plugin-react-swc`
- **Styling**: Tailwind CSS v4, `tw-animate-css`, shadcn/ui button + card primitives, custom design tokens in `src/index.css`
- **Animation & Icons**: `framer-motion` and `lucide-react`
- **Routing**: React Router 7 (currently renders the Planning Poker view as the sole route, but BrowserRouter remains in place for future expansion)

## Getting Started
```bash
npm install
npm run dev         # http://127.0.0.1:5173
npm run lint        # eslint .
npm run build       # type-check + production build
npm run preview     # serve the dist/ build locally
```

## Project Layout
| Path | Purpose |
| ---- | ------- |
| `src/App.tsx` | Minimal shell that renders `<PlanningPokerView />` inside the global layout. |
| `src/views/PlanningPokerView.tsx` | Calls `ensureLightMode()` on mount and provides the gradient container + spacing for the generated app. |
| `src/components/generated/PlanningPokerApp.tsx` | Generated Planning Poker UI (room creation/join, voting grid, reveal/reset, clipboard helper). |
| `src/lib/utils.ts` | `cn`, `ensureLightMode()`, and `removeDarkClasses()` utilities. |
| `src/components/ui/` | shadcn/ui-inspired Button/Card primitives used throughout the experience. |
| `src/index.css` / `src/App.css` | Tailwind v4 base import, design tokens, and full-height layout helpers. |

See `AGENTS.md` (canonical playbook) for deeper architectural notes and `PLANNING_POKER_MIGRATION_PLAN.md` for the original migration rationale.

## Manual QA Checklist (latest session)
- Create room → select card → reveal/reset works, including URL updates with `?room=CODE`.
- Visiting `/?room=CODE` opens the Join flow automatically; submitting name + code enters the estimation UI as a non-owner.
- Copy link button attempts to use the Clipboard API; success feedback may not appear in sandboxed browsers that block `navigator.clipboard`.
- Leave button clears local state and returns to the home screen.

## Future Enhancements
- Optional responsive tweaks (`useIsMobile`), spectator-only URLs, or dark-mode parity.
- README/AGENTS sync is complete; extend docs here as new features land.

---

Need more implementation details? Start with `AGENTS.md` for onboarding or ping the team on the Nightwatch Deck channel.
