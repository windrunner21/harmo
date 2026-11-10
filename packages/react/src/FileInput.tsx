"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
  type RefObject,
} from "react";
import { renders } from "./children.ts";
import { ErrorMessage } from "./field/ErrorMessage.tsx";
import { useField } from "./field/Field.tsx";
import {
  close as closePaths,
  uploadArrow,
  uploadCheck,
  uploadCloud,
  user as userPaths,
} from "./icons.ts";
import { useMergedRef } from "./useMergedRef.ts";
import { useWidthChange } from "./useWidthChange.ts";
import { withClass } from "./withClass.ts";

interface FileInputOptions
  extends Omit<
    ComponentPropsWithRef<"input">,
    "type" | "multiple" | "value" | "defaultValue" | "children"
  > {
  chooseLabel: ReactNode;
  removeLabel: string;
  icon?: ReactNode;
  validate?: (file: File) => ReactNode;
  onFileChange?: (file: File | null) => void;
}

interface NoExtras {
  dropLabel?: undefined;
  heading?: undefined;
  hint?: undefined;
  changeLabel?: undefined;
  defaultPreview?: undefined;
}

type FileInputLook =
  | (NoExtras & { variant?: undefined; defaultFileName?: string })
  | (Omit<NoExtras, "dropLabel"> & {
      variant: "strip";
      dropLabel: ReactNode;
      defaultFileName?: string;
    })
  | (Omit<NoExtras, "dropLabel" | "heading" | "hint"> & {
      variant: "area";
      dropLabel: ReactNode;
      heading?: ReactNode;
      hint?: ReactNode;
      defaultFileName?: string;
    })
  | {
      variant: "avatar";
      dropLabel?: undefined;
      heading?: undefined;
      hint?: ReactNode;
      changeLabel?: ReactNode;
      defaultPreview?: string;
      defaultFileName?: undefined;
    };

export type FileInputProps = FileInputOptions & FileInputLook;

const removeIcon = (
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

const personIcon = (
  <svg className="hicon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {userPaths.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

const cloudIcon = (attached: boolean) => (
  <svg
    className="hicon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={uploadCloud} />
    {attached ? (
      <path key="check" className="hfile-input-check" d={uploadCheck} pathLength={1} />
    ) : (
      <path key="arrow" className="hfile-input-arrow" d={uploadArrow} />
    )}
  </svg>
);

const elementOf = (event: DragEvent) => {
  const target = event.target as Node;
  return target instanceof Element ? target : target.parentElement;
};

const dropAreaOf = (event: DragEvent) =>
  elementOf(event)?.closest(".hfile-input[data-variant]:has(.hfile-input-control:enabled)");

const useFileDrop = (
  root: RefObject<HTMLElement | null>,
  input: RefObject<HTMLInputElement | null>,
  enabled: boolean,
) => {
  const [dragging, setDragging] = useState<"page" | "over">();

  useEffect(() => {
    if (!enabled) return;
    let depth = 0;
    const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files");
    const inside = (event: DragEvent) => dropAreaOf(event) === root.current;
    const anotherInput = (event: DragEvent) =>
      elementOf(event)?.closest('input[type="file"]:not(.hfile-input-control)');
    const allow = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = dropAreaOf(event) ? "copy" : "none";
      setDragging(inside(event) ? "over" : "page");
    };

    const enter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth += 1;
      if (!anotherInput(event)) allow(event);
    };
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(undefined);
    };
    const over = (event: DragEvent) => {
      if (!carriesFiles(event) || anotherInput(event)) return;
      allow(event);
    };
    const drop = (event: DragEvent) => {
      depth = 0;
      setDragging(undefined);
      if (!carriesFiles(event) || anotherInput(event)) return;
      event.preventDefault();
      const transfer = event.dataTransfer!;
      const file = transfer.files[0];
      if (!inside(event) || !input.current || !file) return;
      if (transfer.items[0]?.webkitGetAsEntry?.()?.isDirectory) return;
      const chosen = new DataTransfer();
      chosen.items.add(file);
      input.current.files = chosen.files;
      input.current.dispatchEvent(new Event("change", { bubbles: true }));
    };

    document.addEventListener("dragenter", enter);
    document.addEventListener("dragleave", leave);
    document.addEventListener("dragover", over);
    document.addEventListener("drop", drop);
    return () => {
      document.removeEventListener("dragenter", enter);
      document.removeEventListener("dragleave", leave);
      document.removeEventListener("dragover", over);
      document.removeEventListener("drop", drop);
      setDragging(undefined);
    };
  }, [root, input, enabled]);

  return dragging;
};

