import { Badge, Button } from "@harmo-ui/react";
import { useState } from "react";
import { MessagesIcon, SettingsIcon, TicketsIcon } from "../app-icons.tsx";

export const examples = {
  Default: () => (
    <>
      <Badge count={3} />
      <Badge count={12} />
      <Badge count={120} />
    </>
  ),

  Variants: () => (
    <>
      <Badge count={8} />
      <Badge variant="accent" count={8} />
      <Badge variant="neutral" count={8} />
      <Badge dot />
    </>
  ),

  "On a button": () => (
    <>
      <Button variant="tertiary" aria-label="Messages, 3 unread" badge={3}>
        <MessagesIcon className="hicon" />
      </Button>
      <Button variant="tertiary" aria-label="Tickets, 12 open" badge={<Badge variant="neutral" count={12} aria-hidden="true" />}>
        <TicketsIcon className="hicon" />
      </Button>
      <Button variant="tertiary" aria-label="Settings, an update is ready" badge={<Badge dot aria-hidden="true" />}>
        <SettingsIcon className="hicon" />
      </Button>
    </>
  ),

  "As it arrives": () => {
    const [count, setCount] = useState(0);

    return (
      <>
        <Button variant="tertiary" aria-label={count > 0 ? `Messages, ${count} unread` : "Messages"} badge={count || undefined}>
          <MessagesIcon className="hicon" />
        </Button>
        <Button variant="secondary" onClick={() => setCount(count + 1)}>
          Get a message
        </Button>
      </>
    );
  },
};
