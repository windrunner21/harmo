"use client";
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button } from "./Button.tsx";
import { close as closePaths } from "./icons.ts";
import { withClass } from "./withClass.ts";

interface DialogCommand {
  commandfor?: string;
  command?: string;
}

const DialogContext = createContext<string | undefined>(undefined);

export interface DialogProps
  extends Omit<
    ComponentPropsWithRef<"dialog">,
    "open" | "onToggle" | "onBeforeToggle"
  > {
  label: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  trigger?: ReactElement<DialogCommand>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onToggle?: (event: ToggleEvent) => void;
  onBeforeToggle?: (event: ToggleEvent) => void;
  footer?: ReactNode;
  form?: ComponentPropsWithRef<"form">;
  bodyProps?: ComponentPropsWithRef<"div">;
}

const closeIcon = (
  <svg
    className="hicon"
    width="24"
    height="24"
    viewBox="0 0 25 25"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    {closePaths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

interface Closing {
  current: object | null;
}

const fadeThenClose = (
  element: HTMLDialogElement,
  closing: Closing,
  returnValue?: string,
) => {
  if (closing.current) return;
  const token = {};
  closing.current = token;
  element.setAttribute("data-closing", "");
  requestAnimationFrame(() => {
    const fading = element
      .getAnimations()
      .map((animation) => animation.finished.catch(() => {}));
    const seconds = Math.max(
      0,
      ...getComputedStyle(element).transitionDuration.split(",").map(parseFloat),
    );
    const longest = new Promise((resolve) =>
      setTimeout(resolve, seconds * 1000 + 100),
    );
    Promise.race([Promise.all(fading), longest]).then(() => {
      if (closing.current !== token) return;
      closing.current = null;
      element.close(returnValue);
      element.removeAttribute("data-closing");
    });
  });
};

export const Dialog = ({
  label,
  description,
  closeLabel,
  trigger,
  open,
  onOpenChange,
  onToggle,
  onBeforeToggle,
  footer,
  form,
  bodyProps,
  closedby = "any",
  id,
  className,
  ref,
  children,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: DialogProps) => {
  const generated = useId();
  const dialogId = id ?? generated;
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const dialog = useRef<HTMLDialogElement | null>(null);
  const closing = useRef<object | null>(null);

  const toggled = useEffectEvent((event: Event) => {
    onToggle?.(event as ToggleEvent);
    onOpenChange?.((event as ToggleEvent).newState === "open");
  });
  const toggling = useEffectEvent((event: Event) =>
    onBeforeToggle?.(event as ToggleEvent),
  );

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const after = (event: Event) => toggled(event);
    const before = (event: Event) => toggling(event);
    const cancelled = (event: Event) => {
      if (!event.cancelable) return;
      event.preventDefault();
      fadeThenClose(element, closing);
    };
    const submitted = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (event.defaultPrevented || form.method !== "dialog") return;
      if (form.closest("dialog") !== element) return;
      event.preventDefault();
      const submitter = event.submitter as HTMLButtonElement | null;
      fadeThenClose(
        element,
        closing,
        submitter?.hasAttribute("value") ? submitter.value : undefined,
      );
    };
    element.addEventListener("toggle", after);
    element.addEventListener("beforetoggle", before);
    element.addEventListener("cancel", cancelled);
    document.addEventListener("submit", submitted);
    return () => {
      element.removeEventListener("toggle", after);
      element.removeEventListener("beforetoggle", before);
      element.removeEventListener("cancel", cancelled);
      document.removeEventListener("submit", submitted);
    };
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element || open === undefined) return;
    if (open) {
      if (closing.current) {
        closing.current = null;
        element.removeAttribute("data-closing");
      }
      if (!element.open) element.showModal();
    } else if (element.open) fadeThenClose(element, closing);
  }, [open]);

  const content = (
    <>
      <div {...bodyProps} className={withClass("hdialog-body", bodyProps?.className)}>
        {children}
      </div>
      {footer && <footer className="hdialog-footer">{footer}</footer>}
    </>
  );

  return (
    <DialogContext value={dialogId}>
      {trigger &&
        cloneElement(trigger, { commandfor: dialogId, command: "show-modal" })}
      <dialog
        {...props}
        ref={(node) => {
          dialog.current = node;
          if (typeof ref === "function") return ref(node);
          if (ref) ref.current = node;
        }}
        id={dialogId}
        className={withClass("hdialog", className)}
        closedby={closedby}
        aria-labelledby={labelledBy ?? titleId}
        aria-describedby={
          [description ? descriptionId : undefined, describedBy]
            .filter(Boolean)
            .join(" ") || undefined
        }
      >
        <header className="hdialog-header">
          <h2 className="hdialog-title" id={titleId}>
            {label}
          </h2>
          {description && (
            <p className="hdialog-description" id={descriptionId}>
              {description}
            </p>
          )}
          <Button
            className="hdialog-close"
            variant="tertiary"
            commandfor={dialogId}
            command="request-close"
            aria-label={closeLabel}
          >
            {closeIcon}
          </Button>
        </header>
        {form ? <form {...form}>{content}</form> : content}
      </dialog>
    </DialogContext>
  );
};

export const DialogClose = ({
  children,
}: {
  children: ReactElement<DialogCommand>;
}) => {
  const dialogId = useContext(DialogContext);
  return cloneElement(children, {
    commandfor: dialogId,
    command: "request-close",
  });
};
