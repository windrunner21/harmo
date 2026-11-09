import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface ColumnVisibilityOptions {
  columns: string[];
  pinned?: string[];
  defaultVisible?: string[];
  storageKey?: string;
}

const NONE: string[] = [];

const read = (key: string) => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : null;
  } catch {
    return null;
  }
};

const write = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
};

// The same array for the same contents, so that one written inline changes
// nothing from render to render.
const useSameList = (list: string[]) => {
  const contents = JSON.stringify(list);
  return useMemo(() => list, [contents]);
};

export const useColumnVisibility = ({
  columns,
  pinned = NONE,
  defaultVisible,
  storageKey,
}: ColumnVisibilityOptions) => {
  const all = useSameList(columns);
  const fixed = useSameList(pinned);
  const defaults = useSameList(defaultVisible ?? columns);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const active = chosen ?? defaults;

  const latest = useRef(active);
  useLayoutEffect(() => {
    latest.current = active;
  }, [active]);

  useLayoutEffect(() => {
    setChosen(storageKey ? read(storageKey) : null);
  }, [storageKey]);

  const setVisible = useCallback(
    (next: string[]) => {
      latest.current = next;
      setChosen(next);
      if (storageKey) write(storageKey, next);
    },
    [storageKey],
  );

  const toggle = useCallback(
    (id: string) => {
      const was = latest.current;
      setVisible(was.includes(id) ? was.filter((each) => each !== id) : [...was, id]);
    },
    [setVisible],
  );

  return useMemo(() => {
    const visible = all.filter((id) => fixed.includes(id) || active.includes(id));
    return {
      visible,
      hidden: all.filter((id) => !visible.includes(id)),
      toggleable: all.filter((id) => !fixed.includes(id)),
      setVisible,
      toggle,
    };
  }, [all, fixed, active, setVisible, toggle]);
};
