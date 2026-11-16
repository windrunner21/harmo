// Example only: what the React OtpInput does. One field holds the code and
// the slots over it show it, a character each. The script keeps the field to
// what a code holds, types over the characters after the caret, puts the
// caret in the slot that's pressed, and marks the slots; data-ready, which it
// sets as it starts, is what shows them, so without it the field is a plain
// Input. In a form marked data-example-otp-form, a complete code sends the
// form, which shows what it sent. A field a script adds later, such as a
// sign-in's step that asks for a code, is set up as it arrives.
{
  // Digits, and with letters, letters in capitals. Fullwidth and Arabic
  // digits become ASCII ones.
  const clean = (text, alphanumeric) => {
    const ascii = text
      .normalize("NFKC")
      .replace(/[٠-٩۰-۹]/g, (digit) =>
        String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06f0 : 0x0660)),
      );
    return alphanumeric ? ascii.replace(/[^0-9a-z]/gi, "").toUpperCase() : ascii.replace(/\D/g, "");
  };

  // Where typed or pasted text goes, and what of it fits: over the characters
  // after the caret rather than pushing them along, up to the code's length;
  // a whole code replaces the one there.
  const entryOf = (field, text, length, alphanumeric) => {
    const entered = clean(text, alphanumeric);
    const { value } = field;
    const whole = entered.length >= length;
    const start = whole ? 0 : field.selectionStart;
    const selected = whole ? value.length : field.selectionEnd;
    const end = start === selected ? Math.min(value.length, start + entered.length) : selected;
    return { text: entered.slice(0, length - value.length + end - start), start, end };
  };

  // Typed as the browser types, so it can be undone.
  const insert = (field, text, start, end) => {
    field.setSelectionRange(start, end);
    if (document.execCommand("insertText", false, text)) return;
    field.setRangeText(text, start, end, "end");
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const setUp = (root) => {
    const field = root.querySelector(".hinput");
    const slots = [...root.querySelectorAll(".hotp-input-slot")];
    const length = field.maxLength;
    const alphanumeric = root.dataset.characters === "alphanumeric";
    const form = field.closest("[data-example-otp-form]");
    let pointer = "";
    let last = field.value;

    // Each slot's character, and, while the field is focused, the slot the
    // caret is in, or each slot of a selection.
    const show = () => {
      const { value, selectionStart: start, selectionEnd: end } = field;
      const focused = document.activeElement === field;
      slots.forEach((slot, index) => {
        slot.textContent = value[index] ?? "";
        slot.toggleAttribute("data-filled", index < value.length);
        const active = start === end ? index === Math.min(start, length - 1) : index >= start && index < end;
        slot.toggleAttribute("data-active", focused && active);
      });
    };

    // Whatever got past the typing and pasting below, such as a word an
    // input method finished or a dropped text, is cleaned up afterwards.
    const changed = () => {
      const raw = field.value;
      const next = clean(raw, alphanumeric).slice(0, length);
      if (next !== raw) {
        const caret = Math.min(next.length, clean(raw.slice(0, field.selectionStart), alphanumeric).length);
        field.value = next;
        field.setSelectionRange(caret, caret);
      }
      show();
      if (next.length === length && next !== last) form?.requestSubmit();
      last = next;
    };

    field.addEventListener("beforeinput", (event) => {
      if (event.inputType !== "insertText" || event.data === null || field.readOnly) return;
      const entry = entryOf(field, event.data, length, alphanumeric);
      if (entry.text === event.data && entry.start === field.selectionStart && entry.end === field.selectionEnd) return;
      event.preventDefault();
      if (entry.text) insert(field, entry.text, entry.start, entry.end);
    });

    // A full code's maxlength keeps Safari from saying a key is about to
    // type, so a key that types over a character is typed here.
    field.addEventListener("keydown", (event) => {
      if (field.readOnly || event.isComposing || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
      if (field.value.length < length || field.selectionStart !== field.selectionEnd) return;
      event.preventDefault();
      const entry = entryOf(field, event.key, length, alphanumeric);
      if (entry.text) insert(field, entry.text, entry.start, entry.end);
    });

    field.addEventListener("paste", (event) => {
      const pasted = event.clipboardData?.getData("text");
      if (pasted === undefined || field.readOnly) return;
      event.preventDefault();
      const entry = entryOf(field, pasted, length, alphanumeric);
      if (entry.text) insert(field, entry.text, entry.start, entry.end);
    });

    field.addEventListener("input", (event) => {
      if (event.isComposing) show();
      else changed();
    });
    field.addEventListener("compositionend", changed);
    for (const type of ["focus", "blur", "select", "keyup"]) field.addEventListener(type, show);
    document.addEventListener("selectionchange", () => {
      if (document.activeElement === field) show();
    });

    // A press on a slot puts the caret there: on a character, it selects it,
    // so the next key replaces it; past what's typed, at the end, as a code
    // has no gaps. A mouse does it as it presses, so the caret doesn't land
    // elsewhere first; a touch, once it's let go, so the keyboard still opens.
    const place = (x) => {
      const distance = (box) => Math.max(box.left - x, 0, x - box.right);
      const boxes = slots.map((slot) => slot.getBoundingClientRect());
      const index = boxes.reduce((best, box, at) => (distance(box) < distance(boxes[best]) ? at : best), 0);
      const filled = field.value.length;
      if (index < filled) field.setSelectionRange(index, index + 1);
      else field.setSelectionRange(filled, filled);
      show();
    };
    field.addEventListener("pointerdown", (event) => {
      pointer = event.pointerType;
    });
    field.addEventListener("mousedown", (event) => {
      if (event.defaultPrevented || event.button !== 0 || pointer !== "mouse") return;
      event.preventDefault();
      field.focus();
      place(event.clientX);
    });
    field.addEventListener("click", (event) => {
      if (pointer && pointer !== "mouse") place(event.clientX);
      pointer = "";
    });

    // A reset puts the first value back; the slots follow once it has.
    document.addEventListener(
      "reset",
      (event) => {
        if (event.target !== field.form) return;
        setTimeout(() => {
          if (event.defaultPrevented) return;
          last = field.value;
          show();
        });
      },
      true,
    );

    root.setAttribute("data-ready", "");
    show();
  };

  // Each field on the page, and each one a script adds later, such as a
  // form's step that asks for a code.
  const ready = new WeakSet();
  const setUpIn = (node) => {
    if (!(node instanceof Element)) return;
    for (const root of [node, ...node.querySelectorAll("[data-example-otp-input]")]) {
      if (!root.matches("[data-example-otp-input]") || ready.has(root)) continue;
      ready.add(root);
      setUp(root);
    }
  };
  setUpIn(document.documentElement);
  new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) setUpIn(node);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Sending the form shows the code it sent, here rather than to a server;
  // a reset puts the status back.
  for (const form of document.querySelectorAll("[data-example-otp-form]")) {
    const status = form.querySelector("[data-example-otp-status]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      status.textContent = `Sent ${new FormData(form).get("code")}`;
      status.dataset.status = "success";
    });
    form.addEventListener("reset", () => {
      status.textContent = "Not sent yet";
      status.removeAttribute("data-status");
    });
  }
}
