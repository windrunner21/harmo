"use client";

import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { renders } from "./children.ts";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

type Layout = "wide" | "folded";

const FooterLayout = createContext<Layout | undefined>(undefined);

export interface FooterProps extends Omit<ComponentPropsWithRef<"footer">, "aria-label"> {
  "aria-label"?: string;
  brand?: ReactNode;
  bottom?: ReactNode;
}

export const Footer = ({ "aria-label": ariaLabel, brand, bottom, className, children, ref, ...props }: FooterProps) => {
  const footer = useRef<HTMLElement>(null);
  const merged = useMergedRef(footer, ref);
  const [layout, setLayout] = useState<Layout>();
  const hasBrand = renders(brand);
  const hasGroups = renders(children);

  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    const fit = () => {
      const groups = element.querySelector(":scope > .hfooter-main > .hfooter-groups");
      if (!groups) return;
      const now = getComputedStyle(groups).getPropertyValue("--hfooter-layout").trim();
      if (now === "wide" || now === "folded") setLayout(now);
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(element);
    return () => resized.disconnect();
  }, [hasGroups]);

  return (
    <footer {...props} ref={merged} className={withClass("hfooter", className)}>
      {(hasBrand || hasGroups) && (
        <div className="hfooter-main">
          {hasBrand && <div className="hfooter-brand">{brand}</div>}
          {hasGroups && (
            <nav className="hfooter-groups" aria-label={ariaLabel}>
              <FooterLayout value={layout}>{children}</FooterLayout>
            </nav>
          )}
        </div>
      )}
      {renders(bottom) && <div className="hfooter-bottom">{bottom}</div>}
    </footer>
  );
};

export interface FooterLink {
  label: ReactNode;
  href: string;
  icon?: ReactNode;
}

export interface FooterGroupProps extends Omit<ComponentPropsWithRef<"details">, "children" | "name"> {
  label: ReactNode;
  links: (FooterLink & ComponentPropsWithRef<"a">)[];
}

export const FooterGroup = ({ label, links, className, ref, ...props }: FooterGroupProps) => {
  const Anchor = useLinkComponent();
  const layout = use(FooterLayout);
  const group = useRef<HTMLDetailsElement>(null);
  const merged = useMergedRef(group, ref);

  useEffect(() => {
    if (group.current && layout) group.current.open = layout === "wide";
  }, [layout]);

  return (
    <details {...props} ref={merged} className={withClass("hfooter-group", className)}>
      <summary
        className="hfooter-summary"
        tabIndex={layout === "wide" ? -1 : undefined}
        onClick={(event) => {
          if (layout === "wide") event.preventDefault();
        }}
      >
        <h2 className="hfooter-heading">{label}</h2>
        <ExpandChevron />
      </summary>
      <ul className="hfooter-links">
        {links.map(({ label: text, href, icon, className: linkClass, ...link }) => (
          <li key={href}>
            <Anchor {...link} href={href} className={withClass("hfooter-link", linkClass)}>
              {icon}
              {text}
            </Anchor>
          </li>
        ))}
      </ul>
    </details>
  );
};
