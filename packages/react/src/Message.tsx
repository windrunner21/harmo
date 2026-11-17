"use client";

import { createContext, useContext, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { renders } from "./children.ts";
import { useAddedLater, useInBrowser } from "./useAddedLater.ts";
import { withClass } from "./withClass.ts";

interface MessageOptions extends Omit<ComponentPropsWithRef<"li">, "children"> {
  from: "user" | "assistant" | "system";
  bubble?: boolean;
  accent?: boolean;
  avatar?: ReactNode;
  time?: Date;
  files?: ReactNode;
  actions?: ReactNode;
  failed?: { message: ReactNode; retryLabel: ReactNode; onRetry: () => void };
  typing?: boolean;
  busy?: boolean;
  children?: ReactNode;
}

export type MessageProps = MessageOptions &
  ({ suggestions?: undefined; suggestionsLabel?: undefined } | { suggestions: ReactNode; suggestionsLabel: string });

const clock = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

export const ConversationOpening = createContext(false);

export const Message = ({
  from,
  bubble,
  accent,
  avatar,
  time,
  files,
  actions,
  suggestions,
  suggestionsLabel,
  failed,
  typing,
  busy,
  className,
  children,
  onAnimationEnd,
  ...props
}: MessageProps) => {
  const later = useAddedLater();
  const inBrowser = useInBrowser();
  const opening = useContext(ConversationOpening);
  const [added] = useState(() => later && !opening);
  const [settled, setSettled] = useState(false);
  const classes = withClass("hmessage", className);

  if (from === "system") {
    return (
      <li {...props} className={classes} data-from="system">
        {children}
      </li>
    );
  }

  return (
    <li
      {...props}
      className={classes}
      data-from={from}
      data-bubble={bubble ? "" : undefined}
      data-accent={accent ? "" : undefined}
      data-new={added && !settled ? "" : undefined}
      aria-hidden={typing || props["aria-hidden"] || undefined}
      onAnimationEnd={(event) => {
        onAnimationEnd?.(event);
        if (event.target === event.currentTarget) setSettled(true);
      }}
    >
      {avatar !== undefined && (
        <span className="hmessage-avatar" aria-hidden={avatar ? undefined : true}>
          {avatar}
        </span>
      )}
      <div className="hmessage-body">
        {files}
        {typing ? (
          <p className="hmessage-text hmessage-typing">
            <span />
            <span />
            <span />
          </p>
        ) : (
          renders(children) && (
            <div className="hmessage-text" aria-busy={busy || undefined}>
              {children}
            </div>
          )
        )}
        {time && (
          <time className="hmessage-time" dateTime={time.toISOString()}>
            {inBrowser ? clock.format(time) : null}
          </time>
        )}
        {actions && <div className="hmessage-actions">{actions}</div>}
        {failed && (
          <p className="hmessage-failed">
            {failed.message}{" "}
            <button type="button" className="hlink" onClick={failed.onRetry}>
              {failed.retryLabel}
            </button>
          </p>
        )}
        {suggestions && (
          <div className="hmessage-suggestions" role="group" aria-label={suggestionsLabel}>
            {suggestions}
          </div>
        )}
      </div>
    </li>
  );
};
