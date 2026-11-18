"use client";

import { Footer, FooterGroup, type FooterGroupProps } from "@harmo-ui/react";
import type { ReactNode } from "react";

export interface SiteFooterGroup {
  label: string;
  links: FooterGroupProps["links"];
}

export interface SiteFooterProps {
  logo: ReactNode;
  homeHref?: string;
  description?: ReactNode;
  language?: ReactNode;
  groups: SiteFooterGroup[];
  copyright: ReactNode;
  address?: ReactNode;
}

export const SiteFooter = ({ logo, homeHref = "/", description, language, groups, copyright, address }: SiteFooterProps) => (
  <Footer
    className="hsite-footer"
    aria-label="Footer"
    brand={
      <>
        <a href={homeHref}>{logo}</a>
        {description && <p>{description}</p>}
        {language}
      </>
    }
    bottom={
      <>
        <p>{copyright}</p>
        {address && <address>{address}</address>}
      </>
    }
  >
    {groups.map((group) => (
      <FooterGroup key={group.label} label={group.label} links={group.links} />
    ))}
  </Footer>
);
