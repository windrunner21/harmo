// Example only: show a banner after the page has loaded, as an app does when
// something goes wrong, so its role makes screen readers announce it.
// Pressing again hides it for a moment and shows it anew, announcing it again.
{
  for (const button of document.querySelectorAll("[data-example-show]")) {
    const banner = document.getElementById(button.dataset.exampleShow);
    button.addEventListener("click", () => {
      banner.hidden = true;
      setTimeout(() => {
        banner.hidden = false;
      }, 100);
    });
  }
}
