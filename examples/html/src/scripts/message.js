// Example only: what your app does with a reply's ratings. They're toggle
// Buttons, which button.js turns on and off; one turning on turns the other
// off, as a reply is good or bad, not both.
{
  document.addEventListener("click", (event) => {
    const rating = event.target.closest?.("[data-example-rating]");
    if (!rating || rating.getAttribute("aria-pressed") !== "true") return;
    for (const other of rating.closest(".hmessage-actions").querySelectorAll("[data-example-rating]")) {
      if (other !== rating) other.setAttribute("aria-pressed", "false");
    }
  });
}
