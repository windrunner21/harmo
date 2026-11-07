// Example only: show what's chosen in a Filter Chip, as the React FilterChip
// does. Up to two values show as they are, more as a count. A multi-select
// chip's list ends with Clear filters while anything is chosen; listbox.js
// closes a single-select chip's list. A text filter applies and closes on
// Apply or Enter.
{
  const pill = (text) => {
    const value = document.createElement("span");
    value.className = "hfilter-chip-value";
    value.textContent = text;
    return value;
  };

  const clearFooter = () => {
    const footer = document.createElement("div");
    footer.className = "hlistbox-footer";
    footer.innerHTML = `<button class="hbutton" data-variant="tertiary" type="button"><span class="hbutton-label">Clear filters</span></button>`;
    return footer;
  };

  for (const chip of document.querySelectorAll(".hfilter-chip[popovertarget]")) {
    const popup = document.getElementById(chip.getAttribute("popovertarget"));
    const listbox = popup.querySelector(".hlistbox");
    const input = popup.querySelector("input");

    const show = (labels) => {
      let values = chip.querySelector(".hfilter-chip-values");
      if (!values) {
        values = document.createElement("span");
        values.className = "hfilter-chip-values";
        chip.append(values);
      }
      const shown = labels.length > 2 ? [`${labels.length} selected`] : labels;
      values.replaceChildren(...shown.map(pill));
    };

    if (listbox) {
      const multiple = listbox.getAttribute("aria-multiselectable") === "true";
      const footer = popup.querySelector(".hlistbox-footer") ?? clearFooter();

      // On the popup, so listbox.js has updated the selection by then.
      popup.addEventListener("click", (event) => {
        if (event.target.closest(".hlistbox-footer .hbutton")) {
          for (const option of listbox.querySelectorAll('.hoption[aria-selected="true"]')) {
            option.setAttribute("aria-selected", "false");
          }
        } else {
          const option = event.target.closest(".hoption");
          if (!option || option.getAttribute("aria-disabled") === "true") return;
        }
        const selected = listbox.querySelectorAll('.hoption[aria-selected="true"] .hoption-label');
        const labels = [...selected].map((label) => label.textContent.trim());
        show(labels);
        if (!multiple) return;
        if (labels.length) {
          popup.append(footer);
        } else {
          // Clear filters is about to go: keep keyboard focus in the popup,
          // on the search field if there is one, else on the list.
          if (footer.contains(document.activeElement)) {
            (popup.querySelector(".hlistbox-search-input") ?? listbox).focus();
          }
          footer.remove();
        }
      });
    } else if (input) {
      const apply = () => {
        const text = input.value.trim();
        show(text ? [text] : []);
        popup.hidePopover();
      };
      popup.querySelector("[data-example-apply]")?.addEventListener("click", apply);
      // The Enter that applies mustn't go on to press the chip, which takes
      // focus back as the popup closes.
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        apply();
      });
    }
  }
}
