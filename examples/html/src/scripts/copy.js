// Example only: a Copy Button copies its text and says so for two seconds,
// as the React CopyButton does: its icon turns into a check, its tooltip or
// its text says it's copied, and a status tells screen readers. Its text
// changes through button.js's changeButtonWidth, so its width follows. A
// Share Button opens the device's share sheet where the browser has one, and
// elsewhere copies the link. If copying fails, nothing changes.
{
  for (const button of document.querySelectorAll(".hcopy")) {
    const trigger = button.parentElement.matches(".htooltip-trigger") ? button.parentElement : null;
    const tooltip = trigger?.querySelector(":scope > .htooltip");
    const status = (trigger ?? button).nextElementSibling;
    const field = button.closest(".hcopy-field")?.querySelector(".hinput");
    const text = button.querySelector(".hbutton-label");
    const label = (tooltip ?? text).textContent;
    // The tooltip's words change at once, and the button's with its width.
    const say = (words) => {
      if (tooltip) tooltip.textContent = words;
      else changeButtonWidth(button, () => (text.textContent = words));
    };
    const { exampleCopy, exampleCopied, exampleShare, exampleShareTitle } = button.dataset;
    let timer;
    let announced = 0;

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
      status.textContent = exampleCopied + (announced++ % 2 ? "\u00a0" : "");
      clearTimeout(timer);
      timer = setTimeout(reset, 2000);
    };

    button.addEventListener("click", async (event) => {
      if (event.defaultPrevented || button.getAttribute("aria-disabled") === "true") return;
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
          await navigator.clipboard.writeText(exampleShare);
        } else {
          await navigator.clipboard.writeText(field ? field.value : exampleCopy);
        }
        confirm();
      } catch {
        // Your app says it couldn't, such as with a Toast.
      }
    });
  }
}
