import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Forces the document into light mode by removing/toggling the `dark` class.
 * Useful for components (like Planning Poker) that assume light-only styling.
 */
export function ensureLightMode() {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", false)
}

/**
 * Strips any `dark:` prefixed Tailwind classes from a className string.
 * Helps keep generated markup light-mode only after merging classnames.
 */
export function removeDarkClasses(className: string) {
  return className
    .split(" ")
    .filter(cls => cls && !cls.startsWith("dark:"))
    .join(" ")
}
