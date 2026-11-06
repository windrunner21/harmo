// An app brings its own icons. These stand in for them, drawn from the HTML
// playground's SVG files, so both playgrounds show the same ones.

import { createElement, type ComponentPropsWithRef } from "react";
import chevron from "../../html/src/icons/chevron.svg" with { type: "text" };
import close from "../../html/src/icons/close.svg" with { type: "text" };
import error from "../../html/src/icons/error.svg" with { type: "text" };
import info from "../../html/src/icons/info.svg" with { type: "text" };
import more from "../../html/src/icons/more.svg" with { type: "text" };
import plus from "../../html/src/icons/plus.svg" with { type: "text" };
import success from "../../html/src/icons/success.svg" with { type: "text" };
import trash from "../../html/src/icons/trash.svg" with { type: "text" };
import user from "../../html/src/icons/user.svg" with { type: "text" };
import warning from "../../html/src/icons/warning.svg" with { type: "text" };

const icon = (source: string) => {
  const [, attributes = "", body = ""] =
    source.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/) ?? [];
  const own = propsOf(attributes);
  const children = [...body.matchAll(/<(\w+)\b([^>]*?)\s*\/>/g)].map(
    ([, tag = "", parts = ""], index) =>
      createElement(tag, { key: index, ...propsOf(parts) }),
  );
  return (props: ComponentPropsWithRef<"svg">) => (
    <svg {...own} {...props}>
      {children}
    </svg>
  );
};

const propsOf = (source: string) =>
  Object.fromEntries(
    [...source.matchAll(/([^\s="'>/]+)(?:="([^"]*)")?/g)].map(
      ([, name, value]) => [reactName(name ?? ""), value ?? ""],
    ),
  );

// React's names for SVG attributes: stroke-width is strokeWidth.
const reactName = (name: string) =>
  name === "class"
    ? "className"
    : /^(aria|data)-/.test(name)
      ? name
      : name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

export const ChevronIcon = icon(chevron);
export const CloseIcon = icon(close);
export const ErrorIcon = icon(error);
export const InfoIcon = icon(info);
export const MoreIcon = icon(more);
export const PlusIcon = icon(plus);
export const SuccessIcon = icon(success);
export const TrashIcon = icon(trash);
export const UserIcon = icon(user);
export const WarningIcon = icon(warning);
