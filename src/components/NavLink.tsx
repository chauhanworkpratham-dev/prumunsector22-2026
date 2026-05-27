/**
 * NavLink — an accessible, active-aware navigation anchor.
 *
 * Wraps React Router's NavLink and applies the project's design tokens:
 * - Active: primary colour underline indicator
 * - Hover: smooth colour transition
 * - Keyboard-focusable with visible ring
 *
 * @example
 * <NavLink to="/committees">Committees</NavLink>
 * <NavLink to="/register" className="font-bold">Register</NavLink>
 */
import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<NavLinkProps, "className"> {
  className?: string;
}

export const NavLink = forwardRef<HTMLAnchorElement, Props>(
  ({ className, children, ...props }, ref) => (
    <RouterNavLink
      ref={ref}
      {...props}
      className={({ isActive }) =>
        cn(
          "relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive
            ? "text-primary after:absolute after:inset-x-2 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-gradient-primary"
            : "text-foreground/75 hover:text-primary",
          className,
        )
      }
    >
      {children}
    </RouterNavLink>
  ),
);

NavLink.displayName = "NavLink";
