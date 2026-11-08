import { Card, Field, Search } from "@harmo-ui/react";
import { useState } from "react";

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
};
