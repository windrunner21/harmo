"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { renders } from "./children.ts";
import { close as closePaths, file as filePaths, fileDone } from "./icons.ts";
import { useMergedRef } from "./useMergedRef.ts";
import { seconds } from "./useWidthChange.ts";
import { withClass } from "./withClass.ts";

export interface FileListItem {
  id: string;
  name: string;
  detail?: ReactNode;
  preview?: string;
  icon?: ReactNode;
  progress?: number;
  error?: ReactNode;
}

interface FileListOptions extends Omit<ComponentPropsWithRef<"ul">, "children"> {
  files: FileListItem[];
  layout?: "rows" | "grid";
}

type Named = { "aria-label": string } | { "aria-labelledby": string };

type Removing =
  | { onRemove?: undefined; removeLabel?: undefined }
  | {
      onRemove: (file: FileListItem) => void;
      removeLabel: (file: FileListItem) => string;
    };

type Retrying =
  | { onRetry?: undefined; retryLabel?: undefined }
  | { onRetry: (file: FileListItem) => void; retryLabel: ReactNode };

export type FileListProps = FileListOptions & Named & Removing & Retrying;

interface Entry {
  file: FileListItem;
  added: boolean;
  leaving: boolean;
}

const fileIcon = (
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
    {filePaths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

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

const doneIcon = (
  <svg
    className="hicon hfile-list-done"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={fileDone} pathLength={1} />
  </svg>
);

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const token = (node: Element, name: string) => getComputedStyle(node).getPropertyValue(name).trim();

const slideId = "hfile-list-slide";

const placeOf = (tile: HTMLElement): [number, number] => {
  const moved = getComputedStyle(tile).translate;
  const [x = 0, y = 0] = moved === "none" ? [] : moved.split(" ").map(parseFloat);
  return [tile.offsetLeft + x, tile.offsetTop + y];
};

const animateOut = (row: HTMLElement, grid: boolean) => {
  const style = getComputedStyle(row);
  const from: Keyframe = { opacity: style.opacity };
  const to: Keyframe = { opacity: 0 };
  if (!still() && grid) {
    from.transform = style.transform;
    to.transform = "scale(0.96)";
  }
  if (!still() && !grid) {
    from.blockSize = `${row.offsetHeight}px`;
    to.blockSize = "0px";
    for (const side of ["paddingBlockStart", "paddingBlockEnd"] as const) {
      from[side] = style[side];
      to[side] = "0px";
    }
    for (const side of ["borderBlockStartWidth", "borderBlockEndWidth"] as const) {
      from[side] = style[side];
      to[side] = "0px";
    }
    const gap = parseFloat(getComputedStyle(row.parentElement!).rowGap) || 0;
    const margin = row.nextElementSibling ? "marginBlockEnd" : row.previousElementSibling ? "marginBlockStart" : null;
    if (margin) {
      from[margin] = "0px";
      to[margin] = `${-gap}px`;
    }
  }
  return row.animate([from, to], {
    duration: seconds(token(row, "--harmo-duration-fast")) ?? 150,
    easing: token(row, "--harmo-ease-out-cubic") || "ease-out",
    fill: "forwards",
  });
};

const merged = (previous: Entry[], files: FileListItem[]) => {
  const known = new Map(previous.map((entry) => [entry.file.id, entry]));
  const ids = new Set(files.map((file) => file.id));
  const next: Entry[] = files.map((file) => ({
    file,
    added: known.get(file.id)?.added ?? true,
    leaving: false,
  }));
  previous.forEach((entry, index) => {
    if (!ids.has(entry.file.id)) {
      next.splice(Math.min(index, next.length), 0, { ...entry, leaving: true });
    }
  });
  return next;
};

interface FileRowProps {
  file: FileListItem;
  added: boolean;
  leaving: boolean;
  grid: boolean;
  removeLabel?: (file: FileListItem) => string;
  onRemove?: (file: FileListItem) => void;
  retryLabel?: ReactNode;
  onRetry?: (file: FileListItem) => void;
  onGone: (id: string) => void;
  moveFocusFrom: (row: Element) => void;
}

const FileRow = ({
  file,
  added,
  leaving,
  grid,
  removeLabel,
  onRemove,
  retryLabel,
  onRetry,
  onGone,
  moveFocusFrom,
}: FileRowProps) => {
  const row = useRef<HTMLLIElement>(null);
  const retryFocused = useRef(false);
  const nameId = useId();
  const failed = renders(file.error);
  const value = file.progress === undefined ? undefined : Math.min(100, Math.max(0, file.progress));
  const status = failed ? "error" : value === undefined ? undefined : value >= 100 ? "done" : "uploading";

  useLayoutEffect(() => {
    const node = row.current;
    if (!node) return;
    if (leaving && node.contains(document.activeElement)) moveFocusFrom(node);
    node.inert = leaving;
  }, [leaving]);

  useLayoutEffect(() => {
    if (failed || !retryFocused.current) return;
    retryFocused.current = false;
    const target = row.current?.querySelector(".hfile-list-remove") ?? row.current?.closest("ul");
    (target as HTMLElement | null | undefined)?.focus();
  }, [failed]);

  useEffect(() => {
    if (!leaving || !row.current) return;
    const exit = animateOut(row.current, grid);
    let current = true;
    exit.finished.then(
      () => current && onGone(file.id),
      () => {},
    );
    return () => {
      current = false;
      exit.cancel();
    };
  }, [leaving, grid]);

  return (
    <li
      ref={row}
      className="hfile-list-item"
      data-status={status}
      data-new={added ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
    >
      <span className="hfile-list-thumb">
        {file.preview ? <img src={file.preview} alt="" /> : (file.icon ?? fileIcon)}
      </span>
      <div className="hfile-list-text">
        <span className="hfile-list-name" id={nameId} title={file.name}>
          {file.name}
        </span>
        {failed ? (
          <p className="hfile-list-error" role="alert">
            {file.error}
          </p>
        ) : (
          renders(file.detail) && <span className="hfile-list-detail">{file.detail}</span>
        )}
      </div>
      <div className="hfile-list-actions">
        {status === "done" && doneIcon}
        {failed && onRetry && (
          <button
            className="hbutton"
            data-variant="tertiary"
            type="button"
            onFocus={() => (retryFocused.current = true)}
            onBlur={() => (retryFocused.current = false)}
            onClick={() => onRetry(file)}
          >
            <span className="hbutton-label">{retryLabel}</span>
          </button>
        )}
        {onRemove && removeLabel && (
          <button
            className="hbutton hfile-list-remove"
            data-variant="tertiary"
            type="button"
            aria-label={removeLabel(file)}
            onClick={() => onRemove(file)}
          >
            {removeIcon}
          </button>
        )}
      </div>
      {value !== undefined && !failed && (
        <div
          className="hfile-list-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-labelledby={nameId}
          style={{ "--hfile-list-progress": value / 100 } as CSSProperties}
        />
      )}
    </li>
  );
};

export const FileList = (listProps: FileListProps) => {
  const { files, layout, removeLabel, onRemove, retryLabel, onRetry, className, ref, ...props } = listProps;
  const list = useRef<HTMLUListElement>(null);
  const listRef = useMergedRef(list, ref);
  const places = useRef<Map<Element, [number, number]> | null>(null);
  const [seen, setSeen] = useState(files);
  const [entries, setEntries] = useState<Entry[]>(() =>
    files.map((file) => ({ file, added: false, leaving: false })),
  );
  const grid = layout === "grid";

  if (files !== seen) {
    setSeen(files);
    setEntries(merged(entries, files));
  }

  useLayoutEffect(() => {
    const before = places.current;
    if (!before || !list.current) return;
    places.current = null;
    if (still()) return;
    for (const tile of list.current.children) {
      const was = before.get(tile);
      const element = tile as HTMLElement;
      for (const slide of element.getAnimations()) if (slide.id === slideId) slide.cancel();
      if (!was || (was[0] === element.offsetLeft && was[1] === element.offsetTop)) continue;
      element.animate(
        [{ translate: `${was[0] - element.offsetLeft}px ${was[1] - element.offsetTop}px` }, { translate: "0 0" }],
        {
          id: slideId,
          duration: seconds(token(element, "--harmo-duration-normal")) ?? 200,
          easing: token(element, "--harmo-ease-in-out-cubic") || "ease-in-out",
        },
      );
    }
  });

  const gone = (id: string) => {
    if (list.current?.dataset.layout === "grid") {
      places.current = new Map(Array.from(list.current.children, (tile) => [tile, placeOf(tile as HTMLElement)]));
    }
    setEntries((current) => current.filter((entry) => entry.file.id !== id));
  };

  const moveFocusFrom = (row: Element) => {
    if (!list.current) return;
    const others = Array.from(list.current.children).filter(
      (other) => other !== row && !other.hasAttribute("data-leaving"),
    );
    const next =
      others.find((other) => row.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) ?? others.at(-1);
    (next?.querySelector<HTMLElement>(".hfile-list-remove") ?? list.current).focus();
  };

  return (
    <ul
      {...props}
      ref={listRef}
      className={withClass("hfile-list", className)}
      data-layout={layout}
      role="list"
      tabIndex={-1}
    >
      {entries.map(({ file, added, leaving }) => (
        <FileRow
          key={file.id}
          file={file}
          added={added}
          leaving={leaving}
          grid={grid}
          removeLabel={removeLabel}
          onRemove={onRemove}
          retryLabel={retryLabel}
          onRetry={onRetry}
          onGone={gone}
          moveFocusFrom={moveFocusFrom}
        />
      ))}
    </ul>
  );
};
