// Example only: what the React Dialog does.
//
// A closing dialog fades out in every browser, as an opening one fades in:
// the script holds the close while data-closing fades it, then closes it, as
// a library keeps a closing element until its exit has played. Escape, a click
// outside, and buttons with command="request-close" all send the dialog's
// cancel event first, which it holds; a <form method="dialog"> it holds as
// it's sent, unless the app has already stopped that. Without the script, the
// dialog still closes, at once in Firefox and Safari.
//
// It also opens the dialog that the URL names, as an app's router would
// (?dialog=its-id), so a link to it, a reload, and Back all work.
{
  // Waits for what data-closing starts, then closes the dialog. A frame first,
  // since WebKit may start a transition only then; never much longer than its
  // longest transition, so a dialog whose fade doesn't run still closes.
  const closeAfterFade = (dialog, returnValue) => {
    if (dialog.hasAttribute("data-closing")) return;
    dialog.setAttribute("data-closing", "");
    requestAnimationFrame(() => {
      const fading = dialog.getAnimations().map((animation) => animation.finished.catch(() => {}));
      const seconds = Math.max(0, ...getComputedStyle(dialog).transitionDuration.split(",").map(parseFloat));
      const longest = new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 100));
      Promise.race([Promise.all(fading), longest]).then(() => {
        dialog.close(returnValue);
        dialog.removeAttribute("data-closing");
      });
    });
  };

  for (const dialog of document.querySelectorAll(".hdialog")) {
    dialog.addEventListener("cancel", (event) => {
      // The browser lets a page hold Escape only after the person has used
      // it; otherwise, it closes at once.
      if (!event.cancelable) return;
      event.preventDefault();
      closeAfterFade(dialog);
    });
  }

  // On the document, so an app's own handler on the form runs first.
  document.addEventListener("submit", (event) => {
    const form = event.target;
    const dialog = form.closest(".hdialog");
    if (event.defaultPrevented || form.method !== "dialog" || !dialog) return;
    event.preventDefault();
    const submitter = event.submitter;
    closeAfterFade(dialog, submitter?.hasAttribute("value") ? submitter.value : undefined);
  });

  // The dialogs a URL opens.
  const linked = [...document.querySelectorAll(".hdialog[data-example-url-dialog]")];
  const named = () => new URL(location.href).searchParams.get("dialog");

  const sync = () => {
    for (const dialog of linked) {
      const wanted = dialog.id === named();
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
