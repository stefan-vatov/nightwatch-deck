import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

type ThemeMode = "light" | "dark"

type ThemeToggleProps = {
  theme: ThemeMode
  onToggle: (mode: ThemeMode) => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => onToggle(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full border border-border/60 bg-background/80 px-1 text-foreground shadow-sm transition",
        "hover:border-primary/60 hover:shadow-md"
      )}
    >
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-all",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
      >
        <Sun
          className={cn(
            "absolute h-4 w-4 transition-all",
            isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all",
            isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        />
      </span>
    </button>
  )
}

