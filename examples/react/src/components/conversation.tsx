import { Composer, Conversation, EmptyState, Message } from "@harmo-ui/react";
import { useRef, useState, type CSSProperties } from "react";

// Example only: a chat's panel, the Conversation over a Composer, that takes
// what's sent, and a reply a moment later, standing in for your app's chat.
interface Line {
  id: number;
  from: "user" | "assistant";
  text: string;
}

const earlier: Line[] = [
  { id: 1, from: "user", text: "Which orders are late this week?" },
  { id: 2, from: "assistant", text: "Three: #4821 and #4830 are waiting on the courier, and #4833 on stock." },
  { id: 3, from: "user", text: "When is #4833's stock due?" },
  { id: 4, from: "assistant", text: "Thursday morning. It ships the same day if it arrives before noon." },
  { id: 5, from: "user", text: "Let the customer know, please." },
  { id: 6, from: "assistant", text: "Done: I've emailed them the new date, and a 10% discount code for the wait." },
  { id: 7, from: "user", text: "And the other two?" },
  { id: 8, from: "assistant", text: "The courier picks both up today, between 2 and 4 PM." },
];

const panel: CSSProperties = {
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr) auto",
  boxSizing: "border-box",
  inlineSize: "100%",
  maxInlineSize: "32rem",
  blockSize: "24rem",
  marginInline: "auto",
  overflow: "hidden",
  background: "var(--harmo-color-background)",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "calc(var(--harmo-border-radius) * 2)",
};
const foot: CSSProperties = { padding: "0 var(--harmo-space-sm) var(--harmo-space-sm)" };

const Demo = ({ initial, align }: { initial: Line[]; align?: "end" }) => {
  const [lines, setLines] = useState(initial);
  const [status, setStatus] = useState("");
  const [replying, setReplying] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);

  return (
    <div style={panel}>
      <Conversation
        aria-label="Conversation"
        latestLabel="Jump to latest"
        status={status}
        align={align}
        onJump={() => field.current?.focus()}
        empty={<EmptyState label="No messages yet" labelAs="p" description="Ask about an order to start." size="small" />}
      >
        {lines.map((line) => (
          <Message key={line.id} from={line.from}>
            {line.text}
          </Message>
        ))}
      </Conversation>
      <Composer
        ref={field}
        aria-label="Message"
        placeholder="Message"
        sendLabel="Send"
        replying={replying}
        style={foot}
        onSend={(sent) => {
          const text = sent.trim();
          setLines((all) => [...all, { id: all.length + 1, from: "user", text }]);
          setReplying(true);
          setTimeout(() => {
            const reply = `On it: "${text}".`;
            setLines((all) => [...all, { id: all.length + 1, from: "assistant", text: reply }]);
            setStatus(reply);
            setReplying(false);
          }, 1500);
        }}
      />
    </div>
  );
};

export const examples = {
  Default: () => <Demo initial={earlier} />,
  "Before the first message": () => <Demo initial={[]} />,
  "Gathered at the foot": () => <Demo initial={earlier.slice(0, 2)} align="end" />,
};
