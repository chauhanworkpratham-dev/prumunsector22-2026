import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  activeStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

export const NavLink = forwardRef<HTMLAnchorElement, Props>(
  ({ className, activeClassName, activeStyle, style, children, ...props }, ref) => (
    <RouterNavLink
      ref={ref}
      {...props}
      style={({ isActive }) => ({ ...style, ...(isActive ? activeStyle : {}) })}
      className={({ isActive }) =>
        cn(
          "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
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
