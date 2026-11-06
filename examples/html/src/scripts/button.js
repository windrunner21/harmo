// Example only: what the React Button does as its content changes, for any
// .hbutton. When what it shows changes, its text or whether it's loading, its
// width goes from the old to the new over --harmo-duration-normal, with
// --harmo-ease-out-cubic, rather than jumping; its content on one line and
// clipped meanwhile, then its own inline styles back. A change while one
// plays carries on from where that one had got to. With reduced motion, at
// once.
const buttonWidthChanges = new WeakMap();
const stopButtonWidthChange = (button) => {
  const playing = buttonWidthChanges.get(button);
  if (!playing) return;
  playing.animation.cancel();
  for (const [property, [value, priority]] of Object.entries(playing.styles)) {
    if (value) button.style.setProperty(property, value, priority);
    else button.style.removeProperty(property);
  }
  buttonWidthChanges.delete(button);
};
const changeButtonWidth = (button, change) => {
  const from = button.offsetWidth;
  stopButtonWidthChange(button);
  change();
  const to = button.offsetWidth;
  if (Math.abs(from - to) < 1 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const style = getComputedStyle(button);
  const duration = parseFloat(style.getPropertyValue("--harmo-duration-normal"));
  const playing = {
    animation: button.animate([{ width: `${from}px` }, { width: `${to}px` }], {
      duration: Number.isFinite(duration) ? (style.getPropertyValue("--harmo-duration-normal").trim().endsWith("ms") ? duration : duration * 1000) : 200,
      easing: style.getPropertyValue("--harmo-ease-out-cubic").trim() || "cubic-bezier(0.215, 0.61, 0.355, 1)",
    }),
    styles: Object.fromEntries(
      ["overflow", "white-space"].map((property) => [property, [button.style.getPropertyValue(property), button.style.getPropertyPriority(property)]]),
    ),
  };
  buttonWidthChanges.set(button, playing);
  button.style.overflow = "hidden";
  button.style.whiteSpace = "nowrap";
  const done = () => {
    if (buttonWidthChanges.get(button) === playing) stopButtonWidthChange(button);
  };
  playing.animation.finished.then(done, done);
};

// Example only: a button that loads for two seconds, as the React Button
// does while its action runs. aria-disabled keeps focus on it, so the script
// ignores presses while it is busy.
{
  for (const button of document.querySelectorAll("[data-example-loading]")) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-busy") === "true") return;

      const spinner = document.createElement("span");
      spinner.className = "hspinner";
      spinner.setAttribute("aria-hidden", "true");
      changeButtonWidth(button, () => {
        button.append(spinner);
        button.setAttribute("aria-busy", "true");
        button.setAttribute("aria-disabled", "true");
      });

      setTimeout(() => {
        changeButtonWidth(button, () => {
          spinner.remove();
          button.removeAttribute("aria-busy");
          button.removeAttribute("aria-disabled");
        });
      }, 2000);
    });
  }
}

// Example only: hold to confirm, as the React Button does with onHold, for a
// button with data-hold. Held by pointer, Enter, or Space for
// --hbutton-hold-duration, it's full (data-held), stays so for a moment,
// whatever the pointer or key does, then acts; let go early, nothing happens.
// A screen reader presses with a click, which can't hold, so a click with no
// press behind it acts at once. Its click never does what a button's click
// does natively, such as sending a form. Disabled meanwhile, it stops. Here,
// acting shows the button working for a moment, as an app's delete would,
// saying data-example-working.
{
  const pressKeys = new Set(["Enter", " "]);

  const durationOf = (button) => {
    const value = getComputedStyle(button).getPropertyValue("--hbutton-hold-duration").trim();
    const number = parseFloat(value);
    if (!Number.isFinite(number)) return 1500;
    return value.endsWith("ms") ? number : number * 1000;
  };

  for (const button of document.querySelectorAll(".hbutton[data-hold]")) {
    const inactive = () => button.disabled || button.getAttribute("aria-disabled") === "true";
    let holdTimer;
    let beatTimer;
    let held = false;
    let by = null;
    // The click a pointer press ends in is the hold's, not a screen reader's.
    let pressed = false;

    const stop = () => {
      clearTimeout(holdTimer);
      by = null;
      button.removeAttribute("data-holding");
    };
    const unhold = () => {
      clearTimeout(beatTimer);
      held = false;
      button.removeAttribute("data-held");
    };
    const act = () => {
      stop();
      unhold();
      if (inactive()) return;
      // The example's action: working for 1.5 seconds, saying so.
      const labels = [...button.querySelectorAll(".hbutton-label")];
      const label = labels[0].textContent;
      const spinners = [];
      changeButtonWidth(button, () => {
        for (const span of labels) {
          span.textContent = button.dataset.exampleWorking ?? label;
          const spinner = document.createElement("span");
          spinner.className = "hspinner";
          spinner.setAttribute("aria-hidden", "true");
          span.after(spinner);
          spinners.push(spinner);
        }
        button.setAttribute("aria-busy", "true");
        button.setAttribute("aria-disabled", "true");
      });
      setTimeout(() => {
        changeButtonWidth(button, () => {
          for (const spinner of spinners) spinner.remove();
          for (const span of labels) span.textContent = label;
          button.removeAttribute("aria-busy");
          button.removeAttribute("aria-disabled");
        });
      }, 1500);
    };
    // Full: it stays so, whatever the pointer or key does now, then acts.
    const complete = () => {
      stop();
      if (inactive()) return;
      held = true;
      button.setAttribute("data-held", "");
      beatTimer = setTimeout(act, 200);
    };
    const start = (source) => {
      by = source;
      button.setAttribute("data-holding", "");
      clearTimeout(holdTimer);
      holdTimer = setTimeout(complete, durationOf(button));
    };

    button.addEventListener("pointerdown", (event) => {
      pressed = true;
      if (held) return;
      // A second finger isn't a hold.
      if (!event.isPrimary) return stop();
      if (event.button !== 0 || inactive()) return;
      // A finger stays with what it pressed, even moved off it; let it go,
      // so moving off the button lets go of the hold, as with a mouse.
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
      start("pointer");
    });
    for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
      button.addEventListener(type, () => {
        if (by === "pointer") stop();
      });
    }
    button.addEventListener("contextmenu", (event) => {
      if (by === "pointer" || held) event.preventDefault();
    });
    // A mouse or touch click comes with a press, and counts at least 1; a
    // screen reader's has no press, or counts 0, and acts.
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const fromPress = pressed && event.detail > 0;
      pressed = false;
      if (fromPress || inactive() || held) return;
      act();
    });
    button.addEventListener("keydown", (event) => {
      if (!pressKeys.has(event.key)) return;
      // The press is the hold's, not a click; held keys repeat.
      event.preventDefault();
      if (event.repeat || inactive() || held) return;
      start("key");
    });
    button.addEventListener("keyup", (event) => {
      if (!pressKeys.has(event.key)) return;
      event.preventDefault();
      if (by === "key") stop();
    });
    button.addEventListener("blur", () => {
      if (!held) stop();
    });
  }
}
