// Example only: what an app's script does for the Sign-up form, as the React
// pattern does. A sign-up checks the fields first: an error goes under each one
// that's empty, an email that isn't an address, a password that's too weak,
// and a terms checkbox that isn't checked, in a form that has one, with
// aria-invalid on its input; a form with the terms' line under the button
// has nothing to check for them. Then the button shows it's working while the
// app signs up, with whether the marketing emails' box is checked, here a
// stand-in that takes a moment, finds an account already using
// sam@example.com, turns down "Password123!", which has appeared in a data
// breach, and fails for error@example.com, as a request that can't reach the
// server does, which says "Something went wrong. Try again." A sign-up that
// fails puts its message under the email, or, given messages by field, such
// as that one for the password, each under its own, and one for a field the
// form doesn't have under the email. Either way, the first field with an
// error takes focus, and the form shakes once, unless the reader asked for
// reduced motion. Typing in a field, or checking the box, takes its error
// away. The password's strength is Password Input's, from password.js, which
// rates any input with data-example-password-strength, and steps it aside
// while the field shows an error. The other accounts are links, and need
// nothing from it.
//
// Asked to confirm the email, data-example-sign-up-confirm, every address
// goes to the next step, sam@example.com's too, as the server would email
// its owner instead: "Check your email" for "link", or Verify Code's card for
// "code", which verify-code.js sets up as it arrives. It takes the form's
// place, which stays in the page, hidden, with what was typed, the card
// growing or shrinking to it as it fades in, and its title takes focus. "Use
// another email" puts the form back.
{
  const anEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const somethingWrong = "Something went wrong. Try again.";

  // The lowest level of password.js's strength rule, "Too weak".
  const tooWeak = (password) => password.length < 10;

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

  const breached = { password: "This password has appeared in a data breach. Choose another." };

  const signUp = (data, confirm) =>
    answer(() => {
      if (data.get("email") === "error@example.com") throw new Error("The server can't be reached.");
      if (!confirm && data.get("email") === "sam@example.com") return "An account already uses that email.";
      if (data.get("password") === "Password123!") return breached;
      return confirm ? { step: "confirm", email: String(data.get("email")) } : undefined;
    });

  const resend = () => answer(() => ({ sent: true }));

  // The inbox a button opens, for an address at one of these.
  const mailboxes = [
    { domain: /^gmail\.com$/, label: "Open Gmail", href: "https://mail.google.com/" },
    { domain: /^(outlook|hotmail|live)\.com$/, label: "Open Outlook", href: "https://outlook.live.com/" },
    { domain: /^yahoo\./, label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" },
  ];

  // Changes a card to its next step: measures the card, makes the change, and
  // measures the card shown then, `next` when that's another, as when Account
  // Forms switches forms. Its height, and its width if that changed, go from
  // the old size to the new with --harmo-ease-out-cubic, over
  // --harmo-duration-normal and half a millisecond more for each pixel, up to
  // 150ms more, its content clipped and packed at its start meanwhile; then
  // nothing is left inline, so it sizes itself again. What stays in the card,
  // such as the band along its bottom, goes from where it was to where it is
  // now, as the card's edge does. What the change shows fades in over
  // --harmo-duration-normal with --harmo-ease-out-cubic, and what it took
  // away goes at once. A change while one plays starts from where it had got
  // to, as the animations' ids find it, whichever script started them. Under
  // reduced motion, only the fade plays.
  const changeStep = (card, change, next = card) => {
    const token = (name) => getComputedStyle(next).getPropertyValue(name).trim();
    const milliseconds = (value, fallback) =>
      Number.isFinite(parseFloat(value)) ? parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) : fallback;
    const isShown = (element) => getComputedStyle(element).display !== "none";
    // The computed size, so a card mid-resize measures where it has got to.
    const sizeOf = (element) => {
      const { width, height } = getComputedStyle(element);
      return { width: parseFloat(width) || 0, height: parseFloat(height) || 0 };
    };
    const offsetOf = (child, parent) => {
      const inner = child.getBoundingClientRect();
      const outer = parent.getBoundingClientRect();
      return { x: inner.left - outer.left, y: inner.top - outer.top };
    };
    const playing = (element, id) => element.getAnimations().filter((animation) => animation.id === id);

    // Takes away what it set inline, once the card isn't resizing, and the
    // style attribute if that leaves it empty. Chrome writes a changed inline
    // style to the attribute only as it's read, so it's read first, or it
    // would come back empty after its removal.
    const unclip = (element) => {
      if (playing(element, "harmo-step-resize").length) return;
      for (const name of ["overflow", "align-content", "overflow-anchor"]) element.style.removeProperty(name);
      if (!element.style.length && element.getAttribute("style") !== null) element.removeAttribute("style");
    };

    // Nothing in the card anchors the page's scroll until it has resized: the
    // browser would scroll to keep what stays, such as its band, where it was
    // when the new step lays out to be measured.
    card.style.overflowAnchor = "none";
    const before = sizeOf(card);
    const shown = new Map([...card.children].filter(isShown).map((child) => [child, offsetOf(child, card)]));
    change();
    for (const element of [card, next, ...shown.keys()]) {
      for (const animation of [...playing(element, "harmo-step-resize"), ...playing(element, "harmo-step-move")]) {
        animation.cancel();
      }
    }
    const after = sizeOf(next);
    const fade = milliseconds(token("--harmo-duration-normal"), 200);
    const started = [];

    for (const child of next.children) {
      if (shown.has(child) || !isShown(child)) continue;
      started.push(
        child.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: fade,
          easing: token("--harmo-ease-out-cubic") || "cubic-bezier(0.215, 0.61, 0.355, 1)",
        }),
      );
    }

    const wider = Math.abs(after.width - before.width);
    const distance = Math.max(wider, Math.abs(after.height - before.height));
    const timing = {
      duration: fade + Math.min(distance, 300) / 2,
      easing: token("--harmo-ease-out-cubic") || "cubic-bezier(0.215, 0.61, 0.355, 1)",
    };
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const [child, was] of still ? [] : shown) {
      if (child.parentElement !== next || !isShown(child)) continue;
      const now = offsetOf(child, next);
      const x = was.x - now.x;
      const y = was.y - now.y;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
      started.push(child.animate([{ translate: `${x}px ${y}px` }, { translate: "0 0" }], { ...timing, id: "harmo-step-move" }));
    }

    if (!still && distance >= 1 && before.width >= 1 && before.height >= 1) {
      const from = { height: `${before.height}px` };
      const to = { height: `${after.height}px` };
      if (wider >= 1) {
        from.width = `${before.width}px`;
        to.width = `${after.width}px`;
      }
      const animation = next.animate([from, to], { ...timing, id: "harmo-step-resize" });
      started.push(animation);
      // A grid card would stretch its rows to the height it's given; packed
      // at its start, the new step lays out as it will end, clipped by the
      // card.
      next.style.overflow = "clip";
      next.style.alignContent = "start";
      next.style.overflowAnchor = "none";
      const done = () => unclip(next);
      animation.finished.then(done, done);
    }

    // Started on this frame, together, rather than once the compositor has
    // taken the fades, which can hold the card at its old size, empty, for a
    // frame or two.
    const now = document.timeline.currentTime;
    if (now !== null) for (const animation of started) animation.startTime = now;
    unclip(card);
    unclip(next);
  };

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

  // The address, as text, never as markup: it's what was typed.
  const addressOf = (email) => {
    const address = document.createElement("strong");
    address.className = "hauth-form-email";
    address.textContent = email;
    return address;
  };

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

  // "Check your email", as the React pattern renders it, and as Reset
  // Password's sent step reads. Each card's title is at the form's title's
  // level.
  const linkCard = (email, signInHref, heading) => {
    const card = parse(`
      <form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
        <div class="hauth-form-header">
          <${heading} class="hauth-form-title" tabindex="-1">Check your email</${heading}>
          <div class="hauth-form-message">
            <p class="hauth-form-description"></p>
            <p class="hauth-form-description">
              If you didn't receive an email, check your spam,
              <button class="hlink hauth-form-action" type="submit" data-underlined>resend</button>, or
              <a class="hlink" data-underlined href="">use another email</a>.
            </p>
          </div>
        </div>
        <input type="hidden" name="email" />
        <a class="hbutton" target="_blank" rel="noopener noreferrer"><span class="hbutton-label"></span></a>
        <p class="hauth-form-footer">
          Already have an account? <a class="hlink" data-underlined>Sign in</a>
        </p>
      </form>
    `);
    card
      .querySelector(".hauth-form-description")
      .append("We've sent a link to ", addressOf(email), ". Open it to confirm your email address.");
    card.querySelector('input[name="email"]').value = email;
    card.querySelector(".hauth-form-footer > .hlink").href = signInHref;
    const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
    const mailbox = mailboxes.find((candidate) => candidate.domain.test(domain));
    const open = card.querySelector(":scope > a.hbutton");
    if (mailbox) {
      open.href = mailbox.href;
      open.querySelector(".hbutton-label").textContent = mailbox.label;
    } else {
      open.remove();
    }
    return card;
  };

  // Verify Code's card, as the React pattern renders it for the email.
  let cards = 0;
  const codeCard = (email, heading) => {
    const id = `sign-up-code-${++cards}`;
    const slots = '<span class="hotp-input-slot"></span>'.repeat(6);
    const card = parse(`
      <form class="hcard hauth-form" data-variant="raised" method="post" novalidate data-example-verify-code>
        <div class="hauth-form-header">
          <${heading} class="hauth-form-title" tabindex="-1">Check your email</${heading}>
          <p class="hauth-form-description" id="${id}-description" aria-live="polite"></p>
        </div>
        <input type="hidden" name="email" />
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
          <button class="hlink hauth-form-action" type="submit" data-underlined formaction="/sign-up/code/resend">Send a new code</button>
        </p>
        <p class="hauth-form-footer"><a class="hlink" href="">Use another email</a></p>
      </form>
    `);
    card.querySelector(".hauth-form-description").append("We sent a 6-digit code to ", addressOf(email), ".");
    card.querySelector('input[name="email"]').value = email;
    return card;
  };

  // A click that follows a link in place, rather than as the reader asked,
  // such as in a new tab.
  const inPlace = (event) =>
    !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

  for (const form of document.querySelectorAll(".hauth-form[data-example-sign-up]")) {
    // In the form's order, which is the order focus looks for an error in. A
    // form without the name has no name field, and one with the terms' line,
    // or without the terms, no checkbox for them.
    const fields = Object.fromEntries(
      ["name", "email", "password", "terms"]
        .map((name) => [name, form.elements.namedItem(name)])
        .filter(([, input]) => input),
    );
    const button = form.querySelector(":scope > .hbutton");
    const confirm = form.dataset.exampleSignUpConfirm;
    const signInHref = form.querySelector(":scope > .hauth-form-footer > .hlink").getAttribute("href");
    const errorOf = (input) => document.getElementById(`${input.id}-error`);

    // A password that's too weak stays invalid without an error, as its
    // strength says.
    const show = (name, message) => {
      const input = fields[name];
      errorOf(input).textContent = message ?? "";
      if (message || (name === "password" && tooWeak(input.value))) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };

    // Shows each field's error, if there's any for a field the form has, and
    // moves focus to the first; says whether there was one.
    const fail = (errors) => {
      const first = Object.keys(fields).find((name) => errors[name]);
      if (!first) return false;
      for (const name of Object.keys(fields)) show(name, errors[name]);
      form.setAttribute("data-shake", "");
      fields[first].focus();
      return true;
    };

    // A message on its own goes under the email, and messages by field under
    // theirs; one for a field the form doesn't have joins the email's.
    const messagesOf = (result) => {
      if (typeof result === "string") return { email: result };
      if (!result || typeof result !== "object" || "step" in result) return {};
      const messages = {};
      const others = [];
      for (const [name, message] of Object.entries(result)) {
        if (typeof message !== "string" || !message) continue;
        if (name in fields) messages[name] = message;
        else others.push(message);
      }
      if (others.length) messages.email = [messages.email, ...others].filter(Boolean).join(" ");
      return messages;
    };

    // The next step's card in the form's place, and back, with what was
    // typed, or with a message under the email.
    const toCard = (card) => {
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
    const back = (card, message) => {
      changeStep(
        card,
        () => {
          card.remove();
          form.hidden = false;
        },
        form,
      );
      if (message) return fail({ email: message });
      const title = form.querySelector(".hauth-form-title");
      title.tabIndex = -1;
      focusStep(title);
    };

    const askToConfirm = (email) => {
      const heading = form.querySelector(".hauth-form-title").localName;
      const card = confirm === "code" ? codeCard(email, heading) : linkCard(email, signInHref, heading);
      const another = card.querySelector('a.hlink[href=""]');
      another.addEventListener("click", (event) => {
        if (!inPlace(event)) return;
        event.preventDefault();
        back(card);
      });
      // By link, a resend that works says the link went again, and one that
      // fails goes back to the form, with its message under the email. By
      // code, verify-code.js resends.
      const again = confirm === "link" ? card.querySelector(".hauth-form-action") : null;
      again?.addEventListener("click", async (event) => {
        event.preventDefault();
        if (again.getAttribute("aria-busy") === "true") return;
        again.setAttribute("aria-busy", "true");
        again.setAttribute("aria-disabled", "true");
        let result;
        try {
          result = await resend(new FormData(card, again));
        } catch {
          result = somethingWrong;
        }
        again.removeAttribute("aria-busy");
        again.removeAttribute("aria-disabled");
        const message = typeof result === "string" ? result : "";
        if (message) return back(card, message);
        const description = card.querySelector(".hauth-form-description");
        description.replaceChildren("We've sent the link to ", description.querySelector(".hauth-form-email"), " again.");
        focusStep(card.querySelector(".hauth-form-title"));
      });
      toCard(card);
    };

    form.addEventListener("animationend", (event) => {
      if (event.target === form) form.removeAttribute("data-shake");
    });
    for (const [name, input] of Object.entries(fields)) {
      input.addEventListener("input", () => {
        if (errorOf(input).textContent) show(name, undefined);
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button.getAttribute("aria-busy") === "true") return;
      const name = fields.name?.value.trim();
      const email = fields.email.value.trim();
      const password = fields.password.value;
      const errors = {
        name: fields.name && !name ? "Enter your name." : undefined,
        email: !email
          ? "Enter your email address."
          : anEmail.test(email)
            ? undefined
            : "Enter an email address, such as name@example.com.",
        password: !password ? "Enter a password." : tooWeak(password) ? "Choose a stronger password." : undefined,
        terms: !fields.terms || fields.terms.checked ? undefined : "Agree to the terms to create your account.",
      };
      if (fail(errors)) return;

      for (const name of Object.keys(fields)) show(name, undefined);
      working(button, true);
      // What the form posts: the name, email, and password, and the boxes
      // that are checked, marketing's among them.
      let result;
      try {
        result = await signUp(new FormData(form), Boolean(confirm));
      } catch {
        result = somethingWrong;
      }
      working(button, false);
      if (confirm && result?.step === "confirm") askToConfirm(result.email);
      else fail(messagesOf(result));
    });
  }
}
