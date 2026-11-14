import { Button, Card, Field, Search } from "@harmo-ui/react";
import { useEffect, useRef, useState } from "react";

export const examples = {
  Default: () => (
    <Search
      placeholder="Search conversations"
      aria-label="Search conversations"
      clearLabel="Clear"
    />
  ),

  "Without a clear button": () => (
    <Search placeholder="Search contacts" aria-label="Search contacts" />
  ),

  "With a label": () => (
    <Field label="Find a template">
      <Search placeholder="Name or content" clearLabel="Clear" />
    </Field>
  ),

  "With a shortcut": () => {
    const field = useRef<HTMLInputElement>(null);
    const [apple, setApple] = useState(false);
    useEffect(() => {
      const onApple = /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
      setApple(onApple);
      const reach = (event: KeyboardEvent) => {
        if ((event.key !== "k" && event.key !== "K") || event.altKey || event.shiftKey) return;
        if (onApple ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        field.current?.focus();
      };
      document.addEventListener("keydown", reach);
      return () => document.removeEventListener("keydown", reach);
    }, []);
    return (
      <Search
        ref={field}
        placeholder="Search templates"
        aria-label="Search templates"
        aria-keyshortcuts={apple ? "Meta+K" : "Control+K"}
        shortcutHint={apple ? "⌘K" : "Ctrl K"}
        clearLabel="Clear"
      />
    );
  },

  Disabled: () => (
    <Search
      placeholder="Search archived conversations"
      aria-label="Search archived conversations"
      clearLabel="Clear"
      disabled
    />
  ),

  "Filtering a list": () => {
    const quickReplies = [
      ["order-shipped", "Order shipped"],
      ["refund-processed", "Refund processed"],
      ["opening-hours", "Opening hours"],
      ["order-delayed", "Order delayed"],
    ];
    const [query, setQuery] = useState("");
    const matches = (name: string) =>
      name.toLowerCase().includes(query.trim().toLowerCase());
    return (
      <>
        <Search
          placeholder="Search quick replies"
          aria-label="Search quick replies"
          clearLabel="Clear"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <nav id="quick-replies" aria-label="Quick replies">
          {quickReplies.map(([slug, name]) => (
            <Card key={slug} variant="ghost" href={`#${slug}`} hidden={!matches(name!)}>
              {name}
            </Card>
          ))}
        </nav>
      </>
    );
  },

  "In a form": () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Search
        name="q"
        placeholder="Search orders"
        aria-label="Search orders"
        clearLabel="Clear"
        defaultValue="refund"
      />
      <Button variant="secondary" type="reset" style={{ alignSelf: "flex-start" }}>
        Reset
      </Button>
    </form>
  ),
};
