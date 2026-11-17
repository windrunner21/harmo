// Example only: what an app's script does for the Sign-in form, as the React
// pattern does. A sign-in checks the fields first: an error goes under each one
// that's empty or isn't an email address, with aria-invalid on its input.
// Then the button shows it's working while the app signs in, here a stand-in
// that takes a moment and accepts only the password "harmo", and not yet for
// new@example.com, which hasn't confirmed its email; error@example.com fails
// as a request that can't reach the server does, which says "Something went
// wrong. Try again." A sign-in that fails puts its message under the
// password, or, given messages by field, such as that one for the email, each
// under its own, and one for a field the form doesn't have under the
// password. Either way, the first field with an error takes focus, and the
// form shakes once, unless the reader asked for reduced motion. Typing in a
// field takes its error away. Signed in, your app would go on to its first
// page, which says so; here a toast does, from toast.js. The other accounts
// are links, and need nothing from it.
//
// With a second step, data-example-sign-in-two-factor, the right password
// asks for a code: Verify Code's card takes the form's place, which stays in
// the page, hidden, with what was typed, the card growing or shrinking to it
// as it fades in, and its title takes focus. verify-code.js sets the card up
// as it arrives, and the right code's toast says you're signed in; "Back to
// sign in" puts the form back.
{
  const anEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const somethingWrong = "Something went wrong. Try again.";

  // Answers after a moment, as a request to a server would.
  const answer = (result) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        try {
          resolve(result());
        } catch (error) {
          reject(error);
        }
      }, 800),
    );

  // What your app's first page would say.
  const signedIn = (data) => {
    document.dispatchEvent(
      new CustomEvent("example:toast", {
        detail: { status: "success", title: "Signed in", description: `Welcome back, ${data.get("email")}.` },
      }),
    );
  };

  const signIn = (data) =>
    answer(() => {
      if (data.get("email") === "error@example.com") throw new Error("The server can't be reached.");
      return data.get("password") !== "harmo"
        ? "The email or password is incorrect."
        : data.get("email") === "new@example.com"
          ? { email: "Confirm your email address first. We've sent you a new link." }
          : signedIn(data);
    });

  // With a second step, the right password asks for the code the server sent
  // to the email.
  const signInWithCode = (data) =>
    answer(() =>
      data.get("password") !== "harmo"
        ? "The email or password is incorrect."
        : { step: "code", sentTo: String(data.get("email")) },
    );

  // Moves focus into the new step without the page jumping as the card
  // resizes, then brings it into view if it's out of it.
  const focusStep = (element) => {
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  const parse = (markup) => {
    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    return template.content.firstElementChild;
  };

  // Verify Code's card, as the React pattern renders it, with the address
  // filled in as text, never as markup, and its title at the form's title's
  // level.
  let cards = 0;
  const codeCard = (sentTo, heading) => {
    const id = `sign-in-code-${++cards}`;
    const slots = '<span class="hotp-input-slot"></span>'.repeat(6);
    const card = parse(`
      <form class="hcard hauth-form" data-variant="raised" method="post" novalidate data-example-verify-code data-example-verify-code-success="Signed in">
        <div class="hauth-form-header">
          <${heading} class="hauth-form-title" tabindex="-1">Verify it's you</${heading}>
          <p class="hauth-form-description" id="${id}-description" aria-live="polite"></p>
        </div>
        <div class="hfield">
          <label class="hlabel" for="${id}">Code</label>
          <div class="hotp-input" dir="ltr" data-example-otp-input>
            <input class="hinput" id="${id}" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
              autocorrect="off" spellcheck="false" maxlength="6" pattern="[0-9]{6}" value=""
              aria-describedby="${id}-error ${id}-description" />
            <div class="hotp-input-slots" aria-hidden="true">${slots}</div>
          </div>
          <p class="herror" id="${id}-error" aria-live="polite"></p>
        </div>
        <button class="hbutton" type="submit"><span class="hbutton-label">Verify</span></button>
        <p class="hverify-code-resend">
          Didn't get a code?
          <button class="hlink hauth-form-action" type="submit" data-underlined formaction="/sign-in/code/resend">Send a new code</button>
        </p>
        <p class="hauth-form-footer"><a class="hlink" href="">Back to sign in</a></p>
      </form>
    `);
    const description = card.querySelector(".hauth-form-description");
    if (sentTo) {
      const address = document.createElement("strong");
      address.className = "hauth-form-email";
      address.textContent = sentTo;
      description.append("We sent a 6-digit code to ", address, ".");
    } else {
      description.textContent = "Enter the 6-digit code from your authenticator app.";
    }
    return card;
  };

  for (const form of document.querySelectorAll(".hauth-form[data-example-sign-in]")) {
    const fields = { email: form.elements.namedItem("email"), password: form.elements.namedItem("password") };
    const button = form.querySelector(":scope > .hbutton");
    const twoFactor = form.hasAttribute("data-example-sign-in-two-factor");

    const show = (name, message) => {
      const input = fields[name];
      const error = document.getElementById(`${input.id}-error`);
      error.textContent = message ?? "";
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };

    // Shows each field's error, if there's any, and moves focus to the first;
    // says whether there was one.
    const fail = (errors) => {
      const first = Object.keys(fields).find((name) => errors[name]);
      if (!first) return false;
      for (const name of Object.keys(fields)) show(name, errors[name]);
      form.setAttribute("data-shake", "");
      fields[first].focus();
      return true;
    };

    // A message on its own goes under the password, and messages by field
    // under theirs; one for a field the form doesn't have joins the
    // password's.
    const messagesOf = (result) => {
      if (typeof result === "string") return { password: result };
      if (!result || typeof result !== "object" || "step" in result) return {};
      const messages = {};
      const others = [];
      for (const [name, message] of Object.entries(result)) {
        if (typeof message !== "string" || !message) continue;
        if (name in fields) messages[name] = message;
        else others.push(message);
      }
      if (others.length) messages.password = [messages.password, ...others].filter(Boolean).join(" ");
      return messages;
    };

    const working = (busy) => {
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

    // The code's card in the form's place, and back: the form stays, hidden,
    // with what was typed.
    const askForCode = (sentTo) => {
      const card = codeCard(sentTo, form.querySelector(".hauth-form-title").localName);
      card.querySelector(".hauth-form-footer > .hlink").addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        changeStep(
          card,
          () => {
            card.remove();
            form.hidden = false;
          },
          form,
        );
        const title = form.querySelector(".hauth-form-title");
        title.tabIndex = -1;
        focusStep(title);
      });
      changeStep(
        form,
        () => {
          form.hidden = true;
          form.after(card);
        },
        card,
      );
      focusStep(card.querySelector(".hauth-form-title"));
    };

    form.addEventListener("animationend", (event) => {
      if (event.target === form) form.removeAttribute("data-shake");
    });
    for (const [name, input] of Object.entries(fields)) {
      input.addEventListener("input", () => {
        if (input.hasAttribute("aria-invalid")) show(name, undefined);
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button.getAttribute("aria-busy") === "true") return;
      const email = fields.email.value.trim();
      const password = fields.password.value;
      const errors = {
        email: !email
          ? "Enter your email address."
          : anEmail.test(email)
            ? undefined
            : "Enter an email address, such as name@example.com.",
        password: password ? undefined : "Enter your password.",
      };
      if (fail(errors)) return;

      for (const name of Object.keys(fields)) show(name, undefined);
      working(true);
      let result;
      try {
        result = await (twoFactor ? signInWithCode : signIn)(new FormData(form));
      } catch {
        result = somethingWrong;
      }
      working(false);
      if (twoFactor && result?.step === "code") askForCode(result.sentTo);
      else fail(messagesOf(result));
    });
  }
}
