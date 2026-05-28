import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (handles conflicts like p-2 + p-4 → p-4). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display in the Indian locale.
 * @example formatDate(new Date()) // "27 May 2026"
 */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

/**
 * Format a date+time for India Standard Time.
 * @example formatDateTime(new Date()) // "27 May 2026, 09:30 AM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate a string to `max` characters, appending an ellipsis if needed.
 */
export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max).trimEnd()}…` : str;
}

/**
 * Convert a snake_case or camelCase string to Title Case with spaces.
 * @example prettify("vice_chairperson") // "Vice Chairperson"
 */
export function prettify(str: string): string {
  return str
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Pause for `ms` milliseconds — useful in async retry flows.
 */
export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Return the initials of a full name (up to 2 chars).
 * @example initials("Rahul Gandhi") // "RG"
 */
export function initials(name: string): string {
  const clean = name.includes("@") ? name.split("@")[0] : name;
  return clean
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");
}
