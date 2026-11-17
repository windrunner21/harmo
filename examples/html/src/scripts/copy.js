// Example only: a Copy Button copies its text and says so for two seconds,
// as the React CopyButton does: its icon turns into a check, its tooltip or
// its text says it's copied, and a status tells screen readers. Its text
// changes through button.js's changeButtonWidth, loaded first, so its width
// follows; without button.js, the text changes at once. A new value, such as
// a key that's regenerated or one a form reset puts back, takes the
// confirmation back at once, and a copy that finishes after the value has
// changed isn't confirmed, since the new one wasn't copied. A Share Button
// opens the device's share sheet where the browser has one, and elsewhere
// copies the link. If copying fails, nothing changes.
let setUpCopyButton;
{
  // Calls `changed` whenever a script sets the input's value to a new one:
  // setting it sends no event.
  const onValueSet = (input, changed) => {
    const { get, set } = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    Object.defineProperty(input, "value", {
      configurable: true,
      get() {
        return get.call(this);
      },
      set(value) {
        const before = get.call(this);
        set.call(this, value);
        if (get.call(this) !== before) changed();
      },
    });
  };

  // Runs `then` after the form an input belongs to resets, even one it joined
  // later, unless the reset was cancelled: the value a reset puts back sends
  // no event either.
  const onReset = (input, then) =>
    document.addEventListener(
      "reset",
      (event) => {
        if (event.target !== input.form) return;
        setTimeout(() => {
          if (!event.defaultPrevented) then();
        });
      },
      true,
    );

  // Each Copy Button on the page, and any a script adds later, such as one
  // under a chat's reply, which chat.js sets up with this.
  setUpCopyButton = (button) => {
    const trigger = button.parentElement.matches(".htooltip-trigger") ? button.parentElement : null;
    const tooltip = trigger?.querySelector(":scope > .htooltip");
    const status = (trigger ?? button).nextElementSibling;
    const field = button.closest(".hcopy-field")?.querySelector(".hinput");
    const text = button.querySelector(".hbutton-label");
    const label = (tooltip ?? text).textContent;
    // The tooltip's words change at once, and the button's with its width.
    const say = (words) => {
      if (tooltip) tooltip.textContent = words;
      else if (typeof changeButtonWidth === "function") changeButtonWidth(button, () => (text.textContent = words));
      else text.textContent = words;
    };
    // What it copies: the field's value, or here the example's own, which
    // stands for your app's.
    const copies = () => button.dataset.exampleShare ?? (field ? field.value : button.dataset.exampleCopy);
    const { exampleCopied } = button.dataset;
    let timer;
    let announced = 0;
    let copied;

    const reset = () => {
      button.removeAttribute("data-copied");
      trigger?.removeAttribute("data-open");
      say(label);
      status.textContent = "";
    };
    const confirm = () => {
      button.setAttribute("data-copied", "");
      trigger?.setAttribute("data-open", "");
      say(exampleCopied);
      // Different each time, if only by an invisible space, so copying again
      // is read again.
      status.textContent = exampleCopied + (announced++ % 2 ? " " : "");
      clearTimeout(timer);
      timer = setTimeout(reset, 2000);
    };
    const takeBack = () => {
      if (!button.hasAttribute("data-copied") || copies() === copied) return;
      clearTimeout(timer);
      reset();
    };

    if (field) {
      onValueSet(field, takeBack);
      onReset(field, takeBack);
    }
    new MutationObserver(takeBack).observe(button, { attributeFilter: ["data-example-copy", "data-example-share"] });

    button.addEventListener("click", async (event) => {
      if (event.defaultPrevented || button.getAttribute("aria-disabled") === "true") return;
      // Read as it's pressed, so a new value is the one copied.
      const { exampleShare, exampleShareTitle } = button.dataset;
      const copying = copies();
      try {
        if (exampleShare !== undefined) {
          const data = { url: exampleShare, title: exampleShareTitle };
          if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
            try {
              await navigator.share(data);
            } catch (error) {
              if (error.name !== "AbortError") throw error;
            }
            return;
          }
        }
        await navigator.clipboard.writeText(copying);
        // Not if what it copies has changed meanwhile: the new one wasn't.
        if (copies() !== copying) return;
        copied = copying;
        confirm();
      } catch {
        // Your app says it couldn't, such as with a Toast.
      }
    });
  };
  for (const button of document.querySelectorAll(".hcopy")) setUpCopyButton(button);

  // Example only: your app regenerating a key, which sets the field's value.
  for (const button of document.querySelectorAll("[data-example-regenerate]")) {
    button.addEventListener("click", () => {
      const field = document.getElementById(button.dataset.exampleRegenerate);
      field.value = `key_${Math.random().toString(36).slice(2, 13)}`;
    });
  }
}
