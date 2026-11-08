// The playground's table of contents, shared by the HTML and React.

export interface CatalogEntry {
  slug: string;
  title: string;
  purpose: string;
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
        purpose:
          "An action, as a button or as a link styled like one, or held to confirm one that's hard to undo.",
      },
      {
        slug: "copy",
        title: "Copy Button",
        purpose:
          "Copies text, such as a link or an ID, and says so in place; or shares a link through the device's share sheet.",
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
        title: "Filter Chip",
        purpose:
          "Narrows a list or table: a dashed chip that opens a Popup and shows what's chosen.",
      },
    ],
  },
  {
    title: "Display",
    entries: [
      {
        slug: "accordion",
        title: "Accordion",
        purpose:
          "Items that each show or hide their content, such as questions and their answers, one open at a time or several.",
      },
      {
        slug: "avatar",
        title: "Avatar",
        purpose: "A round user image, or a placeholder when there is none.",
      },
      {
        slug: "card",
        title: "Card",
        purpose:
          "A frame around a group of content: tinted, raised, or ghost; with a title, an icon, a description, and a chevron.",
      },
      {
        slug: "section",
        title: "Section",
        purpose:
          "A part of a page: its title, a description, and actions, over its content.",
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
        slug: "stat",
        title: "Stat",
        purpose:
          "A number to watch: its label, how it has changed, the number, and a caption, alone or as tiles on a tray.",
      },
      {
        slug: "tag",
        title: "Tag",
        purpose:
          "What something is: a label such as a ticket tag or “Test run”.",
      },
      {
        slug: "tag-list",
        title: "Tag List",
        purpose:
          "Tags in one row: those that fit, then “+N” for the rest.",
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
        slug: "empty-state",
        title: "Empty State",
        purpose:
          "What shows where there's nothing yet: a list before its first item, a search with no results, or a page you can't see.",
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
      {
        slug: "toast",
        title: "Toast",
        purpose:
          "A short message at the edge of the window that goes away by itself, with an optional action.",
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
        slug: "combobox",
        title: "Combobox",
        purpose: "A text field that filters a list as you type, to pick from it or be helped by it.",
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
        title: "Password Input",
        purpose:
          "A password field with a show/hide toggle and an optional strength meter.",
      },
      {
        slug: "radio",
        title: "Radio",
        purpose: "A native radio with Harmo's appearance.",
      },
      {
        slug: "search",
        title: "Search",
        purpose: "A field for searching, with an optional clear button.",
      },
      {
        slug: "segmented",
        title: "Segmented Control",
        purpose: "One choice from a few options shown side by side.",
      },
      {
        slug: "select",
        title: "Select",
        purpose: "A form field that picks one or more options from a list.",
      },
      {
        slug: "settings",
        title: "Settings List",
        purpose:
          "Settings with a title, a description, and a control beside or under them.",
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
        title: "Expand Chevron",
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
        slug: "command-menu",
        title: "Command Menu",
        purpose:
          "Places to go and things to do, found by typing: under a search field, or in a dialog.",
      },
      {
        slug: "menu-button",
        title: "Menu Button",
        purpose:
          "Three bars that turn into a cross, for opening a site's menu on a phone.",
      },
      {
        slug: "navigation-menu",
        title: "Navigation Menu",
        purpose:
          "A site's main navigation: links, and triggers that open a panel that resizes as you move between them.",
      },
      {
        slug: "pagination",
        title: "Pagination",
        purpose:
          "Moves through a list shown a page at a time: Previous and Next, and the page numbers if you show them.",
      },
      {
        slug: "sidebar",
        title: "Sidebar",
        purpose:
          "An app's navigation down the side: groups of links with icons, collapsing to the icons alone.",
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
        slug: "dialog",
        title: "Dialog",
        purpose:
          "A modal window for a task or a decision, opened by a button, code, or a link.",
      },
      {
        slug: "drawer",
        title: "Drawer",
        purpose:
          "A modal panel at the window's edge for a form or details, with an optional preview beside it.",
      },
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
];

const byTitle = (a: { title: string }, b: { title: string }) =>
  a.title.localeCompare(b.title, "en");

export const catalog: CatalogGroup[] = groups
  .map((group) => ({ ...group, entries: [...group.entries].sort(byTitle) }))
  .sort(byTitle);
