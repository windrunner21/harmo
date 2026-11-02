// Example only: toggle aria-expanded on press, as a disclosure, accordion, or
// menu button's own script does. The chevron follows it.
{
  for (const button of document.querySelectorAll("[data-example-expand]")) {
    button.addEventListener("click", () => {
      button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true"));
    });
  }
}
