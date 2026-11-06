"use client";
import {
  cloneElement,
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button } from "./Button.tsx";
import {
  closeIcon,
  ModalClose,
  ModalContext,
  useModal,
  type ModalCommand,
  type ModalState,
} from "./modal.tsx";
import { withClass } from "./withClass.ts";

export interface DialogProps
  extends Omit<
      ComponentPropsWithRef<"dialog">,
      "open" | "onToggle" | "onBeforeToggle"
    >,
    ModalState {
  label: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  trigger?: ReactElement<ModalCommand>;
  footer?: ReactNode;
  form?: ComponentPropsWithRef<"form">;
  bodyProps?: ComponentPropsWithRef<"div">;
}

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
  const dialog = useModal({ open, onOpenChange, onToggle, onBeforeToggle });

  const content = (
    <>
      <div {...bodyProps} className={withClass("hdialog-body", bodyProps?.className)}>
        {children}
      </div>
      {footer && <footer className="hdialog-footer">{footer}</footer>}
    </>
  );

  return (
    <ModalContext value={dialogId}>
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
    </ModalContext>
  );
};

export const DialogClose = ModalClose;
