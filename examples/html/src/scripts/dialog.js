// Example only: what the React Dialog and Drawer do, for both.
//
// A closing dialog fades out in every browser, as an opening one fades in, and
// a drawer slides out as it slid in:
// the script holds the close while data-closing fades it, then closes it, as
// a library keeps a closing element until its exit has played. Escape, a click
// outside, and buttons with command="request-close" all send the dialog's
// cancel event first, which it holds; a form sent with method="dialog" it holds
// as it's sent. Either one the app has already stopped, such as to confirm
// unsaved changes, it leaves alone. Without the script, the dialog still
// closes, at once in Firefox and Safari.
//
// It also opens the dialog that the URL names, as an app's router would
// (?dialog=its-id), so a link to it, a reload, and Back all work, and stands
// in for the app in the "Unsaved changes" example, which asks before closing.
{
  // Each dialog's exit that's playing, so one that stops early, because the
  // dialog was closed some other way or is wanted open again, doesn't close it.
  const exits = new Map();

  // Waits for what data-closing starts, then closes the dialog. A frame first,
  // since WebKit may start a transition only then; never much longer than its
  // longest transition, so a dialog whose fade doesn't run still closes.
  const closeAfterFade = (dialog, returnValue) => {
    if (exits.has(dialog)) return;
    const exit = {};
    exits.set(dialog, exit);
    dialog.setAttribute("data-closing", "");
    requestAnimationFrame(() => {
      const fading = dialog.getAnimations().map((animation) => animation.finished.catch(() => {}));
      const seconds = Math.max(0, ...getComputedStyle(dialog).transitionDuration.split(",").map(parseFloat));
      const longest = new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 100));
      Promise.race([Promise.all(fading), longest]).then(() => {
        if (exits.get(dialog) !== exit) return;
        exits.delete(dialog);
        dialog.close(returnValue);
        dialog.removeAttribute("data-closing");
      });
    });
  };

  // Ends an exit without closing, so it stays open and slides or fades back.
  const stopExit = (dialog) => {
    exits.delete(dialog);
    dialog.removeAttribute("data-closing");
  };

  // The "Unsaved changes" example, as an app would write it: closing the
  // settings with changes that aren't saved asks first, in the dialog that
  // data-example-unsaved names. Its cancel listener comes before the fade's
  // below, as an app's own handler runs first.
  for (const settings of document.querySelectorAll("dialog[data-example-unsaved]")) {
    const asking = document.getElementById(settings.dataset.exampleUnsaved);
    const form = settings.querySelector("form");
    const fields = [...form.querySelectorAll("input")];

    // What was last saved is what the fields were written with: each opening
    // starts from it, and sending the form saves what's in them. As they
    // close, the dialog that asks closes first, so focus goes back through
    // them to the button that opened them.
    settings.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") form.reset();
      else asking.close();
    });
    form.addEventListener("submit", () => {
      for (const field of fields) field.defaultValue = field.value;
    });

    // A close the browser doesn't let the page stop still closes it: after the
    // page stops one Escape, it may stop another only once the person has
    // clicked or typed.
    settings.addEventListener("cancel", (event) => {
      if (!event.cancelable || fields.every((field) => field.value === field.defaultValue)) return;
      event.preventDefault();
      asking.showModal();
    });

    // Discard fades the settings out with the dialog that asks, which its
    // command="request-close" fades, so both go in one exit; whichever fade
    // ends first, the dialog that asks closes first.
    asking.querySelector("[data-example-discard]").addEventListener("click", () => closeAfterFade(settings));
    // Otherwise, they stay open, and focus goes back inside, to the first
    // field if a click outside took it away.
    asking.addEventListener("close", () => {
      if (settings.open && !settings.contains(document.activeElement)) fields[0].focus();
    });
  }

  for (const dialog of document.querySelectorAll(".hdialog, .hdrawer")) {
    // A command="request-close" button's value, kept for the cancel event its
    // press fires, in the same task, so holding that event doesn't drop it.
    // Only for that task, so a later Escape can't reuse it.
    let requested;
    dialog.addEventListener("command", (event) => {
      if (event.command !== "request-close" || !event.source?.hasAttribute("value")) return;
      requested = event.source.value;
      setTimeout(() => (requested = undefined));
    });
    dialog.addEventListener("cancel", (event) => {
      const value = requested;
      requested = undefined;
      // The browser lets a page hold Escape only after the person has used
      // it; otherwise, it closes at once.
      if (!event.cancelable || event.defaultPrevented) return;
      event.preventDefault();
      closeAfterFade(dialog, value);
    });
    dialog.addEventListener("beforetoggle", (event) => {
      if (event.newState === "closed" && exits.has(dialog)) stopExit(dialog);
    });
    // Wanted open again while its exit plays, as Command Menu's shortcut does
    // by removing data-closing, the exit stops, and it stays open.
    new MutationObserver(() => {
      if (!dialog.hasAttribute("data-closing")) exits.delete(dialog);
    }).observe(dialog, { attributes: true, attributeFilter: ["data-closing"] });
  }

  // On the document, so an app's own handler on the form runs first.
  document.addEventListener("submit", (event) => {
    const form = event.target;
    const submitter = event.submitter;
    // A submit button's own formmethod wins over its form's method.
    const method = submitter?.hasAttribute("formmethod") ? submitter.formMethod : form.method;
    const dialog = form.closest("dialog");
    if (event.defaultPrevented || method !== "dialog" || !dialog?.matches(".hdialog, .hdrawer")) return;
    event.preventDefault();
    closeAfterFade(dialog, submitter?.hasAttribute("value") ? submitter.value : undefined);
  });

  // The dialogs a URL opens.
  const linked = [...document.querySelectorAll("dialog[data-example-url-dialog]")];
  const named = () => new URL(location.href).searchParams.get("dialog");

  const sync = () => {
    for (const dialog of linked) {
      const wanted = dialog.id === named();
      if (wanted && exits.has(dialog)) stopExit(dialog);
      if (wanted && !dialog.open) dialog.showModal();
      if (!wanted && dialog.open) closeAfterFade(dialog);
    }
  };

  // A link to one of them changes the URL in place, as a router's links do,
  // rather than loading the page again. A click with a modifier key, or one
  // something else has handled, is left to the browser, so it can open the
  // link in a new tab.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href);
    const samePage = url.protocol === location.protocol && url.host === location.host && url.pathname === location.pathname;
    if (!samePage) return;
    const id = url.searchParams.get("dialog");
    if (!linked.some((dialog) => dialog.id === id)) return;
    event.preventDefault();
    // Only its own parameter changes, so the URL's others stay.
    const next = new URL(location.href);
    next.searchParams.set("dialog", id);
    history.pushState({ dialog: true }, "", next);
    sync();
  });

  // Closing goes back, so Back doesn't open it again; opened straight from a
  // link, with nothing to go back to, closing takes the parameter off instead.
  for (const dialog of linked) {
    dialog.addEventListener("close", () => {
      if (named() !== dialog.id) return;
      if (history.state?.dialog) history.back();
      else {
        const url = new URL(location.href);
        url.searchParams.delete("dialog");
        history.replaceState(null, "", url);
      }
    });
  }

  addEventListener("popstate", sync);
  sync();
}
