// Example only: validate a coupon code when the field is left, as an app
// would. A failing code sets aria-invalid and the error's text, which reveals
// it. A valid one closes the error with hidden, then clears its text once the
// exit has finished, so screen readers don't read a stale message.
{
  for (const input of document.querySelectorAll("[data-example-coupon]")) {
    const error = input.closest(".hfield").querySelector(".herror");
    input.addEventListener("change", () => {
      const code = input.value.trim().toUpperCase();
      if (code === "" || code === "SPRING25") {
        input.removeAttribute("aria-invalid");
        error.hidden = true;
        // At once if nothing animates; showing the error again cancels the
        // exit, and with it the clearing.
        Promise.all(error.getAnimations().map((animation) => animation.finished)).then(
          () => {
            if (error.hidden) error.textContent = "";
          },
          () => {},
        );
      } else {
        input.setAttribute("aria-invalid", "true");
        error.textContent = "This coupon code is not valid.";
        error.hidden = false;
      }
    });
  }
}
