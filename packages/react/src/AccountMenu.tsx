"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { DropdownMenu, DropdownMenuSeparator, type DropdownMenuProps } from "./DropdownMenu.tsx";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { withClass } from "./withClass.ts";

export interface AccountMenuProps extends Omit<ComponentPropsWithRef<"button">, "children" | "name"> {
  name: ReactNode;
  description?: ReactNode;
  avatar: ReactNode;
  profile?: boolean;
  align?: DropdownMenuProps["align"];
  children: ReactNode;
}

export const AccountMenu = ({
  name,
  description,
  avatar,
  profile,
  align,
  className,
  children,
  ...props
}: AccountMenuProps) => (
  <DropdownMenu
    align={align}
    trigger={
      <button type="button" {...props} className={withClass("haccount-menu", className)}>
        {avatar}
        <span className="haccount-menu-text">
          <span className="haccount-menu-name">{name}</span>
          {description && <span className="haccount-menu-description">{description}</span>}
        </span>
        <ExpandChevron />
      </button>
    }
  >
    {profile && (
      <>
        <div className="haccount-menu-profile" role="presentation">
          {avatar}
          <span className="haccount-menu-name">{name}</span>
          {description && <span className="haccount-menu-description">{description}</span>}
        </div>
        <DropdownMenuSeparator />
      </>
    )}
    {children}
  </DropdownMenu>
);
