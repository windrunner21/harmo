"use client";

import type { MouseEventHandler } from "react";
import { useLinkComponent } from "../HarmoProvider.tsx";

export interface PaginationPageProps {
  page: number;
  label: string;
  current: boolean;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
}

export const PaginationPage = ({ page, label, current, href, onClick }: PaginationPageProps) => {
  const Anchor = useLinkComponent();
  const attributes = {
    className: "hpagination-page",
    "aria-label": label,
    "aria-current": current ? ("page" as const) : undefined,
    onClick,
  };

  return href === undefined ? (
    <button type="button" {...attributes}>
      {page}
    </button>
  ) : (
    <Anchor href={href} {...attributes}>
      {page}
    </Anchor>
  );
};
