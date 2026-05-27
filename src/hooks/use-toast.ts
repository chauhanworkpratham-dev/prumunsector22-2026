/**
 * Thin wrapper around Sonner (already mounted in App.tsx via <Toaster />).
 *
 * Replaces the previous 186-line hand-rolled global-state reducer with
 * Sonner's own API, which is better tested, supports promises/loading
 * states, and has a 0 ms removal delay (not 1,000,000 ms).
 *
 * Usage is intentionally API-compatible with the old hook so no call-sites
 * need to change:
 *
 *   import { toast } from "@/hooks/use-toast";
 *   toast({ title: "Saved", description: "Your changes are live." });
 *   toast({ title: "Error", variant: "destructive" });
 */
import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

export function toast({ title, description, variant, duration }: ToastOptions) {
  const message = title ?? "";
  const opts = { description, duration };

  if (variant === "destructive") {
    return sonnerToast.error(message, opts);
  }
  return sonnerToast(message, opts);
}

/**
 * useToast() kept for backward compatibility with any component that
 * destructures `{ toast }` from the hook.
 */
export function useToast() {
  return { toast };
}
