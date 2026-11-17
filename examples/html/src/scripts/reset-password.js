// Example only: what an app's script does for Reset Password, as the React
// pattern does. Each form checks its fields first, as the Sign-in Form's
// script does: an error goes under each field that's wrong, with aria-invalid
// on its input, the field takes focus, and the form shakes once, unless the
// reader asked for reduced motion. Then the button shows it's working while
// the app sends the link or saves the password, here a stand-in that takes a
// moment. A message it gives back goes under the email, or the new password;
// messages by field go under theirs, the first taking focus, and one for a
// field the form doesn't have joins the first field's. A request that can't
// reach the server, here for error@example.com, says "Something went wrong.
// Try again." Once it has sent or saved, the next step's markup takes the
// form's place, the card growing or shrinking to it as it fades in, and its
// title takes focus, so a screen reader reads it. The sent step holds the
// address in a hidden input, so its resend, a submit button, posts it again,
// and "try another email" is a link to the page, so both work before the
// script runs.
{
  const anEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mismatch = "Passwords must match.";
  const somethingWrong = "Something went wrong. Try again.";

  // A link goes to any address but one at example.org, which fails, one at
  // gmial.com, which can't receive email, as the server says of the email
  // itself, and error@example.com, whose request can't reach the server.
  const sendLink = (data) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        const email = String(data.get("email"));
        if (email === "error@example.com") return reject(new Error("The server can't be reached."));
        resolve(
          email.endsWith("@example.org")
            ? "We couldn't send the email. Try again in a moment."
            : email.endsWith("@gmial.com")
              ? { email: "We can't deliver email to gmial.com. Did you mean gmail.com?" }
              : { step: "sent", email },
        );
      }, 800),
    );

  // Any new password is saved but "Password123!", which is too common, and
  // "MyOldPassword1!", which was used before, as the server says of the
  // password itself.
  const savePassword = (data) =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve(
            data.get("password") === "Password123!"
              ? "This password is too common. Choose another."
              : data.get("password") === "MyOldPassword1!"
                ? { password: "You've used this password before. Choose a new one." }
                : { step: "saved" },
          ),
        800,
      ),
    );

  // A request's answer, or the message for one that fails.
  const settle = async (request) => {
    try {
      return await request;
    } catch {
      return somethingWrong;
    }
  };

  // An answer's messages for the fields there are, `main` first: a message
  // on its own, and one for a field the form doesn't have, go under `main`.
  const messagesOf = (answer, names, main = names[0]) => {
    if (typeof answer === "string") return { [main]: answer };
    if (!answer || typeof answer !== "object" || "step" in answer) return {};
    const messages = {};
    const others = [];
    for (const [name, message] of Object.entries(answer)) {
      if (typeof message !== "string" || !message) continue;
      if (names.includes(name)) messages[name] = message;
      else others.push(message);
    }
    if (others.length) messages[main] = [messages[main], ...others].filter(Boolean).join(" ");
    return messages;
  };

  // The inbox a button opens, for an address at one of these.
  const mailboxes = [
    { domain: /^gmail\.com$/, label: "Open Gmail", href: "https://mail.google.com/" },
    { domain: /^(outlook|hotmail|live)\.com$/, label: "Open Outlook", href: "https://outlook.live.com/" },
    { domain: /^yahoo\./, label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" },
  ];

  const parse = (markup) => {
    const template = document.createElement("template");
    template.innerHTML = markup;
    return template.content;
  };

  const showError = (input, message) => {
    const error = document.getElementById(`${input.id}-error`);
    error.textContent = message ?? "";
    // A password the strength meter rates too weak stays invalid.
    const weak = input.closest(".hfield").querySelector(".hpassword-strength")?.dataset.status === "error";
    if (message || weak) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  };
  const errorOf = (input) => document.getElementById(`${input.id}-error`).textContent;

  const working = (button, busy) => {
    if (busy) {
      const spinner = document.createElement("span");
      spinner.className = "hspinner";
      spinner.setAttribute("aria-hidden", "true");
      button.append(spinner);
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-disabled", "true");
    } else {
      button.querySelector(":scope > .hspinner")?.remove();
      button.removeAttribute("aria-busy");
      button.removeAttribute("aria-disabled");
    }
  };

  const shake = (form) => form.setAttribute("data-shake", "");

  // Moves focus into the new step without the page jumping as the card
  // resizes, then brings it into view if it's out of it.
  const focusStep = (element) => {
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  // Puts a step's elements in the form, in place of what it held, and moves
  // focus to the step's title at once.
  const show = (form, elements) => {
    changeStep(form, () => form.replaceChildren(...elements));
    focusStep(form.querySelector(".hauth-form-title"));
  };

  // Asking for a link: the email, then "Check your email", then, after a
  // resend, the same title again. "Try another email" puts the first step
  // back, with the address as it was typed. A resend that fails puts it back
  // too, with the message under the email. The link back to sign in stays
  // under every step.
  for (const form of document.querySelectorAll(".hauth-form[data-example-reset-request]")) {
    // The page author's link, never one filled in from the page's address.
    const support = form.dataset.exampleResetSupport;
    // Each step's title is a heading at the form's own title's level.
    const heading = form.querySelector(".hauth-form-title").localName;
    const footer = form.querySelector(":scope > .hauth-form-footer");
    const request = [...form.children].filter((child) => child !== footer);
    const email = form.elements.namedItem("email");
    const button = form.querySelector(":scope > .hbutton");
    let sentTo = "";
    let busy = false;

    const fail = (message) => {
      showError(email, message);
      shake(form);
      email.focus();
    };

    const back = (message) => {
      show(form, [...request, footer]);
      if (!message) return;
      showError(email, message);
      shake(form);
      focusStep(email);
    };

    // "Check your email", sent and sent again. The address, which the reader
    // typed, goes in as text, after.
    const sentMessage = `
      <p class="hauth-form-description">
        If an account uses <strong class="hauth-form-email"></strong>, we've sent a link there to reset your password.
      </p>
      <p class="hauth-form-description">
        If you didn't receive an email, check your spam,
        <button class="hlink hauth-form-action" type="submit" data-underlined data-example-reset-resend>resend</button>, or
        <a class="hlink" data-underlined href="" data-example-reset-another>try another email</a>.
      </p>`;
    const resentMessage = `
      <p class="hauth-form-description">
        If an account uses <strong class="hauth-form-email"></strong>, we've sent the link there again.
      </p>
      <p class="hauth-form-description">
        If you still didn't receive an email, this might be the wrong email for your account.
        <a class="hlink" data-underlined href="" data-example-reset-another>Try another email</a>
        or <a class="hlink" data-underlined data-example-reset-contact>contact our support</a>.
      </p>`;

    const sent = (again) => {
      const step = parse(`
        <div class="hauth-form-header">
          <${heading} class="hauth-form-title" tabindex="-1">Check your email</${heading}>
          <div class="hauth-form-message">${again ? resentMessage : sentMessage}</div>
        </div>
        <input type="hidden" name="email" />
        <a class="hbutton" target="_blank" rel="noopener noreferrer" data-example-reset-mailbox><span class="hbutton-label"></span></a>
      `);
      step.querySelector(".hauth-form-email").textContent = sentTo;
      step.querySelector('input[name="email"]').value = sentTo;
      step.querySelector("[data-example-reset-contact]")?.setAttribute("href", support);
      // Only the first step after sending opens the inbox, and only one it
      // knows.
      const domain = sentTo.slice(sentTo.lastIndexOf("@") + 1).toLowerCase();
      const mailbox = again ? undefined : mailboxes.find((candidate) => candidate.domain.test(domain));
      const link = step.querySelector("[data-example-reset-mailbox]");
      if (mailbox) {
        link.href = mailbox.href;
        link.querySelector(".hbutton-label").textContent = mailbox.label;
      } else {
        link.remove();
      }

      // A link to this page, which shows the first step again; here, in
      // place, unless the click asked for a new tab.
      step.querySelector("[data-example-reset-another]").addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        back();
      });
      // A submit button, which posts the hidden address again.
      const resend = step.querySelector("[data-example-reset-resend]");
      resend?.addEventListener("click", async (event) => {
        event.preventDefault();
        if (busy) return;
        busy = true;
        resend.setAttribute("aria-busy", "true");
        resend.setAttribute("aria-disabled", "true");
        const answer = await settle(sendLink(new FormData(form)));
        busy = false;
        const message = messagesOf(answer, ["email"]).email;
        if (message) return back(message);
        // Only a sent step is one; anything else changes nothing.
        if (answer?.step === "sent") {
          sentTo = answer.email ?? "";
          return sent(true);
        }
        resend.removeAttribute("aria-busy");
        resend.removeAttribute("aria-disabled");
      });
      show(form, [...step.children, footer]);
    };

    form.addEventListener("animationend", (event) => {
      if (event.target === form) form.removeAttribute("data-shake");
    });
    email.addEventListener("input", () => {
      if (errorOf(email)) showError(email, undefined);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;
      const value = email.value.trim();
      if (!value) return fail("Enter your email address.");
      if (!anEmail.test(value)) return fail("Enter an email address, such as name@example.com.");

      showError(email, undefined);
      busy = true;
      working(button, true);
      const answer = await settle(sendLink(new FormData(form)));
      working(button, false);
      busy = false;
      const message = messagesOf(answer, ["email"]).email;
      if (message) return fail(message);
      // Only a sent step is one; anything else changes nothing.
      if (answer?.step !== "sent") return;
      sentTo = answer.email ?? "";
      sent(false);
    });
  }

  // Choosing the new password, with Password Input's strength from
  // password.js, then "Your password was updated", with a link onward.
  for (const form of document.querySelectorAll(".hauth-form[data-example-reset-new-password]")) {
    const fields = {
      password: form.elements.namedItem("password"),
      confirmation: form.elements.namedItem("confirmation"),
    };
    const button = form.querySelector(":scope > .hbutton");
    const strength = fields.password.closest(".hfield").querySelector(".hpassword-strength");
    const heading = form.querySelector(".hauth-form-title").localName;

    // Shows each field's error, if there's any, and moves focus to the first;
    // says whether there was one.
    const fail = (errors) => {
      const first = Object.keys(fields).find((name) => errors[name]);
      if (!first) return false;
      for (const [name, input] of Object.entries(fields)) showError(input, errors[name]);
      shake(form);
      fields[first].focus();
      return true;
    };

    form.addEventListener("animationend", (event) => {
      if (event.target === form) form.removeAttribute("data-shake");
    });
    // Typing takes the field's error away, or, when the two don't match, both
    // fields'.
    for (const input of Object.values(fields)) {
      input.addEventListener("input", () => {
        const error = errorOf(input);
        if (!error) return;
        for (const other of error === mismatch ? Object.values(fields) : [input]) showError(other, undefined);
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button.getAttribute("aria-busy") === "true") return;
      const password = fields.password.value;
      const confirmation = fields.confirmation.value;
      const errors = {
        // The strength's lowest level, "Too weak", which password.js rates
        // as the reader types.
        password: !password
          ? "Enter a new password."
          : strength.dataset.status === "error"
            ? "Choose a stronger password."
            : undefined,
        confirmation: confirmation ? undefined : "Enter the new password again.",
      };
      if (!errors.password && !errors.confirmation && password !== confirmation) {
        errors.password = mismatch;
        errors.confirmation = mismatch;
      }
      if (fail(errors)) return;

      for (const input of Object.values(fields)) showError(input, undefined);
      working(button, true);
      // A message goes under the new password, and messages by field under
      // theirs.
      const answer = await settle(savePassword(new FormData(form)));
      working(button, false);
      if (fail(messagesOf(answer, Object.keys(fields)))) return;
      if (answer?.step !== "saved") return;

      const done = parse(`
        <${heading} class="hauth-form-title" tabindex="-1">Your password was updated</${heading}>
        <a class="hbutton"><span class="hbutton-label">Continue</span></a>
      `);
      // The page author's link, never one filled in from the page's address.
      done.querySelector("a.hbutton").href = form.dataset.exampleResetContinue;
      show(form, [...done.children]);
    });
  }
}
