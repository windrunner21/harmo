"use client";

import { useImperativeHandle, type ComponentPropsWithRef } from "react";
import { flatChildren } from "../children.ts";
import { useLinkComponent } from "../HarmoProvider.tsx";
import { withClass } from "../withClass.ts";
import { useTabsMotion } from "./useTabsMotion.ts";

export interface TabNavProps extends ComponentPropsWithRef<"nav"> {
  alwaysShow?: boolean;
}

export const TabNav = ({
  alwaysShow = false,
  ref,
  className,
  hidden,
  children,
  ...props
}: TabNavProps) => {
  const motion = useTabsMotion<HTMLElement>();
  useImperativeHandle(ref, () => motion.ref.current as HTMLElement, []);
  const alone = !alwaysShow && flatChildren(children).length <= 1;

  return (
    <nav
      {...props}
      ref={motion.ref}
      className={withClass("htabs", className)}
      hidden={hidden || alone || undefined}
    >
      <ul
        onPointerOver={motion.onPointerOver}
        onPointerLeave={motion.onPointerLeave}
      >
        {children}
      </ul>
      <span className="htabs-highlight" aria-hidden="true" />
      <span className="htabs-indicator" aria-hidden="true" />
    </nav>
  );
};

export interface TabLinkProps extends ComponentPropsWithRef<"a"> {
  href: string;
  current?: boolean;
}

export const TabLink = ({ current, ...props }: TabLinkProps) => {
  const Anchor = useLinkComponent();

  return (
    <li>
      <Anchor {...props} aria-current={current ? "page" : undefined} />
    </li>
  );
};
