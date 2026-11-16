// Example only: what an app's script does for Verify Code, as the React
// pattern does. The code's field is OTP Input's, from otp-input.js. Once the
// code is whole, typed, pasted, or filled in from a message, the form sends
// itself. Sending checks the code first: an error goes under the field, with
// aria-invalid on its input, the field takes focus, and the form shakes once,
// unless the reader asked for reduced motion. Then the button shows it's
// working while the app checks the code, here a stand-in that takes a moment
// and accepts only 123456, and fails, as a request that can't reach the
// server does, for 000000. A code it turns down puts its message under the
// field, which takes focus with the code selected, so typing replaces it.
// "Send a new code" waits, counting down, 30 seconds or the form's
// data-example-verify-code-resend-after, then sends one, here always, says
// so where the address is, and waits again. A form a script adds later, such
// as the Sign-in Form's step that asks for a code, is set up as it arrives;
// its way back is that script's.
{
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

  const verify = (data) =>
    answer(() => {
      if (data.get("code") === "000000") throw new Error("The server can't be reached.");
      return data.get("code") === "123456" ? undefined : { code: "That code isn't right. Check it, or send a new one." };
    });

  const resend = () => answer(() => ({ sent: true }));

  // The message an answer has for the form: a message, or any message by field.
  const messageOf = (result) =>
    typeof result === "string"
      ? result
      : result && typeof result === "object" && !("sent" in result)
        ? Object.values(result)
            .filter((message) => typeof message === "string" && message)
            .join(" ")
        : "";

  const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

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

  const setUp = (form) => {
    const field = form.elements.namedItem("code");
    const error = document.getElementById(`${field.id}-error`);
    const description = form.querySelector(".hauth-form-header > .hauth-form-description");
    const button = form.querySelector(":scope > .hbutton");
    const again = form.querySelector(".hverify-code-resend > .hauth-form-action");
    const wait = Number(form.dataset.exampleVerifyCodeResendAfter ?? 30);
    const letters = field.closest(".hotp-input").dataset.characters === "alphanumeric";
    let busy = false;
    let last = field.value;
    let timer;

    const show = (message) => {
      error.textContent = message ?? "";
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    };

    const fail = (message) => {
      show(message);
      form.setAttribute("data-shake", "");
      field.focus();
      field.select();
    };

    // "Send a new code in 0:24", then "Send a new code", updated as each
    // second passes.
    const countDown = (until) => {
      clearTimeout(timer);
      const tick = () => {
        const remaining = until - Date.now();
        const left = remaining > 0 ? Math.ceil(remaining / 1000) : 0;
        again.textContent = left > 0 ? `Send a new code in ${clock(left)}` : "Send a new code";
        if (left > 0) again.setAttribute("aria-disabled", "true");
        else again.removeAttribute("aria-disabled");
        if (left > 0) timer = setTimeout(tick, remaining - (left - 1) * 1000);
      };
      tick();
    };
    if (again) countDown(Date.now() + wait * 1000);

    form.addEventListener("animationend", (event) => {
      if (event.target === form) form.removeAttribute("data-shake");
    });

    // After OTP Input's script has cleaned what was typed.
    form.addEventListener("input", (event) => {
      if (event.target !== field) return;
      if (error.textContent) show(undefined);
      if (field.value.length === field.maxLength && field.value !== last) form.requestSubmit();
      last = field.value;
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;
      const code = field.value;
      const size = field.maxLength;
      const missing = !code
        ? "Enter the code."
        : code.length < size
          ? `Enter all ${size} ${letters ? "characters" : "digits"}.`
          : undefined;
      if (missing) {
        show(missing);
        form.setAttribute("data-shake", "");
        field.focus();
        return;
      }
      show(undefined);
      busy = true;
      working(button, true);
      let result;
      try {
        result = await verify(new FormData(form));
      } catch {
        result = somethingWrong;
      }
      working(button, false);
      busy = false;
      const message = messageOf(result);
      if (message) fail(message);
    });

    again?.addEventListener("click", async (event) => {
      event.preventDefault();
      if (busy || again.getAttribute("aria-disabled") === "true") return;
      busy = true;
      show(undefined);
      again.setAttribute("aria-disabled", "true");
      again.setAttribute("aria-busy", "true");
      let result;
      try {
        result = await resend(new FormData(form, again));
      } catch {
        result = somethingWrong;
      }
      busy = false;
      again.removeAttribute("aria-busy");
      const message = messageOf(result);
      if (message) {
        again.removeAttribute("aria-disabled");
        return fail(message);
      }
      // An answer of nothing changes nothing.
      if (typeof result !== "object" || result === null) {
        again.removeAttribute("aria-disabled");
        return;
      }
      // The address goes back in as it was, an element, never as markup.
      const address = description.querySelector(".hauth-form-email");
      if (address) description.replaceChildren("We've sent a new code to ", address, ".");
      countDown(Date.now() + wait * 1000);
    });
  };

  // Each form on the page, and each one a script adds later.
  const ready = new WeakSet();
  const setUpIn = (node) => {
    if (!(node instanceof Element)) return;
    for (const form of [node, ...node.querySelectorAll(".hauth-form[data-example-verify-code]")]) {
      if (!form.matches(".hauth-form[data-example-verify-code]") || ready.has(form)) continue;
      ready.add(form);
      setUp(form);
    }
  };
  setUpIn(document.documentElement);
  new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) setUpIn(node);
  }).observe(document.documentElement, { childList: true, subtree: true });
}
