"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { renders } from "./children.ts";
import { closeIcon } from "./closeIcon.tsx";
import { ErrorMessage } from "./field/ErrorMessage.tsx";
import { Field, useField } from "./field/Field.tsx";
import {
  uploadArrow,
  uploadCheck,
  uploadCloud,
  user as userPaths,
} from "./icons.ts";
import type { ControlField } from "./types.ts";
import { useFileDrop } from "./useFileDrop.ts";
import { useMergedRef } from "./useMergedRef.ts";
import { useWidthChange } from "./useWidthChange.ts";
import { withClass } from "./withClass.ts";

interface FileInputOptions
  extends Omit<
    ComponentPropsWithRef<"input">,
    "type" | "multiple" | "value" | "defaultValue" | "children"
  > {
  chooseLabel: ReactNode;
  icon?: ReactNode;
  validate?: (file: File, accepted: number) => ReactNode;
}

interface OneFile {
  multiple?: false;
  removeLabel: string;
  onFileChange?: (file: File | null) => void;
  onFilesAdd?: undefined;
}

interface ManyFiles {
  multiple: true;
  onFilesAdd: (files: File[]) => void;
  removeLabel?: undefined;
  onFileChange?: undefined;
  defaultFileName?: undefined;
  defaultPreview?: undefined;
  changeLabel?: undefined;
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

type FileInputControlProps = FileInputOptions &
  ((OneFile & FileInputLook) | (ManyFiles & Exclude<FileInputLook, { variant: "avatar" }>));

export type FileInputProps = FileInputControlProps & ControlField;

const personIcon = (
  <svg className="hicon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {userPaths.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

const cloudIcon = (attached: boolean, changed: boolean) => (
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
      <path
        key="check"
        className="hfile-input-check"
        d={uploadCheck}
        pathLength={1}
        data-new={changed ? "" : undefined}
      />
    ) : (
      <path key="arrow" className="hfile-input-arrow" d={uploadArrow} />
    )}
  </svg>
);

export const FileInput = (fileProps: FileInputProps) => {
  const { label, optional, description, error, hidden, ...props } = fileProps;
  const control = props as FileInputControlProps;
  if (label === undefined) return <FileInputControl {...control} hidden={hidden} />;

  return (
    <Field label={label} optional={optional} description={description} hidden={hidden}>
      <FileInputControl {...control} {...("error" in fileProps && { error })} />
    </Field>
  );
};

