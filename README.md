# Nightwatch Deck – Planning Poker

Nightwatch Deck now ships as a collaborative Planning Poker surface for sprint estimation. The legacy Mission Overview / Agent Briefing screens and the standalone `prototype/` folder have been removed—the app boots directly into the estimation experience hosted under `src/components/generated/PlanningPokerApp.tsx`.

## Feature Highlights
- Create or join estimation rooms via short alphanumeric codes (URL query string `?room=CODE` supported).
- Real-time state is powered by a Cloudflare Worker + Durable Object, so every participant in a room stays in sync over WebSockets.
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
- **Persistence**: Cloudflare Pages + Worker + Durable Object (`functions/_worker.ts`) keeps `{participants, votes, round}` in-memory and fans out updates to every WebSocket client.

## Getting Started
```bash
npm install
npm run dev         # plain Vite dev server (no backend)
npm run dev:worker  # launches the Cloudflare Worker/Durable Object on http://127.0.0.1:8787
npm run dev:app     # Vite dev server wired to the worker via VITE_WS_BASE
npm run dev:stack   # runs dev:worker + dev:app together (recommended)
npm run stack:stop  # stops any lingering Vite/Wrangler/workerd processes
npm run lint        # eslint .
npm run build       # type-check + production build
npm run preview     # serve the dist/ build locally
```

`npm run dev`/`dev:app` run Vite with `--port 5173 --strictPort`, so the command will error out if something else is already bound there. Use `npm run stack:stop` (or close the conflicting process) before restarting the stack.
Local WebSockets default to `window.location.origin`, so the Vite dev server needs to point at the Worker during development. The `dev:app` and `dev:stack` scripts set `VITE_WS_BASE=http://127.0.0.1:8787` automatically so the browser reuses the Wrangler dev tunnel.

## Development Workflows

### 1. First-time setup
```bash
npm install
npx wrangler login   # authenticate once with your Cloudflare account
```

### 2. Standard local hacking (Vite + Worker)
```bash
npm run dev:stack    # runs wrangler dev + Vite with the correct VITE_WS_BASE
```
- Need individual control? Run `npm run dev:worker` and `npm run dev:app` in separate terminals.
- Ports locked up? Run `npm run stack:stop` to kill straggler processes before restarting (Vite uses a strict 5173 binding).
- The Worker logs every `join`/`vote`/`reset` call so you can trace socket traffic while interacting with the UI at `http://127.0.0.1:5173`.

### 3. Cloudflare Pages simulator
Run the production bundle + Worker together through Pages’ emulator (requires the Worker build artifacts):
```bash
npm run pages:dev    # builds dist/ then runs `wrangler pages dev dist --config wrangler.toml`
```

### 4. Deploy to Cloudflare Pages
```bash
# optional one-time setup if the Pages project doesn't exist yet
wrangler pages project create nightwatch-deck --production-branch main

npm run pages:deploy   # builds + wrangler pages deploy dist --config wrangler.toml
```
- The deploy script runs `npm run build`, uploads `dist/`, applies the Durable Object migration `v1`, and publishes the Worker+Pages combo.
- Future Durable Object schema changes should bump the migration info inside `wrangler.toml` before running `pages:deploy` again.

## Project Layout
| Path | Purpose |
| ---- | ------- |
| `src/App.tsx` | Minimal shell that renders `<PlanningPokerView />` inside the global layout. |
| `src/views/PlanningPokerView.tsx` | Calls `ensureLightMode()` on mount and provides the gradient container + spacing for the generated app. |
| `src/components/generated/PlanningPokerApp.tsx` | Planning Poker UI + WebSocket client: room creation/join, voting grid, reveal/reset, clipboard helper. |
| `src/lib/utils.ts` | `cn`, `ensureLightMode()`, and `removeDarkClasses()` utilities. |
| `src/components/ui/` | shadcn/ui-inspired Button/Card primitives used throughout the experience. |
| `src/index.css` / `src/App.css` | Tailwind v4 base import, design tokens, and full-height layout helpers. |
| `shared/planning-poker.ts` | Shared TypeScript contracts for estimation cards, participants, and WebSocket message payloads (used by the React app and Worker). |
| `functions/_worker.ts` | Cloudflare Worker entry that routes `/ws/:roomId` to the `RoomDurableObject`, manages participant state, and broadcasts updates. |
| `wrangler.toml` | Cloudflare Pages configuration + Durable Object binding/migrations. |

See `AGENTS.md` (canonical playbook) for deeper architectural notes and `PLANNING_POKER_MIGRATION_PLAN.md` for the original migration rationale.

## Manual QA Checklist (latest session)
- Create room → select card → reveal/reset works across two browser windows connected to the same room id.
- Visiting `/?room=CODE` opens the Join flow automatically; submitting name + code establishes the WebSocket and enters the estimation UI as a non-owner.
- WebSocket disconnects surface an inline error banner and return you to the Join screen for a clean retry.
- Copy link button attempts to use the Clipboard API; success feedback may not appear in sandboxed browsers that block `navigator.clipboard`.
- Leave button clears local state, closes the socket, and returns to the home screen.

## Future Enhancements
- Optional responsive tweaks (`useIsMobile`), spectator-only URLs, or dark-mode parity.
- Consider persisting rounds (e.g., Durable Object storage or D1) if you want history beyond the in-memory session.
- README/AGENTS sync is complete; extend docs here as new features land.

---

Need more implementation details? Start with `AGENTS.md` for onboarding or ping the team on the Nightwatch Deck channel.
