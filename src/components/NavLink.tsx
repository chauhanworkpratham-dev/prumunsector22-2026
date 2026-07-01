import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<NavLinkProps, "className"> {
  className?: string;
  /** Applied when link is active (token-safe inline style) */
  activeClassName?: string;
  /** Applied when link is active as inline style */
  activeStyle?: React.CSSProperties;
  /** Base inline style */
  style?: React.CSSProperties;
}

/**
 * Active-aware navigation link.
 * Supports activeClassName + activeStyle for token-safe per-theme overrides.
 */
export const NavLink = forwardRef<HTMLAnchorElement, Props>(
  ({ className, activeClassName, activeStyle, style, children, ...props }, ref) => (
    <RouterNavLink
      ref={ref}
      {...props}
      style={({ isActive }) => ({
        ...style,
        ...(isActive ? activeStyle : {}),
      })}
      className={({ isActive }) =>
        cn(
          "relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive ? activeClassName : "",
          className,
        )
      }
    >
      {children}
    </RouterNavLink>
  ),
);

NavLink.displayName = "NavLink";
