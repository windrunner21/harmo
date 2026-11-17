import { useEffect, useEffectEvent, useState, type RefObject } from "react";

// Where files can be dropped: each File Input's area and each Drop Zone, with
// whether it takes them now, such as a File Input in a disabled fieldset not.
// Every one answers for the whole page, so a drag asks which it's over, the
// innermost that takes them.
const areas = new Map<Element, () => boolean>();
const ownAnswers = new WeakSet<Event>();
const stuckAfter = 2000;

const elementOf = (event: DragEvent) => {
  const target = event.target as Node;
  return target instanceof Element ? target : target.parentElement;
};

const areaOf = (event: DragEvent) => {
  for (let node = elementOf(event); node; node = node.parentElement) {
    if (areas.get(node)?.()) return node;
  }
  return null;
};

// A drag another script answered, or one over a text field or an editor
// outside every area, such as text being dragged in, is left alone. A field
// inside an area, such as a chat's, is the area's.
const leftToOthers = (event: DragEvent) => {
  if (event.defaultPrevented && !ownAnswers.has(event)) return true;
  if (areaOf(event)) return false;
  const element = elementOf(event);
  return (
    Boolean((element as HTMLElement | null)?.isContentEditable) ||
    Boolean(element?.closest("input:not(.hfile-input-control), textarea"))
  );
};

// Whether files are being dragged over the page, or over this area, and the
// files dropped on it, without folders. A drop that misses every area doesn't
// open the file in the tab; a drag that stops sending events, such as when
// what's under it is removed, ends after two seconds.
export const useFileDrop = (
  root: RefObject<HTMLElement | null>,
  enabled: boolean,
  onFiles: (files: File[]) => void,
  takes: () => boolean = () => true,
) => {
  const [dragging, setDragging] = useState<"page" | "over">();
  const take = useEffectEvent(onFiles);
  const takesNow = useEffectEvent(takes);

  useEffect(() => {
    const area = root.current;
    if (!enabled || !area) return;
    areas.set(area, takesNow);
    let depth = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    const inside = (event: DragEvent) => areaOf(event) === area;
    const end = () => {
      depth = 0;
      clearTimeout(timer);
      setDragging(undefined);
    };
    const answer = (event: DragEvent) => {
      setDragging(inside(event) ? "over" : "page");
      clearTimeout(timer);
      timer = setTimeout(end, stuckAfter);
      if (leftToOthers(event)) return;
      ownAnswers.add(event);
      event.preventDefault();
      event.dataTransfer!.dropEffect = areaOf(event) ? "copy" : "none";
    };

    const enter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth += 1;
      answer(event);
    };
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) end();
    };
    const over = (event: DragEvent) => {
      if (carriesFiles(event)) answer(event);
    };
    const drop = (event: DragEvent) => {
      end();
      if (!carriesFiles(event) || leftToOthers(event)) return;
      ownAnswers.add(event);
      event.preventDefault();
      if (!inside(event)) return;
      const files = Array.from(event.dataTransfer!.items)
        .filter((item) => item.kind === "file" && !item.webkitGetAsEntry?.()?.isDirectory)
        .flatMap((item) => item.getAsFile() ?? []);
      if (files.length > 0) take(files);
    };

    document.addEventListener("dragenter", enter);
    document.addEventListener("dragleave", leave);
    document.addEventListener("dragover", over);
    document.addEventListener("drop", drop);
    return () => {
      areas.delete(area);
      clearTimeout(timer);
      document.removeEventListener("dragenter", enter);
      document.removeEventListener("dragleave", leave);
      document.removeEventListener("dragover", over);
      document.removeEventListener("drop", drop);
      setDragging(undefined);
    };
  }, [root, enabled]);

  return dragging;
};
