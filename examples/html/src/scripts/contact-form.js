// Example only: what an app's script does for the Contact Form, as the React
// pattern does. Sending checks the fields first: an error goes under each one
// that's empty or doesn't look right, with aria-invalid on its control, and
// the first field in error takes focus. Then the button shows it's working
// while the app sends the form's data, with the files the form holds under
// its File Input's name, here to a stand-in that takes a moment. Its answer
// is one of: nothing, which changes nothing; a message, which goes above the
// button; messages by field, each under its field as the form's own errors
// are, the first taking focus, and above the button for a field with no
// error of its own or one the form doesn't have; or the thank-you, with what
// it shows. A send that throws says "Something went wrong. Try again." above
// the button. A message, wherever it goes, shakes the card once, unless the
// reader asked for reduced motion. Once sent, the thank-you takes the form's
// place, the card shrinking to it as it fades in, with what the answer gave
// filled in, and its title takes focus. Typing, choosing, or adding or
// removing a file takes a field's error away. Removing the last file from a
// File List moves focus back to the File Input that adds them. A form whose
// files field has data-example-upload shows it once this runs, uploads each
// file as it's added, with its progress, a way to try again, and removing it
// stopping it, and sends the keys they're stored under in their place,
// waiting for an upload still running.
{
  const anEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const aPhoneNumber = /^\+?[\d\s().-]+$/;
  // A web address, typed with its scheme or without, as example.com: only
  // http or https, to a host with a dot in it, with no name or password
  // before it, and no space, which the parser would otherwise drop.
  const isWebsite = (value) => {
    if (/\s/.test(value)) return false;
    try {
      const url = new URL(/^[a-z][a-z\d+-]*:/i.test(value) ? value : `https://${value}`);
      return /^https?:$/.test(url.protocol) && url.hostname.includes(".") && !url.username && !url.password;
    } catch {
      return false;
    }
  };

  const required = (message) => (value) => (value ? undefined : message);
  const email =
    (missing = "Enter your email address.") =>
    (value) =>
      !value ? missing : anEmail.test(value) ? undefined : "Enter an email address, such as name@example.com.";

  // Each form's checks, by field.
  const checks = {
    message: {
      name: required("Enter your name."),
      email: email(),
      message: required("Enter your message."),
    },
    sales: {
      email: email("Enter your company email address."),
      name: required("Enter your full name."),
      phone: (value) =>
        !value || (aPhoneNumber.test(value) && value.replace(/\D/g, "").length >= 7)
          ? undefined
          : "Enter a phone number, such as +1 415 555 2671.",
      website: (value) => (!value || isWebsite(value) ? undefined : "Enter a web address, such as example.com."),
    },
    support: {
      email: email(),
      topic: required("Choose a topic."),
      subject: required("Enter a subject."),
      message: required("Enter your message."),
    },
    order: {
      order: required("Enter your order number."),
      email: email(),
      problem: required("Choose what's wrong with your order."),
    },
  };

  // The fields with an error under them, in the form's order, where a
  // message for one goes.
  const fields = {
    message: ["name", "email", "message"],
    sales: ["email", "name", "phone", "website"],
    support: ["email", "topic", "subject", "message", "attachments"],
    order: ["order", "email", "problem", "photos"],
  };

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

  // Stands in for each form's server, given the form's data: what's sent from
  // fail@example.com gets a message back, as from a server that's busy, and
  // what's sent from error@example.com throws, as a request that can't reach
  // the server does. Anything else is sent, but a field the server turns
  // down, which it says of that field: an address at gmial.com, which can't
  // receive email; a personal address, at gmail.com, outlook.com, or
  // yahoo.com, or a link in the message, for a sales inquiry; a file it can't
  // open in a support request, or a photo that isn't a JPEG, PNG, or WebP; and
  // an order it can't find.
  const textOf = (data, name) => String(data.get(name) ?? "").trim();
  const filesOf = (data, name) => data.getAll(name).filter((entry) => entry instanceof File && entry.name !== "");

  // Stands in for uploading to your storage: it reports progress over a
  // second or so, then gives back the key the file is stored under. A file
  // whose name starts with "fail" stops halfway the first time, so it can be
  // tried again.
  const stored = new Map();
  const failedOnce = new Set();
  let keys = 0;
  const upload = (file, { progress, signal }) =>
    new Promise((resolve, reject) => {
      let done = 0;
      const timer = setInterval(() => {
        done += 20;
        if (file.name.startsWith("fail") && done === 60 && !failedOnce.has(file.name)) {
          failedOnce.add(file.name);
          clearInterval(timer);
          reject(new Error("The upload failed."));
          return;
        }
        if (done < 100) {
          progress(done);
          return;
        }
        clearInterval(timer);
        const key = `uploads/${(keys += 1)}`;
        stored.set(key, file);
        resolve(key);
      }, 250);
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        reject(signal.reason);
      });
    });
  // The files the keys sent name, as your server would look them up.
  const uploadedOf = (data, name) =>
    data.getAll(name).flatMap((key) => (typeof key === "string" && stored.has(key) ? [stored.get(key)] : []));
  const didntUpload = "That didn't upload. Check your connection.";
  const notUploaded = "Some files didn't upload. Try them again, or remove them.";
  const doneIcon =
    '<svg class="hicon hfile-list-done" data-new width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5L10 17.5L19 7.5" pathLength="1" /></svg>';
  const undeliverable = (data) =>
    textOf(data, "email").endsWith("@gmial.com")
      ? { email: "We can't deliver email to gmial.com. Did you mean gmail.com?" }
      : undefined;
  const replies = {
    message: (data) => undeliverable(data) ?? { step: "sent", email: textOf(data, "email") },
    sales: (data) =>
      /@(gmail|outlook|yahoo)\.com$/.test(textOf(data, "email"))
        ? { email: "Use your company email address, not a personal one." }
        : /https?:\/\/|www\./i.test(textOf(data, "message"))
          ? { message: "Your message can't have links in it. Take them out, and send it again." }
          : { step: "sent" },
    support: (data) => {
      const unopenable = uploadedOf(data, "attachments").find((file) => !/^(image\/|text\/|application\/pdf$)/.test(file.type));
      return (
        undeliverable(data) ??
        (unopenable
          ? { attachments: `${unopenable.name} isn't a file we can open. Send screenshots, PDFs, or text files.` }
          : { step: "sent", email: textOf(data, "email") })
      );
    },
    order: (data) => {
      const unopenable = filesOf(data, "photos").find((file) => !/^image\/(jpeg|png|webp)$/.test(file.type));
      return textOf(data, "order") === "9999"
        ? { order: "We can't find order 9999. Check the number in your order confirmation." }
        : unopenable
          ? { photos: `${unopenable.name} isn't a photo we can open. Send a JPEG, PNG, or WebP.` }
          : { step: "sent", order: textOf(data, "order"), email: textOf(data, "email") };
    },
  };

  const send = (kind, data) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        const sender = textOf(data, "email");
        if (sender === "error@example.com") reject(new Error("The server can't be reached."));
        else resolve(sender === "fail@example.com" ? "Your message didn't send. Try again in a moment." : replies[kind](data));
      }, 800),
    );

  for (const card of document.querySelectorAll(".hcontact-form[data-example-contact]")) {
    const form = card.querySelector(":scope > form");
    const thanks = card.querySelector(":scope > .hempty-state");
    const button = form.querySelector(".hcontact-form-submit > .hbutton");
    const failure = form.querySelector(".hcontact-form-submit > .herror");
    const kind = card.dataset.exampleContact;
    const check = checks[kind];
    const named = fields[kind];
    const list = form.querySelector(".hfile-list");
    const picker = form.querySelector(".hfile-input-control");
    // The files the File List shows, by their rows, which file-list.js adds
    // as the File Input hands them over and takes away as they're removed.
    const held = new WeakMap();
    // With uploads, each row's key once stored, and its upload while it runs.
    const uploads = form.querySelector("[data-example-upload]");
    const keyOf = new WeakMap();
    const running = new Map();
    if (uploads) uploads.hidden = false;

    // What a field's error describes and marks invalid, and takes focus: the
    // control, or a Select's trigger rather than the <select> it hides once
    // select.js has run; and where the error goes.
    const parts = (name) => {
      const control =
        form.querySelector(`[data-name="${name}"]`) ?? form.querySelector(`[name="${name}"]:not([type="hidden"])`);
      const error = (control.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .map((id) => document.getElementById(id))
        .find((element) => element?.classList.contains("herror"));
      return { control, error, focus: control };
    };

    // Only what this script said is taken away, so a File Input's own
    // refusal stays; and its error, which file-input.js closes with hidden,
    // opens again for a message.
    const said = new Set();
    const show = (name, message) => {
      const { control, error } = parts(name);
      if (message) {
        said.add(name);
        error.textContent = message;
        error.hidden = false;
        control.setAttribute("aria-invalid", "true");
      } else if (said.delete(name)) {
        error.textContent = "";
        control.removeAttribute("aria-invalid");
      }
    };

    // Shows each field's error, or none, and a message for the form, or none,
    // above the button; if there's one, shakes the card, and moves focus to
    // the first field with one, in the form's order.
    const answer = (errors, message = "") => {
      for (const name of named) show(name, errors[name]);
      failure.textContent = message;
      const first = named.find((name) => errors[name]);
      if (first || message) card.setAttribute("data-shake", "");
      if (first) parts(first).focus.focus();
    };

    const forget = (name) => {
      if (said.has(name)) show(name, undefined);
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

    // Shows a row's progress, from 0 to 100, as a bar along its bottom.
    const setProgress = (row, value) => {
      let bar = row.querySelector(":scope > .hfile-list-progress");
      if (!bar) {
        bar = document.createElement("div");
        bar.className = "hfile-list-progress";
        bar.role = "progressbar";
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-labelledby", row.querySelector(".hfile-list-name").id);
        row.append(bar);
      }
      bar.style.setProperty("--hfile-list-progress", value / 100);
      bar.setAttribute("aria-valuenow", String(value));
    };

    // Uploads a row's file: its progress while it runs; once stored, a check;
    // if it fails, an error in place of its size, and a button to try again.
    const start = (row) => {
      running.get(row)?.controller.abort();
      const controller = new AbortController();
      let settled = false;
      const live = () => !settled && !controller.signal.aborted && row.isConnected;
      keyOf.delete(row);
      row.dataset.status = "uploading";
      setProgress(row, 0);
      const progress = (value) => {
        if (live()) setProgress(row, Math.min(99, Math.max(0, value)));
      };
      const done = upload(held.get(row), { progress, signal: controller.signal })
        .then(
          (key) => {
            if (!live()) return;
            keyOf.set(row, key);
            row.dataset.status = "done";
            setProgress(row, 100);
            row.querySelector(".hfile-list-actions").insertAdjacentHTML("afterbegin", doneIcon);
          },
          () => {
            if (!live()) return;
            row.dataset.status = "error";
            row.querySelector(":scope > .hfile-list-progress")?.remove();
            const error = document.createElement("p");
            error.className = "hfile-list-error";
            error.role = "alert";
            error.textContent = didntUpload;
            row.querySelector(".hfile-list-detail").hidden = true;
            row.querySelector(".hfile-list-text").append(error);
            const retry = document.createElement("button");
            retry.className = "hbutton";
            retry.dataset.variant = "tertiary";
            retry.type = "button";
            retry.setAttribute("aria-describedby", row.querySelector(".hfile-list-name").id);
            retry.innerHTML = '<span class="hbutton-label">Try again</span>';
            row.querySelector(".hfile-list-remove").before(retry);
          },
        )
        .finally(() => {
          settled = true;
          if (running.get(row)?.controller === controller) running.delete(row);
        });
      running.set(row, { controller, done });
    };

    // Waits for the uploads still running, those started meanwhile too; then
    // says if any didn't upload.
    const settle = async () => {
      while (running.size > 0) await Promise.all([...running.values()].map(({ done }) => done));
      return list.querySelector(':scope > [data-status="error"]:not([data-leaving])') ? notUploaded : undefined;
    };

    card.addEventListener("animationend", (event) => {
      if (event.target === card) card.removeAttribute("data-shake");
    });
    form.addEventListener("input", (event) => forget(event.target.name));
    form.addEventListener("example-select-change", (event) => forget(event.target.dataset.name));

    // After file-list.js has listed them, the last rows its own.
    form.addEventListener("example-files-add", (event) => {
      const rows = [...list.children].slice(-event.detail.length);
      rows.forEach((row, index) => held.set(row, event.detail[index]));
      if (uploads) for (const row of rows) start(row);
      forget(picker.name);
    });

    // After file-list.js has taken the file away, so the list has no other.
    form.addEventListener("click", (event) => {
      const row = event.target.closest(".hfile-list-item");
      if (uploads && row && event.target.closest(".hfile-list-actions .hbutton:not(.hfile-list-remove)")) {
        const focused = row.contains(document.activeElement);
        row.querySelector(".hfile-list-error").remove();
        row.querySelector(".hfile-list-detail").hidden = false;
        event.target.closest(".hbutton").remove();
        start(row);
        if (focused) row.querySelector(".hfile-list-remove").focus();
        forget(picker.name);
        return;
      }
      if (!event.target.closest(".hfile-list-remove")) return;
      if (row) {
        running.get(row)?.controller.abort();
        running.delete(row);
      }
      forget(picker.name);
      if (!list.querySelector(":scope > :not([data-leaving])")) picker.focus();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button.getAttribute("aria-busy") === "true") return;
      const data = new FormData(form);
      const errors = Object.fromEntries(Object.entries(check).map(([name, test]) => [name, test(textOf(data, name))]));
      if (named.some((name) => errors[name])) {
        answer(errors);
        return;
      }

      answer({});
      working(true);
      if (uploads) {
        const problem = await settle();
        if (problem) {
          working(false);
          answer({ [picker.name]: problem });
          return;
        }
      }
      if (picker) {
        data.delete(picker.name);
        for (const row of list.querySelectorAll(":scope > :not([data-leaving])")) {
          const entry = uploads ? keyOf.get(row) : held.get(row);
          if (entry) data.append(picker.name, entry);
        }
      }
      let result;
      try {
        result = await send(kind, data);
      } catch {
        result = "Something went wrong. Try again.";
      }
      working(false);
      if (typeof result === "string") {
        answer({}, result);
        return;
      }
      if (typeof result !== "object" || result === null) return;
      if (result.step !== "sent") {
        const others = Object.keys(result).filter(
          (name) => !named.includes(name) && typeof result[name] === "string" && result[name],
        );
        answer(result, others.map((name) => result[name]).join(" "));
        return;
      }
      for (const slot of thanks.querySelectorAll("[data-example-contact-value]")) {
        slot.textContent = result[slot.dataset.exampleContactValue] ?? "";
      }
      changeStep(card, () => {
        form.hidden = true;
        thanks.hidden = false;
      });
      focusStep(thanks.querySelector(".hempty-state-title"));
    });
  }
}
