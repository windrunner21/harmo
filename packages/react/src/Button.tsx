"use client";

import {
  Children,
  isValidElement,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Chevron } from "./Chevron.tsx";
import { ChevronToArrow } from "./ChevronToArrow.tsx";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { useField } from "./field/Field.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { Spinner } from "./Spinner.tsx";
import { withClass } from "./withClass.ts";

interface ButtonOptions {
  variant?: "secondary" | "tertiary";
  size?: "small";
  loading?: boolean;
}

export type ButtonProps =
  | (ButtonOptions & ComponentPropsWithRef<"button"> & { href?: undefined })
  | (ButtonOptions & ComponentPropsWithRef<"a"> & { href: string });

export const Button = ({
  variant,
  size,
  loading,
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

  const attributes = {
    className: withClass("hbutton", className),
    "data-variant": variant,
    "data-size": size,
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
      <Anchor {...props} {...attributes}>
        {content}
      </Anchor>
    );
  }

  return (
    <button type="button" {...props} {...attributes}>
      {content}
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
