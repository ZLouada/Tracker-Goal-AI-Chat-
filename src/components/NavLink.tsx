import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props extends NavLinkProps {
  activeClassName?: string;
}

export function NavLink({ className, activeClassName, ...rest }: Props) {
  return (
    <RouterNavLink
      {...rest}
      className={({ isActive }) =>
        cn(
          typeof className === "string" ? className : "",
          isActive && activeClassName
        )
      }
    />
  );
}
