// The playground's table of contents, shared by the HTML and React.

export interface CatalogEntry {
  slug: string;
  title: string;
  purpose: string;
  docs?: string;
}

export interface CatalogGroup {
  title: string;
  entries: CatalogEntry[];
}

const groups: CatalogGroup[] = [
  {
    title: "Actions",
    entries: [
      {
        slug: "button",
        title: "Button",
        purpose: "An action, as a button or as a link styled like one.",
      },
      {
        slug: "link",
        title: "Link",
        purpose: "Navigation, inside text or on its own.",
      },
    ],
  },
  {
    title: "Data",
    entries: [
      {
        slug: "filter-chip",
        title: "Filter chip",
        purpose:
          "Narrows a list or table: a dashed chip that opens a Popup and shows what's chosen.",
      },
    ],
  },
  {
    title: "Display",
    entries: [
      {
        slug: "avatar",
        title: "Avatar",
        purpose: "A round user image, or a placeholder when there is none.",
      },
      {
        slug: "card",
        title: "Card",
        purpose: "A frame around a group of content: tinted, raised, or ghost.",
      },
      {
        slug: "kbd",
        title: "Kbd",
        purpose: "A key or shortcut, such as Enter or ⌘K.",
      },
      {
        slug: "status",
        title: "Status",
        purpose:
          "What state something is in, such as a ticket or a campaign run.",
      },
      {
        slug: "tag",
        title: "Tag",
        purpose:
          "What something is: a label such as a ticket tag or “Test run”.",
      },
    ],
  },
  {
    title: "Feedback",
    entries: [
      {
        slug: "banner",
        title: "Banner",
        purpose:
          "An inline notice: an icon, a message, and an optional action.",
      },
      {
        slug: "meter",
        title: "Meter",
        purpose:
          "How much of something on a fixed scale, such as password strength.",
      },
      {
        slug: "spinner",
        title: "Spinner",
        purpose: "A loading indicator, sized to match what is loading.",
      },
    ],
  },
  {
    title: "Forms",
    entries: [
      {
        slug: "checkbox",
        title: "Checkbox",
        purpose: "A native checkbox with Harmo's appearance.",
      },
      {
        slug: "field",
        title: "Field",
        purpose:
          "Arranges and connects a label, description, control, and error message.",
      },
      {
        slug: "input",
        title: "Input",
        purpose:
          "Single-line native inputs: text, email, search, tel, url, and similar.",
      },
      {
        slug: "password",
        title: "Password input",
        purpose:
          "A password field with a show/hide toggle and an optional strength meter.",
      },
      {
        slug: "radio",
        title: "Radio",
        purpose: "A native radio with Harmo's appearance.",
      },
      {
        slug: "segmented",
        title: "Segmented control",
        purpose: "One choice from a few options shown side by side.",
      },
      {
        slug: "select",
        title: "Select",
        purpose: "A form field that picks one or more options from a list.",
      },
      {
        slug: "switch",
        title: "Switch",
        purpose: "An on/off switch for settings that apply immediately.",
      },
      {
        slug: "textarea",
        title: "TextArea",
        purpose: "Multi-line text that grows as you type.",
      },
    ],
  },
  {
    title: "Icons",
    entries: [
      {
        slug: "chevron-to-arrow",
        title: "ChevronToArrow",
        purpose:
          "A chevron that turns into an arrow while its link or button is hovered or focused.",
      },
      {
        slug: "expand-chevron",
        title: "Expand chevron",
        purpose:
          "A chevron that folds from down to up while its control is expanded.",
      },
      {
        slug: "icons",
        title: "Icons",
        purpose:
          "SVG icons placed next to text in buttons, links, and breadcrumbs.",
      },
    ],
  },
  {
    title: "Navigation",
    entries: [
      {
        slug: "breadcrumb",
        title: "Breadcrumb",
        purpose: "A navigation trail ending at the current page.",
      },
      {
        slug: "tabs",
        title: "Tabs",
        purpose:
          "Switches between sibling pages or panels, with a sliding hover pill and underline.",
      },
    ],
  },
  {
    title: "Overlays",
    entries: [
      {
        slug: "listbox",
        title: "Listbox",
        purpose:
          "The option list inside a popup, with groups, search, and multiple selection.",
      },
      {
        slug: "popup",
        title: "Popup",
        purpose: "A floating surface for option lists and small panels.",
      },
      {
        slug: "tooltip",
        title: "Tooltip",
        purpose: "A short description shown on hover and keyboard focus.",
      },
    ],
  },
  {
    title: "Patterns",
    entries: [
      {
        slug: "settings",
        title: "Settings list",
        purpose:
          "Settings with a title, a description, and a control beside or under them.",
        docs: "patterns/settings.md",
      },
    ],
  },
];

const byTitle = (a: { title: string }, b: { title: string }) =>
  a.title.localeCompare(b.title, "en");

export const catalog: CatalogGroup[] = groups
  .map((group) => ({ ...group, entries: [...group.entries].sort(byTitle) }))
  .sort(byTitle);
