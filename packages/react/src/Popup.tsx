"use client";

import {
  cloneElement,
  useId,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactElement,
} from "react";
import { withClass } from "./withClass.ts";

interface PopupTrigger {
  popoverTarget?: string;
  "aria-expanded"?: boolean;
  style?: CSSProperties;
}

export interface PopupProps extends ComponentPropsWithRef<"div"> {
  trigger: ReactElement<PopupTrigger>;
}

export const Popup = ({
  trigger,
  id,
  className,
  style,
  onBeforeToggle,
  children,
  ...props
}: PopupProps) => {
  const generatedId = useId();
  const popupId = id ?? generatedId;
  const anchor = `--${generatedId}`;
  const [open, setOpen] = useState(false);

  return (
    <>
      {cloneElement(trigger, {
        popoverTarget: popupId,
        "aria-expanded": open,
        style: { ...trigger.props.style, anchorName: anchor } as CSSProperties,
      })}
      <div
        {...props}
        className={withClass("hpopup", className)}
        id={popupId}
        popover=""
        style={{ ...style, positionAnchor: anchor } as CSSProperties}
        onBeforeToggle={(event) => {
          onBeforeToggle?.(event);
          if (event.defaultPrevented) return;
          const opening = event.newState === "open";
          setOpen(opening);
          if (opening) placeSide(event.currentTarget);
        }}
      >
        {children}
      </div>
    </>
  );
};

export const popupTrigger = (popup: HTMLElement) =>
  Array.from(
    popup.ownerDocument.querySelectorAll<HTMLElement>(
      `[popovertarget="${CSS.escape(popup.id)}"]`,
    ),
  ).find((element) => !popup.contains(element));

const placeSide = (popup: HTMLElement) => {
  const trigger = popupTrigger(popup);
  if (!trigger) return;

  const popupBox = popup.getBoundingClientRect();
  const triggerBox = trigger.getBoundingClientRect();
  const side =
    popupBox.top + popupBox.height / 2 < triggerBox.top + triggerBox.height / 2
      ? "top"
      : "bottom";
  if (popup.dataset.side === side) return;

  popup.style.transition = "none";
  popup.dataset.side = side;
  popup.getBoundingClientRect();
  popup.style.transition = "";
};
