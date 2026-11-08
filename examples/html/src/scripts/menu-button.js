// Example only: a Menu Button with nothing to open turns as it's pressed. One
// that opens a popup is kept current by popup.js, and any other by your app.
{
  for (const button of document.querySelectorAll(".hmenu-button:not([popovertarget])")) {
    button.addEventListener("click", () => {
      button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true"));
    });
  }
}
