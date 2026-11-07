import { CommandMenu, Field, Kbd, Option, OptionGroup, Switch } from "@harmo-ui/react";
import { useEffect, useState } from "react";

const customers = [
  { id: "ana", name: "Ana Lopez", email: "ana@example.com" },
  { id: "sam", name: "Sam Rivera", email: "sam@example.com" },
  { id: "lee", name: "Lee Chen", email: "lee@partner.org" },
];

const places: Record<string, string> = {
  home: "Home",
  tickets: "Tickets",
  analytics: "Analytics",
  plans: "Plans",
  members: "Team members",
  "new-ticket": "New ticket",
  "new-team": "New team",
  customers: "View all customers",
  ...Object.fromEntries(customers.map((customer) => [customer.id, customer.name])),
  install: "Installation",
  theming: "Theming",
  button: "Button",
  combobox: "Combobox",
  "command-menu": "Command Menu",
  dialog: "Dialog",
  "tag-list": "Tag List",
};

// Where a pick would go, said rather than gone to.
const Picked = ({ value }: { value: string | null }) => (
  <p hidden={value === null}>{value !== null && `Opened ${places[value]}`}</p>
);

// The customers whose name or email holds the text, a moment after it's
// typed, as a request to the app's server would bring them.
const useFound = (text: string) => {
  const [found, setFound] = useState<{ for: string; customers: typeof customers }>({
    for: "",
    customers: [],
  });
  const wanted = text.trim();
  useEffect(() => {
    if (wanted.length < 2) return;
    const timer = setTimeout(() => {
      const query = wanted.toLowerCase();
      setFound({
        for: wanted,
        customers: customers.filter((customer) =>
          `${customer.name} ${customer.email}`.toLowerCase().includes(query),
        ),
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [wanted]);
  const ready = wanted.length >= 2 && found.for === wanted;
  return { searching: wanted.length >= 2 && !ready, customers: ready ? found.customers : [] };
};

export const examples = {
  Default: () => {
    const [text, setText] = useState("");
    const [picked, setPicked] = useState<string | null>(null);
    // A key alone needs a way to turn it off (WCAG 2.1.4).
    const [singleKeys, setSingleKeys] = useState(true);
    const found = useFound(text);
    return (
      <>
        <CommandMenu
          label="Search"
          placeholder="Search"
          shortcut={singleKeys ? { keys: "/", label: "/" } : undefined}
          onInputChange={setText}
          onPick={setPicked}
          emptyMessage={found.searching ? "Searching…" : "No results"}
          hints={
            <>
              <span>
                <Kbd>Enter</Kbd> to open
              </span>
              <span>
                <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
              </span>
            </>
          }
        >
          <OptionGroup label="Go to">
            <Option value="home" description="Overview">
              Home
            </Option>
            <Option value="tickets" description="All tickets" badge="Current">
              Tickets
            </Option>
            <Option value="analytics" description="Reports" keywords={["metrics", "charts"]}>
              Analytics
            </Option>
            <Option
              value="plans"
              description="Settings"
              keywords={["billing", "subscription", "invoices"]}
            >
              Plans
            </Option>
            <Option value="members" description="Settings" keywords={["users", "roles", "invite"]}>
              Team members
            </Option>
          </OptionGroup>
          <OptionGroup label="Create">
            <Option value="new-ticket" description="Tickets">
              New ticket
            </Option>
            <Option value="new-team" description="Settings">
              New team
            </Option>
          </OptionGroup>
          <OptionGroup label="Customers" filter={false} hidden={found.customers.length === 0}>
            {customers.map((customer) => (
              <Option
                key={customer.id}
                value={customer.id}
                description={customer.email}
                hidden={!found.customers.includes(customer)}
              >
                {customer.name}
              </Option>
            ))}
            <Option value="customers">View all customers</Option>
          </OptionGroup>
        </CommandMenu>
        <Picked value={picked} />
        <Field orientation="horizontal" label="Single-key shortcuts">
          <Switch checked={singleKeys} onChange={(event) => setSingleKeys(event.target.checked)} />
        </Field>
      </>
    );
  },

  "In a dialog": () => {
    const [picked, setPicked] = useState<string | null>(null);
    return (
      <>
        <CommandMenu
          modal
          label="Search documentation"
          placeholder="Search documentation"
          shortcut={{ keys: "Mod+K", label: { apple: "⌘K", other: "Ctrl K" } }}
          onPick={setPicked}
          emptyMessage="No results"
          hints={
            <>
              <span>
                <Kbd>Enter</Kbd> to open
              </span>
              <span>
                <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
              </span>
              <span>
                <Kbd>Esc</Kbd> to close
              </span>
            </>
          }
        >
          <OptionGroup label="Getting started">
            <Option
              value="install"
              description="Add Harmo to a project"
              keywords={["npm", "package", "setup"]}
            >
              Installation
            </Option>
            <Option
              value="theming"
              description="Colors, fonts, and sizes"
              keywords={["tokens", "dark mode", "brand"]}
            >
              Theming
            </Option>
          </OptionGroup>
          <OptionGroup label="Components">
            <Option value="button" description="An action, or a link that looks like one">
              Button
            </Option>
            <Option
              value="combobox"
              description="A text field that filters a list"
              keywords={["autocomplete"]}
            >
              Combobox
            </Option>
            <Option
              value="command-menu"
              description="Places and actions, found by typing"
              keywords={["palette", "spotlight"]}
            >
              Command Menu
            </Option>
            <Option value="dialog" description="A window above the page" keywords={["modal"]}>
              Dialog
            </Option>
            <Option value="tag-list" description="Tags in one row, then +N">
              Tag List
            </Option>
          </OptionGroup>
        </CommandMenu>
        <Picked value={picked} />
      </>
    );
  },
};
