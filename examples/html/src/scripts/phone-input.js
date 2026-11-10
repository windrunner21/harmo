// Example only: what the React PhoneInput does with a parser your app brings, such
// as libphonenumber-js. This stands in for one, with six countries, and only
// knows the shape of each one's numbers. It formats the number as it's typed,
// keeping the caret among the digits, takes a full number that's pasted, empties
// the field when the country changes, and keeps the number in E.164 in a hidden
// input, empty until it's complete.
{
  const plans = {
    AZ: { calling: "994", shape: "### ### ## ##", length: 10, trunk: "0" },
    DE: { calling: "49", shape: "##### #######", length: 12, trunk: "0" },
    FR: { calling: "33", shape: "## ## ## ## ##", length: 10, trunk: "0" },
    GB: { calling: "44", shape: "##### ######", length: 11, trunk: "0" },
    TR: { calling: "90", shape: "#### ### ## ##", length: 11, trunk: "0" },
    US: { calling: "1", shape: "(###) ###-####", length: 10, trunk: "" },
  };

  const digitsOf = (text) => text.replace(/\D/g, "");

  const asciiDigits = (text) =>
    text.replace(/[\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
      const code = digit.charCodeAt(0);
      return String(code - (code >= 0xff10 ? 0xff10 : code >= 0x06f0 ? 0x06f0 : 0x0660));
    });

  const format = (digits, plan) => {
    if (digits.length > plan.length) return digits;
    if (plan.shape.startsWith("(") && digits.length <= 3) return digits;
    let at = 0;
    let out = "";
    for (const character of plan.shape) {
      if (at === digits.length) break;
      if (character === "#") out += digits[at++];
      else out += character;
    }
    return out;
  };

  const caretAfter = (text, digits) => {
    if (digits === 0) return 0;
    let seen = 0;
    for (let index = 0; index < text.length; index += 1) {
      if (/\d/.test(text[index]) && ++seen === digits) return index + 1;
    }
    return text.length;
  };

  const parsedFrom = (text) => {
    const digits = digitsOf(text);
    for (const [country, plan] of Object.entries(plans)) {
      if (!digits.startsWith(plan.calling)) continue;
      const rest = digits.slice(plan.calling.length);
      const national = plan.trunk + rest;
      if (national.length === plan.length) return { country, national };
    }
    return null;
  };

  for (const root of document.querySelectorAll(".hphone-input")) {
    const field = root.querySelector(".hinput");
    const hidden = root.querySelector('input[type="hidden"]');
    const list = root.querySelector(".hlistbox");
    // A disabled one has no list, and nothing can change.
    if (!list) continue;
    const trigger = root.querySelector(".hphone-input-country");
    const value = trigger.querySelector(".hselect-value");
    const status = root.closest(".hfield")?.parentElement.querySelector("[data-example-phone-status]");
    const starting = { country: root.dataset.exampleCountry, text: field.value };
    let country = starting.country;
    let text = field.value;

    const numberOf = () => {
      // A complete international number has already become a national one.
      if (text.trim().startsWith("+")) return "";
      const plan = plans[country];
      const digits = digitsOf(text);
      if (digits.length !== plan.length) return "";
      return `+${plan.calling}${digits.slice(plan.trunk.length)}`;
    };

    const show = (next, caret) => {
      text = next;
      field.value = next;
      if (caret !== undefined) field.setSelectionRange(caret, caret);
      if (hidden) hidden.value = numberOf();
      if (status) {
        status.textContent = numberOf() || status.dataset.examplePhoneStatus;
        if (numberOf()) status.dataset.status = "success";
        else delete status.dataset.status;
      }
    };

    const markCountry = (next) => {
      country = next;
      for (const option of list.querySelectorAll(".hoption")) {
        option.setAttribute("aria-selected", String(option.dataset.exampleValue === next));
      }
      const chosen = list.querySelector(`.hoption[data-example-value="${next}"]`);
      value.querySelector(".hphone-input-flag").replaceChildren(...chosen.querySelector(".hphone-input-flag").cloneNode(true).childNodes);
      value.querySelector("[dir]").textContent = `+${plans[next].calling}`;
      value.querySelector(".hphone-input-name").textContent = chosen.querySelector(".hoption-label").lastChild.textContent;
      const check = list.querySelector(".hoption-check");
      if (check) chosen.append(check);
    };

    const apply = (entered, position, kind) => {
      let raw = asciiDigits(entered);
      let at = position;
      const removedFormatting =
        raw.length === text.length - 1 && raw === text.slice(0, at) + text.slice(at + 1) && /\D/.test(text[at] ?? "");
      if (removedFormatting) {
        if (kind === "deleteContentBackward" || !kind) {
          const before = raw.slice(0, at).replace(/\d(\D*)$/, "$1");
          raw = before + raw.slice(at);
          at = before.length;
        } else if (kind === "deleteContentForward") {
          raw = raw.slice(0, at) + raw.slice(at).replace(/^(\D*)\d/, "$1");
        }
      }
      const international = raw.trimStart().startsWith("+");
      if (international) {
        const pasted = parsedFrom(raw);
        if (pasted) {
          markCountry(pasted.country);
          show(format(pasted.national, plans[pasted.country]));
        } else {
          show(`+${digitsOf(raw)}`);
        }
        return;
      }
      const formatted = format(digitsOf(raw), plans[country]);
      const caret = at >= raw.length ? formatted.length : caretAfter(formatted, digitsOf(raw.slice(0, at)).length);
      show(formatted, caret);
    };

    field.addEventListener("input", (event) => {
      if (event.isComposing) {
        text = field.value;
        return;
      }
      apply(field.value, field.selectionStart ?? field.value.length, event.inputType);
    });

    field.addEventListener("compositionend", () => apply(field.value, field.selectionStart ?? field.value.length));

    list.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!option || option.dataset.exampleValue === country) return;
      markCountry(option.dataset.exampleValue);
      show("");
      requestAnimationFrame(() => field.focus());
    });

    field.form?.addEventListener("reset", (event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        markCountry(starting.country);
        show(starting.text);
      }),
    );

    if (hidden) hidden.value = numberOf();
  }
}
