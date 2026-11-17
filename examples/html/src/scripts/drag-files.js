// Example only: what React's useFileDrop does, which a File Input's drop area
// and a Drop Zone share; file-input.js and drop-zone.js call watchFileDrop
// for each. Every area listens on the whole page, so a drag asks which area
// it's over: the innermost that takes files now. While files are dragged,
// show gets "over" for the area they're over and "page" for the others, and
// null once they leave, counted in and out, or once the drag's repeating
// events stop for two seconds, as when what's under the pointer is removed.
// Files dropped on an area go to its take, without folders. A drop that
// misses every area doesn't open the file in the tab. A drag another script
// answered, or one over a text field or an editor outside every area, such as
// text being dragged in, is left alone; a field inside an area is the area's.
const watchFileDrop = (() => {
  const areas = new Map();
  const answered = new WeakSet();
  const carriesFiles = (event) => event.dataTransfer?.types.includes("Files") ?? false;
  // The target can be a text node.
  const elementOf = (event) => (event.target instanceof Element ? event.target : event.target.parentElement);
  const areaOf = (event) => {
    for (let node = elementOf(event); node; node = node.parentElement) {
      if (areas.get(node)?.()) return node;
    }
    return null;
  };
  const leftToOthers = (event) => {
    if (event.defaultPrevented && !answered.has(event)) return true;
    if (areaOf(event)) return false;
    const element = elementOf(event);
    return Boolean(element?.isContentEditable) || Boolean(element?.closest("input:not(.hfile-input-control), textarea"));
  };

  // enabled: whether it listens at all, such as a File Input not disabled;
  // takes: whether it's an area now, such as one not in a disabled fieldset.
  return (area, { show, take, enabled = () => true, takes = () => true }) => {
    areas.set(area, takes);
    let depth = 0;
    let timer;
    const inside = (event) => areaOf(event) === area;
    const end = () => {
      depth = 0;
      clearTimeout(timer);
      show(null);
    };
    const ignored = (event) => {
      if (!enabled()) end();
      return !enabled() || !carriesFiles(event);
    };
    const answer = (event) => {
      show(inside(event) ? "over" : "page");
      clearTimeout(timer);
      timer = setTimeout(end, 2000);
      if (leftToOthers(event)) return;
      answered.add(event);
      event.preventDefault();
      event.dataTransfer.dropEffect = areaOf(event) ? "copy" : "none";
    };

    document.addEventListener("dragenter", (event) => {
      if (ignored(event)) return;
      depth += 1;
      answer(event);
    });
    document.addEventListener("dragleave", (event) => {
      if (ignored(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) end();
    });
    document.addEventListener("dragover", (event) => {
      if (!ignored(event)) answer(event);
    });
    document.addEventListener("drop", (event) => {
      end();
      if (ignored(event) || leftToOthers(event)) return;
      answered.add(event);
      event.preventDefault();
      if (!inside(event)) return;
      const files = [...event.dataTransfer.items]
        .filter((item) => item.kind === "file" && !item.webkitGetAsEntry?.()?.isDirectory)
        .flatMap((item) => item.getAsFile() ?? []);
      if (files.length > 0) take(files);
    });
  };
})();
