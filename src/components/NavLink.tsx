import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<NavLinkProps, "className"> {
  className?: string;
}

/**
 * Accessible, active-aware navigation link using the project's design tokens.
 * Active state: primary colour text + subtle underline indicator.
 */
export const NavLink = forwardRef<HTMLAnchorElement, Props>(
  ({ className, children, ...props }, ref) => (
    <RouterNavLink
      ref={ref}
      {...props}
      className={({ isActive }) =>
        cn(
          "relative px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive
            ? "text-primary font-semibold after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-px after:rounded-full after:bg-primary"
            : "text-foreground/65 hover:text-foreground hover:bg-primary/5",
          className,
        )
      }
    >
      {children}
    </RouterNavLink>
  ),
);

NavLink.displayName = "NavLink";
