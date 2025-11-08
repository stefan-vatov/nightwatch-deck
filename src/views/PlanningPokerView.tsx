import { useEffect, useState } from "react"
import { PlanningPokerApp } from "@/components/generated/PlanningPokerApp"
import { ThemeToggle } from "@/components/ThemeToggle"

type ThemeMode = "light" | "dark"
const THEME_STORAGE_KEY = "nightwatch-theme"

export function PlanningPokerView() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light"
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <section className="relative isolate overflow-hidden rounded-[2.75rem] border border-border/60 bg-card/95 px-4 py-8 shadow-[0_45px_120px_-60px_rgba(15,23,42,1)] backdrop-blur-sm sm:px-8 lg:px-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-6 rounded-[2.25rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_55%)] blur-3xl dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.25),_transparent_55%)]"
      />

      <div className="relative z-10 flex flex-wrap items-start gap-6 border-b border-border/70 pb-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Sprint rituals
          </p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Planning Poker</h1>
          <p className="text-sm text-muted-foreground">
            Create a room, invite your squad, and keep estimation deliberate.
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <span className="hidden text-xs font-medium sm:inline">Theme</span>
          <ThemeToggle theme={theme} onToggle={setTheme} />
        </div>
      </div>

      <div className="relative z-10 pt-8">
        <PlanningPokerApp />
      </div>
    </section>
  )
}
