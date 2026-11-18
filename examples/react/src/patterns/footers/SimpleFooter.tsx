"use client";

import { Footer, type FooterLink } from "@harmo-ui/react";
import type { ReactNode } from "react";

export interface SimpleFooterProps {
  copyright: ReactNode;
  links: FooterLink[];
}

export const SimpleFooter = ({ copyright, links }: SimpleFooterProps) => (
  <Footer
    className="hsimple-footer"
    bottom={
      <>
        <p>{copyright}</p>
        <nav aria-label="Legal">
          <ul className="hfooter-bottom-links">
            {links.map((link) => (
              <li key={link.href}>
                <a className="hfooter-link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </>
    }
  />
);
