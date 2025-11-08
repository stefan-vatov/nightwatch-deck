# Nightwatch Deck – Planning Poker

![Nightwatch Deck Planning Poker UI](public/deck.png)

Nightwatch Deck now ships as a collaborative Planning Poker surface for sprint estimation. The legacy Mission Overview / Agent Briefing screens and the standalone `prototype/` folder have been removed—the app boots directly into the estimation experience hosted under `src/components/generated/PlanningPokerApp.tsx`.

## Feature Highlights
- Create or join estimation rooms via short alphanumeric codes (URL query string `?room=CODE` supported).
- Real-time state is powered by a Cloudflare Worker + Durable Object, so every participant in a room stays in sync over WebSockets.
- Room owners control reveal (gated on everyone submitting a vote) and can reset the round whenever they need to restart discussion.
- Fibonacci card deck with framer-motion micro-interactions.
- Clipboard helper for sharing room links (auto-selects `window.location.origin` + code).
- Built-in light/dark theme toggle with persisted preference so squads can estimate in their preferred mode.

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
npm run dev:worker  # launches the Cloudflare Worker/Durable Object on http://127.0.0.1:8787 (forced via --port)
npm run dev:app     # Vite dev server wired to the worker via VITE_WS_BASE
npm run dev:stack   # runs dev:worker + dev:app together (recommended)
npm run stack:stop  # stops any lingering Vite/Wrangler/workerd processes
npm run worker:deploy # deploy the Durable Object worker via wrangler.worker.toml
npm run pages:deploy # build + push the static site to Cloudflare Pages (reads .env.production)
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
npm run pages:dev    # builds dist/ then runs `wrangler pages dev dist --env-file .env.production`
```

### 4. Deploy to Cloudflare Pages + Worker
```bash
# optional one-time setup if the Pages project doesn't exist yet
wrangler pages project create nightwatch-deck --production-branch main

npm run worker:deploy  # deploy the Durable Object worker (wrangler.worker.toml)
npm run pages:deploy   # build + wrangler pages deploy dist --env-file .env.production
```
- Deploy the Durable Object worker first so the binding + migrations in `wrangler.worker.toml` (uses `new_sqlite_classes` for free-plan DOs) exist in your account.
- After the worker is live, set `VITE_WS_BASE` in your Pages project's environment variables to the worker's URL (for example, `https://nightwatch-deck-worker.YOUR_SUBDOMAIN.workers.dev`).
- Copy `.env.production.example` to `.env.production`, set the same `VITE_WS_BASE`, and keep the file locally (it is gitignored) so CLI deployments inject the correct origin.
- `npm run pages:deploy` uploads the static `dist/` bundle to Pages; re-run `worker:deploy` whenever the Durable Object schema changes (bump the migration tag in `wrangler.worker.toml`).

## Project Layout
| Path                                            | Purpose                                                                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                                   | Minimal shell that renders `<PlanningPokerView />` inside the global layout.                                                       |
| `src/views/PlanningPokerView.tsx`               | Provides the gradient container, renders the generated app, and hosts a persisted light/dark `ThemeToggle`.                        |
| `src/components/generated/PlanningPokerApp.tsx` | Planning Poker UI + WebSocket client: room creation/join, voting grid, reveal/reset, clipboard helper.                             |
| `src/lib/utils.ts`                              | `cn` plus theming helpers (`ensureLightMode()`, `removeDarkClasses()`) used by shared UI.                                          |
| `src/components/ui/`                            | shadcn/ui-inspired Button/Card primitives used throughout the experience.                                                          |
| `src/index.css` / `src/App.css`                 | Tailwind v4 base import, design tokens, and full-height layout helpers.                                                            |
| `shared/planning-poker.ts`                      | Shared TypeScript contracts for estimation cards, participants, and WebSocket message payloads (used by the React app and Worker). |
| `functions/_worker.ts`                          | Cloudflare Worker entry that routes `/ws/:roomId` to the `RoomDurableObject`, manages participant state, and broadcasts updates.   |
| `wrangler.toml`                                 | Cloudflare Pages configuration (build output + compatibility date).                                                                |
| `wrangler.worker.toml`                          | Worker + Durable Object config (`functions/_worker.ts`, migrations, bindings).                                                     |

See `AGENTS.md` (canonical playbook) for deeper architectural notes.

## Manual QA Checklist (latest session)
- Create room → select card → reveal/reset works across two browser windows connected to the same room id.
- Visiting `/?room=CODE` opens the Join flow automatically; submitting name + code establishes the WebSocket and enters the estimation UI as a non-owner.
- WebSocket disconnects surface an inline error banner and return you to the Join screen for a clean retry.
- Copy link button attempts to use the Clipboard API; success feedback may not appear in sandboxed browsers that block `navigator.clipboard`.
- Leave button clears local state, closes the socket, and returns to the home screen.

---

Need more implementation details? Start with `AGENTS.md` for onboarding.
