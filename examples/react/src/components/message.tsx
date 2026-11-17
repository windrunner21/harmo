import { Avatar, Button, Conversation, CopyButton, FileList, Message, Prose, Tooltip } from "@harmo-ui/react";
import { useState, type CSSProperties } from "react";
import { AssistantIcon, ThumbsDownIcon, ThumbsUpIcon } from "../app-icons.tsx";

// Example only: each in a Conversation, as Messages are used, framed as a
// chat's panel: an AI chat's column, or a support chat's window.
const panel = (width: string): CSSProperties => ({
  inlineSize: "100%",
  maxInlineSize: width,
  marginInline: "auto",
  background: "var(--harmo-color-background)",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "calc(var(--harmo-border-radius) * 2)",
});

const reply =
  "Last week you had **1,284 conversations**, 12% more than the week before.\n\n- Most were about delivery times, then returns.\n- Replies took 4 minutes on average, down from 6.";

const bot = (
  <Avatar alt="">
    <AssistantIcon className="hicon" />
  </Avatar>
);

export const examples = {
  Default: () => {
    const [rating, setRating] = useState<"good" | "bad">();

    return (
      <Conversation aria-label="Conversation" latestLabel="Jump to latest" size="large" style={panel("40rem")}>
        <Message from="user">Summarize last week's conversations</Message>
        <Message
          from="assistant"
          actions={
            <>
              <CopyButton value={reply} label="Copy" copiedLabel="Copied" size="small" />
              <Tooltip label="Good reply">
                <Button variant="tertiary" size="small" aria-pressed={rating === "good"} onClick={() => setRating(rating === "good" ? undefined : "good")}>
                  <ThumbsUpIcon className="hicon" />
                </Button>
              </Tooltip>
              <Tooltip label="Bad reply">
                <Button variant="tertiary" size="small" aria-pressed={rating === "bad"} onClick={() => setRating(rating === "bad" ? undefined : "bad")}>
                  <ThumbsDownIcon className="hicon" />
                </Button>
              </Tooltip>
            </>
          }
        >
          <Prose text={reply} />
        </Message>
      </Conversation>
    );
  },

  Bubbles: () => (
    <Conversation aria-label="Conversation" latestLabel="Jump to latest" style={panel("24rem")}>
      <Message from="assistant" bubble avatar={bot}>
        Hi! I'm Fernhill Market's assistant.
      </Message>
      <Message
        from="assistant"
        bubble
        avatar={null}
        suggestions={
          <>
            <Button variant="secondary" size="small">
              Where's my order?
            </Button>
            <Button variant="secondary" size="small">
              Talk to a person
            </Button>
          </>
        }
        suggestionsLabel="Suggested replies"
      >
        I can track an order or start a return, or find you a person to talk to.
      </Message>
      <Message from="user" accent>
        Talk to a person
      </Message>
      <Message from="system">Imran joined the conversation</Message>
      <Message from="assistant" bubble avatar={<Avatar src="images/imran.webp" alt="" />}>
        Hi, I'm Imran from the support team. How can I help?
      </Message>
    </Conversation>
  ),

  States: () => (
    <Conversation aria-label="Conversation" latestLabel="Jump to latest" style={panel("24rem")}>
      <Message from="user" failed={{ message: "Not sent.", retryLabel: "Try again", onRetry: () => {} }}>
        Where's my order?
      </Message>
      <Message from="assistant" bubble avatar={bot} typing />
    </Conversation>
  ),

  "With files": () => (
    <Conversation aria-label="Conversation" latestLabel="Jump to latest" style={panel("24rem")}>
      <Message
        from="user"
        files={<FileList aria-label="Attachments" files={[{ id: "receipt", name: "receipt.pdf", detail: "80 kB" }]} />}
      >
        Here's the receipt.
      </Message>
    </Conversation>
  ),
};
