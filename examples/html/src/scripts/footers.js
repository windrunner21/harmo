// Example only: what an app's script does for the Footers pattern, as the
// React pattern does. The rest is the components' scripts': footer.js keeps
// the groups open while they're side by side, and language-picker.js the
// Language Picker. The newsletter's Subscribe checks the email first: empty
// or malformed, it says so under the field, with aria-invalid on it, and the
// field takes focus. Then the button shows it's working, and the field is
// read-only, while the app adds the address to its mailing list, here a
// stand-in that takes a moment, for which taken@example.com is already on it.
// Its answer goes under the field, or, once subscribed, the field is emptied
// and the status under the form says so. Typing takes the error away. The
// form posts, so before this script runs, the address goes to your server in
// the request's body, not its URL.
{
  const anEmail = /^[\w.!#$%&'*+\/=?^`{|}~-]+@[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i;
  const subscribe = (email) =>
    new Promise((resolve) =>
      setTimeout(() => resolve(email === "taken@example.com" ? "That address is already subscribed." : undefined), 800),
    );

  for (const form of document.querySelectorAll(".hnewsletter-footer-form")) {
    const input = form.querySelector('input[name="email"]');
    const error = document.getElementById(input.getAttribute("aria-describedby"));
    const button = form.querySelector('button[type="submit"]');
    const status = form.parentElement.querySelector(".hnewsletter-footer-status");

    const say = (message) => {
      error.textContent = message;
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };
    const working = (busy) => {
      if (busy) {
        const spinner = document.createElement("span");
        spinner.className = "hspinner";
        spinner.setAttribute("aria-hidden", "true");
        button.append(spinner);
        button.setAttribute("aria-busy", "true");
        button.setAttribute("aria-disabled", "true");
        input.readOnly = true;
      } else {
        button.querySelector(":scope > .hspinner")?.remove();
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-disabled");
        input.readOnly = false;
      }
    };

    input.addEventListener("input", () => say(""));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button.getAttribute("aria-busy") === "true") return;
      const email = input.value.trim();
      status.textContent = "";
      const invalid = !email
        ? "Enter your email address."
        : anEmail.test(email)
          ? ""
          : "Enter an email address, such as name@example.com.";
      if (invalid) {
        say(invalid);
        input.focus();
        return;
      }
      say("");
      working(true);
      let failed;
      try {
        failed = await subscribe(email);
      } catch {
        failed = "Something went wrong. Try again.";
      } finally {
        working(false);
      }
      if (failed) {
        say(failed);
        input.focus();
        return;
      }
      form.reset();
      status.textContent = `Subscribed. The next one goes to ${email}.`;
    });
  }
}
