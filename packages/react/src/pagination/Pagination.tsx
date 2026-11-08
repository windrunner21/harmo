import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { Button } from "../Button.tsx";
import { Chevron } from "../Chevron.tsx";
import { withClass } from "../withClass.ts";
import { PaginationPage } from "./PaginationPage.tsx";

type Numbering =
  | { numbered: true; pageLabel: (page: number) => string }
  | { numbered?: false; pageLabel?: undefined };

export type PaginationProps = Omit<ComponentPropsWithRef<"nav">, "children"> &
  Numbering & {
    "aria-label": string;
    page: number;
    pageCount: number;
    href?: (page: number) => string;
    onPageChange?: (page: number) => void;
    previousLabel: ReactNode;
    nextLabel: ReactNode;
  };

// The first and last pages, and the one you're on with one either side; a
// gap stands for two or more pages, so there are always seven.
const paginationItems = (page: number, pageCount: number): (number | "gap")[] => {
  const pages = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
  if (pageCount <= 7) return pages(1, pageCount);
  if (page <= 4) return [...pages(1, 5), "gap", pageCount];
  if (page >= pageCount - 3) return [1, "gap", ...pages(pageCount - 4, pageCount)];
  return [1, "gap", page - 1, page, page + 1, "gap", pageCount];
};

export const Pagination = ({
  page,
  pageCount,
  href,
  onPageChange,
  numbered,
  pageLabel,
  previousLabel,
  nextLabel,
  className,
  ...props
}: PaginationProps) => {
  // A link is followed, unless onPageChange takes a plain click instead; a
  // click with a modifier key, such as to open a new tab, is the browser's.
  const go = (to: number) =>
    onPageChange &&
    ((event: MouseEvent<HTMLElement>) => {
      if (href && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      event.preventDefault();
      if (to !== page) onPageChange(to);
    });

  const step = (to: number, rel: "prev" | "next") => {
    const blocked = to < 1 || to > pageCount;
    return {
      variant: "secondary" as const,
      "aria-disabled": blocked || undefined,
      ...(href && { href: href(blocked ? page : to), rel: blocked ? undefined : rel }),
      onClick: blocked ? undefined : go(to),
    };
  };

  return (
    <nav {...props} className={withClass("hpagination", className)}>
      <Button {...step(page - 1, "prev")}>
        <Chevron direction="back" />
        {previousLabel}
      </Button>
      {numbered && (
        <ul className="hpagination-pages">
          {paginationItems(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <li key={index < 3 ? "start-gap" : "end-gap"} className="hpagination-ellipsis" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <PaginationPage
                  page={item}
                  label={pageLabel(item)}
                  current={item === page}
                  href={href?.(item)}
                  onClick={go(item)}
                />
              </li>
            ),
          )}
        </ul>
      )}
      <Button {...step(page + 1, "next")}>
        {nextLabel}
        <Chevron />
      </Button>
    </nav>
  );
};
