"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from "react";
import { flatChildren } from "./children.ts";
import { plus } from "./FilterChip.tsx";
import { Popup } from "./Popup.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

type FiltersOverflow =
  | { visibleCount?: undefined; moreLabel?: undefined }
  | { visibleCount: number; moreLabel: string };

export type FiltersProps = ComponentPropsWithRef<"div"> &
  FiltersOverflow & {
    "aria-label": string;
    resetLabel: string;
    onReset?: () => void;
    showReset?: boolean;
  };

const IN_FORCE = ".hfilter-chip-values:not(:empty)";
const CAN_TAKE_FOCUS = ".hfilter-chip:not(:disabled, [hidden])";

export const Filters = ({
  visibleCount,
  moreLabel,
  resetLabel,
  onReset,
  showReset = false,
  className,
  children,
  ref,
  ...props
}: FiltersProps) => {
  const row = useRef<HTMLDivElement>(null);
  const rowRef = useMergedRef(ref, row);
  const more = useRef<HTMLDivElement>(null);
  const [inForce, setInForce] = useState({ all: 0, more: 0 });
  const [resets, setResets] = useState(0);

  const filters = flatChildren(children);
  const shown = visibleCount === undefined ? filters.length : Math.max(0, visibleCount);
  const rest = filters.slice(shown);

  useLayoutEffect(() => {
    const node = row.current;
    if (!node) return;
    const read = () => {
      const all = node.querySelectorAll(IN_FORCE).length;
      const behind = more.current?.querySelectorAll(IN_FORCE).length ?? 0;
      setInForce((was) => (was.all === all && was.more === behind ? was : { all, more: behind }));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (resets > 0) row.current?.querySelector<HTMLElement>(CAN_TAKE_FOCUS)?.focus();
  }, [resets]);

  useEffect(() => {
    const node = more.current;
    if (!node) return;
    const toggled = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      node.querySelector<HTMLElement>(CAN_TAKE_FOCUS)?.focus();
    };
    node.addEventListener("toggle", toggled);
    return () => node.removeEventListener("toggle", toggled);
  }, [rest.length > 0]);

  return (
    <div {...props} ref={rowRef} role="group" className={withClass("hfilters", className)}>
      <Fragment key={resets}>{filters.slice(0, shown)}</Fragment>
      {rest.length > 0 && (
        <Popup
          ref={more}
          className="hfilters-more"
          role="dialog"
          aria-label={moreLabel}
          trigger={
            <button type="button" className="hfilter-chip" aria-haspopup="dialog">
              {plus}
              <span className="hfilter-chip-label">{moreLabel}</span>
              <span className="hfilters-count" hidden={inForce.more === 0}>
                {inForce.more}
              </span>
            </button>
          }
        >
          <Fragment key={resets}>{rest}</Fragment>
        </Popup>
      )}
      <button
        type="button"
        className="hfilters-reset"
        hidden={inForce.all === 0 && !showReset}
        onClick={() => {
          more.current?.hidePopover();
          setResets((count) => count + 1);
          onReset?.();
        }}
      >
        {resetLabel}
      </button>
    </div>
  );
};
