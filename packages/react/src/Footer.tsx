"use client";

import { useEffect, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export interface FooterProps extends Omit<ComponentPropsWithRef<"footer">, "aria-label"> {
  "aria-label"?: string;
  brand?: ReactNode;
  bottom?: ReactNode;
}

const folds = 40;

export const Footer = ({ "aria-label": ariaLabel, brand, bottom, className, children, ref, ...props }: FooterProps) => {
  const footer = useRef<HTMLElement>(null);
  const merged = useMergedRef(footer, ref);

  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    let wide: boolean | undefined;
    const fit = () => {
      const rem = parseFloat(getComputedStyle(element.ownerDocument.documentElement).fontSize) || 16;
      const now = element.clientWidth > folds * rem;
      if (now === wide) return;
      wide = now;
      for (const group of element.querySelectorAll<HTMLDetailsElement>(".hfooter-group")) {
        group.open = now;
        const summary = group.querySelector(":scope > .hfooter-summary");
        if (now) summary?.setAttribute("tabindex", "-1");
        else summary?.removeAttribute("tabindex");
      }
    };
    const keep = (event: MouseEvent) => {
      if (wide && event.target instanceof Element && event.target.closest(".hfooter-summary")) event.preventDefault();
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(element);
    element.addEventListener("click", keep);
    return () => {
      resized.disconnect();
      element.removeEventListener("click", keep);
    };
  }, []);

  return (
    <footer {...props} ref={merged} className={withClass("hfooter", className)}>
      {(brand !== undefined || children !== undefined) && (
        <div className="hfooter-main">
          {brand !== undefined && <div className="hfooter-brand">{brand}</div>}
          {children !== undefined && (
            <nav className="hfooter-groups" aria-label={ariaLabel}>
              {children}
            </nav>
          )}
        </div>
      )}
      {bottom !== undefined && <div className="hfooter-bottom">{bottom}</div>}
    </footer>
  );
};

export interface FooterLink {
  label: ReactNode;
  href: string;
  icon?: ReactNode;
}

export interface FooterGroupProps extends Omit<ComponentPropsWithRef<"details">, "children"> {
  label: ReactNode;
  links: (FooterLink & ComponentPropsWithRef<"a">)[];
}

export const FooterGroup = ({ label, links, className, ...props }: FooterGroupProps) => {
  const Anchor = useLinkComponent();

  return (
    <details {...props} className={withClass("hfooter-group", className)}>
      <summary className="hfooter-summary">
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
