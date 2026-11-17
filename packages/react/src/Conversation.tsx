"use client";

import { Children, useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button } from "./Button.tsx";
import { arrowDown } from "./icons.ts";
import { ConversationOpening } from "./Message.tsx";
import { Tooltip } from "./Tooltip.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export interface ConversationProps extends Omit<ComponentPropsWithRef<"div">, "aria-label"> {
  "aria-label": string;
  latestLabel: string;
  status?: ReactNode;
  empty?: ReactNode;
  align?: "start" | "end";
  size?: "default" | "large";
  onJump?: () => void;
}

const nearEnd = 32;

const motion = (): ScrollBehavior =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";

const LatestIcon = ({ className }: { className: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 25 25" fill="none" aria-hidden="true" focusable="false">
    {arrowDown.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

const sentBy = (records: MutationRecord[], list: Element) =>
  records.some(
    (record) =>
      record.target === list &&
      [...record.addedNodes].some((node) => node instanceof Element && node.matches('.hmessage[data-from="user"]')),
  );

export const Conversation = ({
  latestLabel,
  status,
  empty,
  align,
  size,
  onJump,
  className,
  children,
  ref,
  onScroll,
  ...props
}: ConversationProps) => {
  const scroller = useRef<HTMLDivElement>(null);
  const merged = useMergedRef(scroller, ref);
  const list = useRef<HTMLOListElement>(null);
  const atEnd = useRef(true);
  const jumping = useRef(false);
  const [away, setAway] = useState(false);
  const [opened, setOpened] = useState(false);
  const none = Children.toArray(children).length === 0;

  useEffect(() => setOpened(true), []);

  useLayoutEffect(() => {
    const element = scroller.current;
    const messages = list.current;
    if (!element || !messages) return;
    const follow = () => {
      if (!atEnd.current) return;
      if (jumping.current) element.scrollTo({ top: element.scrollHeight, behavior: motion() });
      else element.scrollTop = element.scrollHeight;
    };
    const interrupt = (event: Event) => {
      if (!(event.target instanceof Element && event.target.closest(".hconversation-latest"))) jumping.current = false;
    };
    const interruptions = ["wheel", "touchstart", "pointerdown", "keydown"];
    for (const type of interruptions) element.addEventListener(type, interrupt, { passive: true });
    const resizes = new ResizeObserver(follow);
    resizes.observe(element);
    resizes.observe(messages);
    const changes = new MutationObserver((records) => {
      if (sentBy(records, messages)) {
        atEnd.current = true;
        setAway(false);
      }
      follow();
    });
    changes.observe(messages, { childList: true, subtree: true, characterData: true });
    follow();
    return () => {
      resizes.disconnect();
      changes.disconnect();
      for (const type of interruptions) element.removeEventListener(type, interrupt);
    };
  }, []);

  const jump = () => {
    const element = scroller.current;
    if (!element) return;
    jumping.current = true;
    atEnd.current = true;
    setAway(false);
    element.scrollTo({ top: element.scrollHeight, behavior: motion() });
    onJump?.();
  };

  return (
    <div
      {...props}
      ref={merged}
      className={withClass("hconversation", className)}
      role="region"
      tabIndex={0}
      data-align={align === "end" ? "end" : undefined}
      data-size={size === "large" ? "large" : undefined}
      onScroll={(event) => {
        onScroll?.(event);
        const element = event.currentTarget;
        const near = element.scrollHeight - element.scrollTop - element.clientHeight < nearEnd;
        if (jumping.current) {
          if (near) jumping.current = false;
          return;
        }
        atEnd.current = near;
        setAway(!near);
      }}
    >
      <p className="hconversation-status" aria-live="polite">
        {status}
      </p>
      {none && empty !== undefined && <div className="hconversation-empty">{empty}</div>}
      <ol ref={list} className="hconversation-list" hidden={none}>
        <ConversationOpening value={!opened}>{children}</ConversationOpening>
      </ol>
      <div className="hconversation-latest" data-open={away ? "" : undefined}>
        <Tooltip label={latestLabel}>
          <Button variant="secondary" onClick={jump}>
            <LatestIcon className="hicon" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
