"use client";

import {
  Children,
  isValidElement,
  type ComponentPropsWithRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Chevron } from "./Chevron.tsx";
import { ChevronToArrow } from "./ChevronToArrow.tsx";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { useField } from "./field/Field.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { Spinner } from "./Spinner.tsx";
import { useHold } from "./useHold.ts";
import { useMergedRef } from "./useMergedRef.ts";
import { useWidthChange } from "./useWidthChange.ts";
import { withClass } from "./withClass.ts";

interface ButtonOptions {
  variant?: "secondary" | "tertiary";
  size?: "small";
  destructive?: boolean;
  loading?: boolean;
  commandfor?: string;
  command?:
    | "show-modal"
    | "close"
    | "request-close"
    | "show-popover"
    | "hide-popover"
    | "toggle-popover"
    | `--${string}`;
}

export type ButtonProps =
  | (ButtonOptions &
      ComponentPropsWithRef<"button"> & {
        href?: undefined;
        onHold?: () => void;
        holdDuration?: number;
      })
  | (ButtonOptions &
      ComponentPropsWithRef<"a"> & {
        href: string;
        onHold?: undefined;
        holdDuration?: undefined;
      });

export const Button = ({
  variant,
  size,
  destructive,
  loading,
  onHold,
  holdDuration,
  className,
  children,
  ...props
}: ButtonProps) => {
  const Anchor = useLinkComponent();
  const field = useField(props, { labelled: true });
  const inactive =
    loading ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true";
  const held = useHold(onHold, !!inactive || !!(props as { disabled?: boolean }).disabled);
  // Its own ref, for its width, and yours.
  const ref = useMergedRef(useWidthChange(loading), props.ref as Ref<HTMLElement> | undefined);

  const attributes = {
    className: withClass("hbutton", className),
    "data-variant": variant,
    "data-size": size,
    "data-destructive": destructive ? "" : undefined,
    "aria-busy": loading || undefined,
    "aria-disabled": inactive || undefined,
    "aria-labelledby": field["aria-labelledby"],
    "aria-describedby": field["aria-describedby"],
    onClick: (event: MouseEvent<HTMLButtonElement & HTMLAnchorElement>) => {
      if (inactive) event.preventDefault();
      else props.onClick?.(event);
    },
  };
  const content = renderContent(children, loading);

  if (props.href !== undefined) {
    return (
      <Anchor {...props} {...attributes} ref={ref}>
        {content}
      </Anchor>
    );
  }

  if (!held) {
    return (
      <button type="button" {...props} {...attributes} ref={ref}>
        {content}
      </button>
    );
  }

  const own = props as ComponentPropsWithRef<"button">;
  const handlers = held.handlers;
  return (
      <button
        type="button"
        {...own}
        {...attributes}
        ref={ref}
        data-hold=""
        data-holding={held.holding ? "" : undefined}
        data-held={held.held ? "" : undefined}
        style={
          holdDuration === undefined
            ? own.style
            : ({ ...own.style, "--hbutton-hold-duration": `${holdDuration}ms` } as CSSProperties)
        }
        onPointerDown={(event) => {
          own.onPointerDown?.(event);
          handlers.onPointerDown(event);
        }}
        onPointerUp={(event) => {
          own.onPointerUp?.(event);
          handlers.onPointerUp();
        }}
        onPointerLeave={(event) => {
          own.onPointerLeave?.(event);
          handlers.onPointerLeave();
        }}
        onPointerCancel={(event) => {
          own.onPointerCancel?.(event);
          handlers.onPointerCancel();
        }}
        onContextMenu={(event) => {
          own.onContextMenu?.(event);
          handlers.onContextMenu(event);
        }}
        onClick={(event) => {
          attributes.onClick(event as MouseEvent<HTMLButtonElement & HTMLAnchorElement>);
          handlers.onClick(event);
        }}
        onKeyDown={(event) => {
          own.onKeyDown?.(event);
          handlers.onKeyDown(event);
        }}
        onKeyUp={(event) => {
          own.onKeyUp?.(event);
          handlers.onKeyUp(event);
        }}
        onBlur={(event) => {
          own.onBlur?.(event);
          handlers.onBlur();
        }}
      >
        {content}
        <span className="hbutton-hold" aria-hidden="true">
          {content}
        </span>
      </button>
  );
};


const spinner = <Spinner aria-hidden="true" />;

const renderContent = (children: ReactNode, loading?: boolean) => {
  const label = Children.toArray(children);
  const start = isIcon(label[0]) ? label.shift() : undefined;
  const end = isIcon(label.at(-1)) ? label.pop() : undefined;

  const last = label.length - 1;
  if (typeof label[0] === "string") label[0] = label[0].trimStart();
  if (typeof label[last] === "string") label[last] = label[last].trimEnd();

  if (!label.some((node) => node !== "")) {
    return loading ? spinner : (
      <>
        {start}
        {end}
      </>
    );
  }

  return (
    <>
      {start}
      <span className="hbutton-label">{label}</span>
      {loading && spinner}
      {end}
    </>
  );
};

// From a server component, an icon arrives already rendered to its <svg>.
const iconComponents: unknown[] = [Chevron, ChevronToArrow, ExpandChevron];
const iconClasses = ["hicon", "hexpand-chevron"];

const isIcon = (node: ReactNode) => {
  if (!isValidElement<{ className?: string }>(node)) return false;
  const classes = node.props.className?.split(" ") ?? [];
  return (
    iconComponents.includes(node.type) ||
    classes.some((name) => iconClasses.includes(name))
  );
};
