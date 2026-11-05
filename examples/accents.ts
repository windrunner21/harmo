// The accents the playgrounds' Accent picker offers, around the color wheel.
// Each is a data-harmo-accent value from packages/css/src/accents.scss;
// purple is the default, so choosing it removes the attribute.
export const accents = [
  { value: "purple", label: "Purple" },
  { value: "blue", label: "Blue" },
  { value: "teal", label: "Teal" },
  { value: "green", label: "Green" },
  { value: "amber", label: "Amber" },
  { value: "red", label: "Red" },
  { value: "pink", label: "Pink" },
  { value: "mono", label: "Mono" },
];

// Remembered across pages, as the Dark switch is; layout.html reads it before
// anything shows.
export const ACCENT_KEY = "harmo-playground-accent";

export const applyAccent = (accent: string) => {
  const root = document.documentElement;
  if (accent === "purple") delete root.dataset.harmoAccent;
  else root.dataset.harmoAccent = accent;
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {}
};

// The HTML playground's picker: a Select, which listbox.js and select.js run
// like any other. The script after it shows the remembered accent before the
// page appears.
export const accentPickerHtml = () => {
  const options = accents.map(
    ({ value, label }, index) => `      <li class="hoption" id="play-accent-${value}" role="option" data-value="${value}" aria-selected="${index === 0}">
        <span class="hoption-label"><span class="play-accent-dot" data-harmo-accent="${value}" aria-hidden="true"></span>${label}</span>${index === 0 ? `\n        <play-icon name="check" class="hoption-check"></play-icon>` : ""}
      </li>`,
  );
  return `<div class="play-accent">
  <div class="hfield">
    <span class="hlabel" id="play-accent-label">Accent</span>
    <button
      class="hselect"
      id="play-accent"
      type="button"
      role="combobox"
      aria-labelledby="play-accent-label"
      aria-haspopup="listbox"
      aria-expanded="false"
      aria-controls="play-accent-listbox"
      popovertarget="play-accent-popup"
      style="anchor-name: --play-accent"
    >
      <span class="hselect-value">Purple</span>
      <play-icon name="expand-chevron" class="hexpand-chevron"></play-icon>
    </button>
    <div class="hpopup" id="play-accent-popup" popover style="position-anchor: --play-accent">
      <ul class="hlistbox" id="play-accent-listbox" role="listbox" aria-labelledby="play-accent-label">
${options.join("\n")}
      </ul>
    </div>
  </div>
  <script>
    {
      const option = document.getElementById("play-accent-" + (document.documentElement.dataset.harmoAccent ?? "purple"));
      if (option) {
        for (const each of option.parentElement.children) each.setAttribute("aria-selected", String(each === option));
        option.append(option.parentElement.querySelector(".hoption-check"));
        document.querySelector("#play-accent .hselect-value").textContent = option.textContent.trim();
      }
    }
  </script>
</div>`;
};