export const FileInput = ({
  chooseLabel,
  removeLabel,
  icon,
  variant,
  dropLabel,
  heading,
  hint,
  changeLabel,
  defaultPreview,
  defaultFileName,
  validate,
  onFileChange,
  onChange,
  ref,
  className,
  hidden,
  ...props
}: FileInputProps) => {
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const inputRef = useMergedRef(input, ref);
  const widthRef = useWidthChange();
  const errorId = useId();
  const [fileName, setFileName] = useState(defaultFileName ?? null);
  const [preview, setPreview] = useState(defaultPreview ?? null);
  const [picture, setPicture] = useState(preview);
  const [message, setMessage] = useState<ReactNode>(null);
  const dragging = useFileDrop(root, input, Boolean(variant) && !props.disabled);
  const field = useField(props, {
    describedBy: validate ? errorId : undefined,
  });
  if (preview && preview !== picture) setPicture(preview);
  const attached = fileName !== null || preview !== null;

  const take = (file: File | null) => {
    const problem = file && validate?.(file);
    const refused = renders(problem);
    setMessage(refused ? problem : null);
    if (refused && input.current) input.current.value = "";
    const kept = refused ? null : file;
    setFileName(kept?.name ?? null);
    setPreview(kept && variant === "avatar" ? URL.createObjectURL(kept) : null);
    onFileChange?.(kept);
  };

  useEffect(() => {
    const chosen = input.current?.files?.[0];
    if (chosen) take(chosen);
  }, []);

  useEffect(() => {
    const restore = () => {
      setFileName(defaultFileName ?? null);
      setPreview(defaultPreview ?? null);
    };
    if (!input.current?.files?.length) restore();

    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        restore();
        setMessage(null);
      });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultFileName, defaultPreview]);

  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const leaving = picture !== null && preview === null;
  useEffect(() => {
    if (!leaving || !image.current) return;
    let current = true;
    Promise.all(image.current.getAnimations().map((exit) => exit.finished)).then(
      () => current && setPicture(null),
      () => {},
    );
    return () => {
      current = false;
    };
  }, [leaving]);

  const control = (
    <input
      {...props}
      {...field}
      ref={inputRef}
      className="hfile-input-control"
      type="file"
      aria-invalid={message ? true : field["aria-invalid"]}
      onChange={(event) => {
        onChange?.(event);
        take(event.target.files?.[0] ?? null);
      }}
    />
  );

  return (
    <>
      <div
        ref={root}
        className={withClass("hfile-input", className)}
        data-variant={variant}
        data-dragging={dragging}
        hidden={hidden}
      >
        {variant === "avatar" ? (
          <label className="hfile-input-target">
            {control}
            <span className="havatar">
              {icon ?? personIcon}
              {picture && (
                <img
                  key={picture}
                  ref={image}
                  className="hfile-input-preview"
                  src={picture}
                  alt=""
                  data-leaving={leaving ? "" : undefined}
                />
              )}
            </span>
            <span className="hfile-input-heading">
              {renders(changeLabel) ? (
                <>
                  <span data-inactive={attached ? "" : undefined}>{chooseLabel}</span>
                  <span data-inactive={attached ? undefined : ""}>{changeLabel}</span>
                </>
              ) : (
                chooseLabel
              )}
            </span>
            {renders(hint) && <span className="hfile-input-hint">{hint}</span>}
          </label>
        ) : (
          <>
            {variant === "area" && (
              <span className="hfile-input-icon">{icon ?? cloudIcon(attached)}</span>
            )}
            {renders(heading) && <span className="hfile-input-heading">{heading}</span>}
            {variant && <span className="hfile-input-drop">{dropLabel}</span>}
            {renders(hint) && <span className="hfile-input-hint">{hint}</span>}
            <label ref={widthRef} className="hbutton" data-variant="secondary">
              {control}
              {variant !== "area" && (icon ?? cloudIcon(attached))}
              <span key={fileName ?? ""} className="hbutton-label" title={fileName ?? undefined}>
                {fileName ?? chooseLabel}
              </span>
            </label>
          </>
        )}
        <button
          className="hbutton"
          data-variant="tertiary"
          type="button"
          aria-label={removeLabel}
          hidden={!attached}
          disabled={props.disabled}
          onClick={() => {
            if (input.current) input.current.value = "";
            take(null);
            input.current?.focus();
          }}
        >
          {removeIcon}
        </button>
      </div>
      {validate && !hidden && (
        <ErrorMessage id={errorId}>{message}</ErrorMessage>
      )}
    </>
  );
};
