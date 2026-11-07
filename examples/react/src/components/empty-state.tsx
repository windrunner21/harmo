import { Button, EmptyState, Search } from "@harmo-ui/react";
import { useRef, useState } from "react";
import { CampaignsIcon, LockIcon, MessagesIcon, PlusIcon } from "../app-icons.tsx";

export const examples = {
  Default: () => (
    <EmptyState
      icon={<MessagesIcon className="hicon" />}
      label="No quick replies yet"
      description="Save answers you send often, and add them to a chat in two clicks."
      actions={
        <Button>
          <PlusIcon className="hicon" />
          Add quick reply
        </Button>
      }
    />
  ),

  "At the start": () => (
    <EmptyState
      align="start"
      icon={<CampaignsIcon className="hicon" />}
      label="No campaigns yet"
      description="Send one message to many customers at once, such as a sale or a reminder."
      actions={
        <>
          <Button>
            <PlusIcon className="hicon" />
            Create campaign
          </Button>
          <Button variant="secondary">Import contacts</Button>
        </>
      }
    />
  ),

  "Not allowed": () => (
    <EmptyState
      icon={<LockIcon className="hicon" />}
      label="You don't have access to Billing"
      description="Ask an admin of your workspace to give you access."
      actions={
        <Button variant="secondary" href="/dashboard">
          Back to dashboard
        </Button>
      }
    />
  ),

  "After a search": () => {
    const replies = ["Opening hours", "Refund policy", "Shipping times"];
    const [query, setQuery] = useState("");
    const search = useRef<HTMLInputElement>(null);
    const found = replies.filter((reply) =>
      reply.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
      <>
        <Search
          ref={search}
          id="reply-search"
          placeholder="Search quick replies"
          aria-label="Search quick replies"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul id="reply-results" hidden={found.length === 0}>
          {replies.map((reply) => (
            <li key={reply} hidden={!found.includes(reply)}>
              {reply}
            </li>
          ))}
        </ul>
        {/* In the page from the start, so a screen reader reads what appears in it. */}
        <div role="status">
          <EmptyState
            size="small"
            hidden={found.length > 0}
            labelAs="h3"
            label="No quick replies found"
            description="Try another word, or clear the search to see them all."
            actions={
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setQuery("");
                  search.current?.focus();
                }}
              >
                Clear search
              </Button>
            }
          />
        </div>
      </>
    );
  },

  "Small and dashed": () => (
    <>
      <EmptyState size="small" variant="dashed" description="No tickets in this column" />
      <EmptyState
        size="small"
        variant="dashed"
        labelAs="h3"
        label="No files yet"
        description="Files sent in this chat show here."
      />
    </>
  ),
};
