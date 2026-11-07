import { CommandMenu, Field, Kbd, Option, OptionGroup, Switch } from "@harmo-ui/react";
import { useEffect, useState } from "react";

export const examples = {
  Default: () => {
    const [text, setText] = useState("");
    const [picked, setPicked] = useState<string | null>(null);
    // A key alone needs a way to turn it off (WCAG 2.1.4).
    const [singleKeys, setSingleKeys] = useState(true);

    // Your app's search for customers as the text changes, here pretended:
    // from two letters, the ones whose name or email holds it, 400ms later,
    // as a request to your server would bring them.
    const customers = [
      { id: "ana", name: "Ana Lopez", email: "ana@example.com" },
      { id: "sam", name: "Sam Rivera", email: "sam@example.com" },
      { id: "lee", name: "Lee Chen", email: "lee@partner.org" },
    ];
    const wanted = text.trim();
    const [found, setFound] = useState({ for: "", ids: [] as string[] });
    useEffect(() => {
      if (wanted.length < 2) return;
      const timer = setTimeout(() => {
        const query = wanted.toLowerCase();
        const ids = customers
          .filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(query))
          .map((customer) => customer.id);
        setFound({ for: wanted, ids });
      }, 400);
      return () => clearTimeout(timer);
    }, [wanted]);
    const searching = wanted.length >= 2 && found.for !== wanted;
    const shown = wanted.length >= 2 && !searching ? found.ids : [];

    return (
      <>
        <CommandMenu
          label="Search"
          placeholder="Search"
          shortcut={singleKeys ? { keys: "/", label: "/" } : undefined}
          onInputChange={setText}
          onPick={setPicked}
          emptyMessage={searching ? "Searching…" : "No results"}
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
            <Option value="/" description="Overview">
              Home
            </Option>
            <Option value="/tickets" description="All tickets" badge="Current">
              Tickets
            </Option>
            <Option value="/analytics" description="Reports" keywords={["metrics", "charts"]}>
              Analytics
            </Option>
            <Option
              value="/settings/plans"
              description="Settings"
              keywords={["billing", "subscription", "invoices"]}
            >
              Plans
            </Option>
            <Option value="/settings/members" description="Settings" keywords={["users", "roles", "invite"]}>
              Team members
            </Option>
          </OptionGroup>
          <OptionGroup label="Create">
            <Option value="/tickets/new" description="Tickets">
              New ticket
            </Option>
            <Option value="/settings/teams/new" description="Settings">
              New team
            </Option>
          </OptionGroup>
          <OptionGroup label="Customers" filter={false} hidden={shown.length === 0}>
            {customers.map((customer) => (
              <Option
                key={customer.id}
                value={`/customers/${customer.id}`}
                description={customer.email}
                hidden={!shown.includes(customer.id)}
              >
                {customer.name}
              </Option>
            ))}
            <Option value="/customers">View all customers</Option>
          </OptionGroup>
        </CommandMenu>
        {/* Where a pick would go, said rather than gone to. */}
        <p hidden={picked === null}>{picked !== null && `Opened ${picked}`}</p>
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
              value="/docs/installation"
              description="Add Harmo to a project"
              keywords={["npm", "package", "setup"]}
            >
              Installation
            </Option>
            <Option
              value="/docs/theming"
              description="Colors, fonts, and sizes"
              keywords={["tokens", "dark mode", "brand"]}
            >
              Theming
            </Option>
          </OptionGroup>
          <OptionGroup label="Components">
            <Option value="/docs/components/button" description="An action, or a link that looks like one">
              Button
            </Option>
            <Option
              value="/docs/components/combobox"
              description="A text field that filters a list"
              keywords={["autocomplete"]}
            >
              Combobox
            </Option>
            <Option
              value="/docs/components/command-menu"
              description="Places and actions, found by typing"
              keywords={["palette", "spotlight"]}
            >
              Command Menu
            </Option>
            <Option value="/docs/components/dialog" description="A window above the page" keywords={["modal"]}>
              Dialog
            </Option>
            <Option value="/docs/components/tag-list" description="Tags in one row, then +N">
              Tag List
            </Option>
          </OptionGroup>
        </CommandMenu>
        {/* Where a pick would go, said rather than gone to. */}
        <p hidden={picked === null}>{picked !== null && `Opened ${picked}`}</p>
      </>
    );
  },
};
