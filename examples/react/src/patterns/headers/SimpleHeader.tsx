"use client";

import { Header, type HeaderProps } from "@harmo-ui/react";
import type { ReactNode } from "react";

export interface SimpleHeaderProps {
  logo: ReactNode;
  homeHref?: string;
  action?: ReactNode;
  scroll?: HeaderProps["scroll"];
}

export const SimpleHeader = ({ logo, homeHref = "/", action, scroll = "away" }: SimpleHeaderProps) => (
  <Header className="hsimple-header" scroll={scroll} brand={<a href={homeHref}>{logo}</a>} actions={action} />
);
