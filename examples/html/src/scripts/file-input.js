// Example only: what the React FileInput does. Shows the chosen file's name or
// picture, removes it, and refuses a file of the wrong type or size, saying why.
// A refused file is cleared from the input, so a form doesn't send it. With a
// data-variant, it also takes a file dropped on it, lights up while one is
// dragged, and stops a drop that just misses from opening the file in the tab,
// leaving alone other drop targets and text fields.
{
  const answered = new WeakSet();
  const paths = {
    arrow: "M12 16V10M12 10L9 12M12 10L15 12",
    check: "M9 13L11 15L15 11",
  };

  const mark = (name) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", `hfile-input-${name}`);
    path.setAttribute("d", paths[name]);
    if (name === "check") path.setAttribute("pathLength", "1");
    return path;
  };

  for (const root of document.querySelectorAll(".hfile-input[data-example-choose]")) {
    const avatar = root.dataset.variant === "avatar";
    const input = root.querySelector(".hfile-input-control");
    const text = root.querySelector(avatar ? ".hfile-input-heading" : ".hbutton-label");
    const button = root.querySelector("label.hbutton");
    const circle = root.querySelector(".havatar");
    const remove = root.querySelector("button.hbutton");
    const next = root.nextElementSibling;
    const error = next?.classList.contains("herror") ? next : root.parentElement.querySelector(":scope > .herror");
    const {
      exampleChoose,
      exampleEnding,
      exampleMaxBytes,
      exampleWrongType,
      exampleTooLarge,
      exampleImage,
    } = root.dataset;
    const attached = remove.hidden ? null : text.textContent;
    const attachedPicture = circle?.querySelector("img")?.getAttribute("src") ?? null;
    let objectUrl = null;

    const showPicture = (src) => {
      const old = circle.querySelector("img");
      if (src) {
        const picture = document.createElement("img");
        picture.className = "hfile-input-preview";
        picture.alt = "";
        picture.src = src;
        old?.remove();
        circle.append(picture);
      } else if (old) {
        old.dataset.leaving = "";
        Promise.all(old.getAnimations().map((exit) => exit.finished)).then(
          () => old.remove(),
          () => {},
        );
      }
      const [choosing, changing] = text.children;
      choosing.toggleAttribute("data-inactive", Boolean(src));
      changing.toggleAttribute("data-inactive", !src);
      remove.hidden = !src;
    };

    const current = { text };
    const show = (file) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      if (!avatar) {
        showNameFrom(current.text, file?.name ?? null);
        return;
      }
      objectUrl = file ? URL.createObjectURL(file) : null;
      showPicture(objectUrl);
    };

    const showNameFrom = (label, name) => {
      changeButtonWidth(button, () => {
        const replacement = label.cloneNode();
        replacement.textContent = name ?? exampleChoose;
        if (name === null) replacement.removeAttribute("title");
        else replacement.title = name;
        label.replaceWith(replacement);
        current.text = replacement;
        root.querySelector(".hfile-input-arrow, .hfile-input-check")?.replaceWith(mark(name === null ? "arrow" : "check"));
        remove.hidden = name === null;
      });
    };

    // Closes as a Field's error does: its text goes once the exit has finished.
    const say = (message) => {
      if (!error) return;
      if (message) {
        input.setAttribute("aria-invalid", "true");
        error.textContent = message;
        error.hidden = false;
        return;
      }
      input.removeAttribute("aria-invalid");
      error.hidden = true;
      Promise.all(error.getAnimations().map((animation) => animation.finished)).then(
        () => {
          if (error.hidden) error.textContent = "";
        },
        () => {},
      );
    };

    const problem = (file) => {
      if (exampleImage !== undefined && !file.type.startsWith("image/")) return exampleWrongType;
      if (exampleEnding && !file.name.toLowerCase().endsWith(exampleEnding)) return exampleWrongType;
      if (exampleMaxBytes && file.size > Number(exampleMaxBytes)) return exampleTooLarge;
      return "";
    };

    input.addEventListener("change", () => {
      const file = input.files[0] ?? null;
      const message = file ? problem(file) : "";
      say(message);
      if (message) input.value = "";
      show(message ? null : file);
    });

    remove.addEventListener("click", () => {
      input.value = "";
      say("");
      show(null);
      input.focus();
    });

    input.form?.addEventListener("reset", (event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        say("");
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = null;
        if (avatar) showPicture(attachedPicture);
        else showNameFrom(current.text, attached);
      }),
    );

    if (!root.dataset.variant) continue;

    let depth = 0;
    let timer;
    const carriesFiles = (event) => event.dataTransfer?.types.includes("Files");
    // The target can be a text node, and every area answers for the whole page,
    // so it asks which area the file is over, not only whether it's this one.
    const elementOf = (event) => (event.target instanceof Element ? event.target : event.target.parentElement);
    const areaOf = (event) => elementOf(event)?.closest(".hfile-input[data-variant]:has(.hfile-input-control:enabled)");
    const inside = (event) => areaOf(event) === root;
    const leftToOthers = (event) => {
      const element = elementOf(event);
      return (
        (event.defaultPrevented && !answered.has(event)) ||
        element?.isContentEditable ||
        Boolean(element?.closest("input:not(.hfile-input-control), textarea"))
      );
    };
    const end = () => {
      depth = 0;
      clearTimeout(timer);
      light(null);
    };
    // Anything that would stop a drag early gets no event, such as the element
    // under it being removed, so it ends when the drag's repeating events stop.
    const answer = (event) => {
      light(inside(event) ? "over" : "page");
      clearTimeout(timer);
      timer = setTimeout(end, 2000);
      if (leftToOthers(event)) return;
      answered.add(event);
      event.preventDefault();
      event.dataTransfer.dropEffect = areaOf(event) ? "copy" : "none";
    };
    const ignored = (event) => {
      if (input.disabled) end();
      return input.disabled || !carriesFiles(event);
    };
    const light = (state) => {
      if (state) root.dataset.dragging = state;
      else delete root.dataset.dragging;
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
      const file = event.dataTransfer.files[0];
      if (!inside(event) || !file) return;
      if (event.dataTransfer.items[0]?.webkitGetAsEntry?.()?.isDirectory) return;
      const chosen = new DataTransfer();
      chosen.items.add(file);
      input.files = chosen.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
}
