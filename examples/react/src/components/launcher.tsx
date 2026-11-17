import { Avatar, Button, Conversation, Launcher, Link, Message, Tooltip } from "@harmo-ui/react";
import { useRef, useState, type CSSProperties } from "react";
import { CloseIcon, MessagesIcon } from "../app-icons.tsx";

// Example only: the page the launcher sits on, and what's in its panel, a
// header, links, and a conversation, laid out here with inline styles.
const page: CSSProperties = {
  contain: "layout",
  boxSizing: "border-box",
  blockSize: "36rem",
  inlineSize: "100%",
  padding: "var(--harmo-space-sm)",
  background: "var(--harmo-color-background-secondary)",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "var(--harmo-border-radius)",
};
const inside: CSSProperties = { display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", minBlockSize: 0 };
const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--harmo-space-xs)",
  padding: "var(--harmo-space-xs) var(--harmo-space-xs) var(--harmo-space-xs) var(--harmo-space-sm)",
  borderBlockEnd: "1px solid var(--harmo-color-border)",
};
const title: CSSProperties = { flex: 1, margin: 0, fontSize: "var(--harmo-font-size-sm)", fontWeight: "var(--harmo-font-weight-semibold)" };
const links: CSSProperties = { display: "grid", gap: "var(--harmo-space-xs)", alignContent: "start", margin: 0, padding: "var(--harmo-space-sm)", listStyle: "none" };

const Close = ({ onClose }: { onClose: () => void }) => (
  <Tooltip label="Close">
    <Button variant="tertiary" size="small" onClick={onClose}>
      <CloseIcon className="hicon" />
    </Button>
  </Tooltip>
);

const later = [
  "It's on its way: the courier picks it up at 2 PM.",
  "You'll get a text with the tracking link once it's out.",
  "Anything else I can help with?",
];

export const examples = {
  Default: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={page}>
        <Launcher aria-label="Help" icon={<MessagesIcon className="hicon" />} open={open} onOpenChange={setOpen}>
          <div style={inside}>
            <div style={header}>
              <h2 style={title}>Help</h2>
              <Close onClose={() => setOpen(false)} />
            </div>
            <ul style={links}>
              <li>
                <Link href="#track" data-autofocus="">
                  Track an order
                </Link>
              </li>
              <li>
                <Link href="#return">Start a return</Link>
              </li>
              <li>
                <Link href="#delivery">Delivery times</Link>
              </li>
            </ul>
          </div>
        </Launcher>
      </div>
    );
  },

  "With new messages": () => {
    const [open, setOpen] = useState(false);
    const [lines, setLines] = useState(["Hi! Your order #4821 ships today."]);
    const [unread, setUnread] = useState(0);
    const sent = useRef(0);

    return (
      <div style={page}>
        <Button
          variant="secondary"
          size="small"
          disabled={sent.current >= later.length}
          onClick={() => {
            const next = later[sent.current++];
            if (!next) return;
            setLines((all) => [...all, next]);
            if (!open) setUnread((count) => count + 1);
          }}
        >
          A message comes
        </Button>
        <Launcher
          aria-label="Chat with Imran"
          buttonLabel={unread > 0 ? `Chat with Imran, ${unread} new` : "Chat with Imran"}
          icon={<MessagesIcon className="hicon" />}
          badge={unread > 0 ? unread : undefined}
          status={unread === 0 ? "" : unread === 1 ? "New message from Imran" : `${unread} new messages`}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setUnread(0);
          }}
        >
          <div style={inside}>
            <div style={header}>
              <Avatar src="images/imran.webp" alt="" />
              <h2 style={title}>Imran Hajiyev</h2>
              <Close onClose={() => setOpen(false)} />
            </div>
            <Conversation aria-label="Conversation" latestLabel="Jump to latest">
              {lines.map((line) => (
                <Message key={line} from="assistant" bubble>
                  {line}
                </Message>
              ))}
            </Conversation>
          </div>
        </Launcher>
      </div>
    );
  },
};