const FileInputControl = (controlProps: FileInputControlProps & { error?: ReactNode }) => {
  const given = "error" in controlProps;
  const {
  chooseLabel,
  removeLabel,
  multiple,
  onFilesAdd,
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
  error,
  ...props
  } = controlProps;
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const created = useRef(new Set<string>());
  const reconciled = useRef(false);
  const defaults = useRef([defaultFileName, defaultPreview]);
  const inputRef = useMergedRef(input, ref);
  const widthRef = useWidthChange();
  const errorId = useId();
  const hintId = useId();
  const [fileName, setFileName] = useState(defaultFileName ?? null);
  const [preview, setPreview] = useState(defaultPreview ?? null);
  const [picture, setPicture] = useState(preview);
  const [message, setMessage] = useState<ReactNode>(null);
  const [changed, setChanged] = useState(false);
  const reported = useRef<File | null>(null);
  const dragging = useFileDrop(root, Boolean(variant) && !props.disabled, (dropped) => {
    const control = input.current;
    if (!control) return;
    const chosen = new DataTransfer();
    for (const file of control.multiple ? dropped : dropped.slice(0, 1)) chosen.items.add(file);
    control.files = chosen.files;
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }, () => input.current?.matches(":enabled") ?? false);
  const describedHint = variant !== "avatar" && renders(hint);
  const validated = Boolean(validate) || given;
  const field = useField(props, {
    describedBy:
      [describedHint && hintId, validated && errorId].filter(Boolean).join(" ") ||
      undefined,
  });
  if (preview && preview !== picture) setPicture(preview);
  const attached = fileName !== null || preview !== null;
  const shownError = renders(message) ? message : error;
  const marked = changed ? "" : undefined;

  const take = (file: File | null) => {
    const problem = file && validate?.(file, 0);
    const refused = renders(problem);
    setMessage(refused ? problem : null);
    if (refused && input.current) input.current.value = "";
    const kept = refused ? null : file;
    setChanged(true);
    setFileName(kept?.name ?? null);
    const url = kept && variant === "avatar" ? URL.createObjectURL(kept) : null;
    if (url) created.current.add(url);
    setPreview(url);
    reported.current = kept;
    onFileChange?.(kept);
  };

  const takeMany = (files: File[]) => {
    const messages = new Set<ReactNode>();
    const accepted: File[] = [];
    for (const file of files) {
      const problem = validate?.(file, accepted.length);
      if (renders(problem)) messages.add(problem);
      else accepted.push(file);
    }
    setMessage(
      messages.size
        ? [...messages].map((text, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {text}
            </Fragment>
          ))
        : null,
    );
    if (input.current) input.current.value = "";
    if (accepted.length) onFilesAdd?.(accepted);
  };

  const takeChosen = (files: FileList | null) => {
    if (multiple) takeMany(Array.from(files ?? []));
    else take(files?.[0] ?? null);
  };

  const restore = () => {
    setFileName(defaultFileName ?? null);
    setPreview(defaultPreview ?? null);
  };

  useEffect(() => {
    if (reconciled.current) return;
    reconciled.current = true;
    if (input.current?.files?.length) takeChosen(input.current.files);
  }, []);

  useEffect(() => {
    if (defaults.current[0] === defaultFileName && defaults.current[1] === defaultPreview) return;
    defaults.current = [defaultFileName, defaultPreview];
    if (input.current?.files?.length) return;
    setChanged(true);
    restore();
  }, [defaultFileName, defaultPreview]);

  const resetting = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetting.current), []);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) => {
      clearTimeout(resetting.current);
      resetting.current = setTimeout(() => {
        if (event.defaultPrevented) return;
        restore();
        setMessage(null);
        if (!reported.current) return;
        reported.current = null;
        onFileChange?.(null);
      });
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  });

  useEffect(
    () => () => {
      if (picture && created.current.delete(picture)) URL.revokeObjectURL(picture);
    },
    [picture],
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
      multiple={multiple === true}
      aria-invalid={renders(shownError) ? true : field["aria-invalid"]}
      onChange={(event) => {
        onChange?.(event);
        takeChosen(event.target.files);
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
                  data-new={marked}
                  data-leaving={leaving ? "" : undefined}
                />
              )}
            </span>
            <span className="hfile-input-heading" data-stacked={renders(changeLabel) ? "" : undefined}>
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
              <span className="hfile-input-icon">{icon ?? cloudIcon(attached, changed)}</span>
            )}
            {renders(heading) && <span className="hfile-input-heading">{heading}</span>}
            {variant && <span className="hfile-input-drop">{dropLabel}</span>}
            {describedHint && (
              <span className="hfile-input-hint" id={hintId}>
                {hint}
              </span>
            )}
            <label ref={widthRef} className="hbutton" data-variant="secondary">
              {control}
              {variant !== "area" && (icon ?? cloudIcon(attached, changed))}
              <span
                key={fileName ?? ""}
                className="hbutton-label"
                title={fileName ?? undefined}
                data-new={marked}
              >
                {fileName ?? chooseLabel}
              </span>
            </label>
          </>
        )}
        {!multiple && (
          <button
            className="hbutton"
            data-variant="tertiary"
            type="button"
            aria-label={removeLabel}
            hidden={!attached}
            disabled={props.disabled}
            data-new={marked}
            onClick={() => {
              if (input.current) input.current.value = "";
              take(null);
              input.current?.focus();
            }}
          >
            {closeIcon}
          </button>
        )}
      </div>
      {validated && !hidden && (
        <ErrorMessage id={errorId}>{shownError}</ErrorMessage>
      )}
    </>
  );
};
