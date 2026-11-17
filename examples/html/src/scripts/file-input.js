// Example only: what the React FileInput does. Shows the chosen file's name or
// picture, removes it, and refuses a file of the wrong type or size, saying why.
// A refused file is cleared from the input, so a form doesn't send it. With a
// data-variant, it also takes a file dropped on it, lights up while one is
// dragged, and stops a drop that just misses from opening the file in the tab,
// leaving alone other drop targets and text fields, as drag-files.js does. What it puts in as a file
// comes or goes is marked data-new, so it settles in; what the page loaded with
// doesn't.
{
  const paths = {
    arrow: "M12 16V10M12 10L9 12M12 10L15 12",
    check: "M9 13L11 15L15 11",
  };

  const mark = (name) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", `hfile-input-${name}`);
    path.setAttribute("d", paths[name]);
    if (name === "check") {
      path.setAttribute("pathLength", "1");
      path.setAttribute("data-new", "");
    }
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
      exampleMaxFiles,
      exampleTooMany,
    } = root.dataset;
    const attached = !remove || remove.hidden ? null : text.textContent;
    const attachedPicture = circle?.querySelector("img")?.getAttribute("src") ?? null;
    let objectUrl = null;

    const showPicture = (src) => {
      const old = circle.querySelector("img");
      if (src) {
        const picture = document.createElement("img");
        picture.className = "hfile-input-preview";
        picture.alt = "";
        picture.src = src;
        picture.dataset.new = "";
        old?.remove();
        circle.append(picture);
      } else if (old) {
        old.dataset.leaving = "";
        Promise.all(old.getAnimations().map((exit) => exit.finished)).then(
          () => old.remove(),
          () => {},
        );
      }
      // A heading with a change label stacks it on the choose label, and shows
      // the one that fits; with only the choose label, it stays as it is.
      if (text.hasAttribute("data-stacked")) {
        const [choosing, changing] = text.children;
        choosing.toggleAttribute("data-inactive", Boolean(src));
        changing.toggleAttribute("data-inactive", !src);
      }
      remove.dataset.new = "";
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
        replacement.dataset.new = "";
        if (name === null) replacement.removeAttribute("title");
        else replacement.title = name;
        label.replaceWith(replacement);
        current.text = replacement;
        root.querySelector(".hfile-input-arrow, .hfile-input-check")?.replaceWith(mark(name === null ? "arrow" : "check"));
        remove.dataset.new = "";
        remove.hidden = name === null;
      });
    };

    // Closes as a Field's error does: its text goes once the exit has finished.
    const say = (message) => {
      if (!error) return;
      const lines = [message].flat().filter(Boolean);
      if (lines.length) {
        input.setAttribute("aria-invalid", "true");
        error.replaceChildren(...lines.flatMap((line, index) => (index ? [document.createElement("br"), line] : [line])));
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
      if (exampleImage !== undefined && !file.type.startsWith("image/")) return exampleWrongType.replace("{name}", file.name);
      if (exampleEnding && !file.name.toLowerCase().endsWith(exampleEnding)) return exampleWrongType;
      if (exampleMaxBytes && file.size > Number(exampleMaxBytes)) return exampleTooLarge.replace("{name}", file.name);
      return "";
    };

    // Several files go to whatever is holding them; the input keeps none.
    const takeMany = () => {
      const held = root.closest("[data-example-files]")?.querySelectorAll(".hfile-list > :not([data-leaving])").length ?? 0;
      const messages = new Set();
      const accepted = [];
      for (const file of input.files) {
        const message = exampleMaxFiles && held + accepted.length >= Number(exampleMaxFiles) ? exampleTooMany : problem(file);
        if (message) messages.add(message);
        else accepted.push(file);
      }
      say([...messages]);
      input.value = "";
      if (accepted.length) root.dispatchEvent(new CustomEvent("example-files-add", { bubbles: true, detail: accepted }));
    };

    input.addEventListener("change", () => {
      if (input.multiple) {
        takeMany();
        return;
      }
      const file = input.files[0] ?? null;
      const message = file ? problem(file) : "";
      say(message);
      if (message) input.value = "";
      show(message ? null : file);
    });

    remove?.addEventListener("click", () => {
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
        // Only what the reset changes is put back, so nothing else settles in
        // again.
        const picture = circle?.querySelector("img:not([data-leaving])")?.getAttribute("src") ?? null;
        if (avatar && picture !== attachedPicture) showPicture(attachedPicture);
        else if (!avatar && !input.multiple && current.text.getAttribute("title") !== attached) showNameFrom(current.text, attached);
      }),
    );

    if (!root.dataset.variant) continue;

    // It lights up while files are dragged over the page, and takes a file
    // dropped on it, by the rules drag-files.js holds.
    watchFileDrop(root, {
      show: (state) => {
        if (state) root.dataset.dragging = state;
        else delete root.dataset.dragging;
      },
      take: (dropped) => {
        const chosen = new DataTransfer();
        for (const file of input.multiple ? dropped : dropped.slice(0, 1)) chosen.items.add(file);
        input.files = chosen.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
      enabled: () => !input.disabled,
      takes: () => input.matches(":enabled"),
    });
  }
}
