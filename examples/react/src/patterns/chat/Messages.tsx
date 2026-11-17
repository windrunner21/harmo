"use client";

import { Avatar, Button, Conversation, FileList, Message, Prose, Tooltip } from "@harmo-ui/react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { BadIcon, EditIcon, GoodIcon } from "./icons.tsx";
import type { Chat, ChatAuthor, ChatFeedback, ChatMessage } from "./useChat.ts";

export interface MessagesProps {
  chat: Chat;
  assistant?: ChatAuthor;
  bubbles?: boolean;
  actions?: (message: ChatMessage, last: boolean) => ReactNode;
  editable?: boolean;
  times?: boolean;
  size?: "large";
  align?: "end";
  children?: ReactNode;
}

type Offered = { suggestions?: undefined; suggestionsLabel?: undefined } | { suggestions: ReactNode; suggestionsLabel: string };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const AuthorAvatar = ({ author }: { author: ChatAuthor }) =>
  author.avatar ?? <Avatar alt="">{initials(author.name)}</Avatar>;

export const SuggestionButtons = ({ chat, items }: { chat: Chat; items: string[] }) =>
  items.map((item) => (
    <Button
      key={item}
      variant="secondary"
      size="small"
      onClick={() => {
        chat.send(item);
        chat.field.current?.focus();
      }}
    >
      {item}
    </Button>
  ));

export const Suggestions = ({ chat, items, label }: { chat: Chat; items: string[]; label: string }) =>
  items.length > 0 && (
    <div className="hchat-suggestions" role="group" aria-label={label}>
      <SuggestionButtons chat={chat} items={items} />
    </div>
  );

export const Feedback = ({
  chat,
  message,
  onFeedback,
}: {
  chat: Chat;
  message: ChatMessage;
  onFeedback: (message: ChatMessage, feedback: ChatFeedback | undefined) => void;
}) =>
  (["good", "bad"] as const).map((rating) => (
    <Tooltip key={rating} label={rating === "good" ? "Good reply" : "Bad reply"}>
      <Button
        variant="tertiary"
        size="small"
        aria-pressed={message.feedback === rating}
        onClick={() => {
          const feedback = message.feedback === rating ? undefined : rating;
          chat.rate(message.id, feedback);
          onFeedback(message, feedback);
        }}
      >
        {rating === "good" ? <GoodIcon className="hicon" /> : <BadIcon className="hicon" />}
      </Button>
    </Tooltip>
  ));

export const Messages = ({
  chat,
  assistant,
  bubbles = false,
  actions,
  editable = false,
  times = false,
  size,
  align,
  children,
}: MessagesProps) => {
  const { messages, replying, waiting } = chat;
  const lastAsked = [...messages].reverse().find((message) => message.role === "user")?.id;

  const edit = () => {
    flushSync(() => chat.startEditing());
    const field = chat.field.current;
    field?.focus();
    field?.setSelectionRange(field.value.length, field.value.length);
  };

  const items: ReactNode[] = [];
  let speaker = assistant;
  for (const [index, message] of messages.entries()) {
    const last = index === messages.length - 1;
    const next = messages[index + 1];
    if (message.role === "user") {
      const timed = times && !message.failed && next?.role !== "user";
      const editHere = editable && message.id === lastAsked && !replying && chat.editing?.id !== message.id;
      items.push(
        <Message
          key={message.id}
          from="user"
          accent={bubbles}
          time={timed ? message.time : undefined}
          files={
            message.files && (
              <FileList
                aria-label="Attachments"
                files={message.files.map(({ id, name, detail, preview }) => ({ id, name, detail, preview }))}
              />
            )
          }
          actions={
            editHere && (
              <Tooltip label="Edit">
                <Button variant="tertiary" size="small" onClick={edit}>
                  <EditIcon className="hicon" />
                </Button>
              </Tooltip>
            )
          }
          failed={message.failed ? { message: "Not sent.", retryLabel: "Try again", onRetry: () => chat.retry(message.id) } : undefined}
        >
          {message.text}
        </Message>,
      );
      continue;
    }
    const joined = message.from && message.from.name !== speaker?.name ? message.from : undefined;
    if (message.from) speaker = message.from;
    if (joined) {
      items.push(
        <Message key={`${message.id}-joined`} from="system">
          {joined.name} joined the conversation
        </Message>,
      );
    }
    const opens = joined || messages[index - 1]?.role !== "assistant";
    const ends = !next || next.role !== "assistant" || (next.from !== undefined && next.from.name !== speaker?.name);
    const offered: Offered =
      last && !replying && message.suggestions?.length
        ? { suggestions: <SuggestionButtons chat={chat} items={message.suggestions} />, suggestionsLabel: "Suggested replies" }
        : {};
    items.push(
      <Message
        key={message.id}
        from="assistant"
        bubble={bubbles}
        avatar={bubbles ? opens && speaker && <AuthorAvatar author={speaker} /> : undefined}
        time={times && ends && !message.streaming ? message.time : undefined}
        actions={!message.streaming && actions?.(message, last)}
        busy={message.streaming}
        {...offered}
      >
        <Prose text={message.text} />
      </Message>,
    );
  }

  return (
    <Conversation
      className="hchat-conversation"
      aria-label="Conversation"
      latestLabel="Jump to latest"
      status={chat.announcement}
      size={size}
      align={align}
      empty={children}
      onJump={() => chat.field.current?.focus()}
    >
      {items}
      {waiting && (
        <Message
          key="typing"
          from="assistant"
          bubble={bubbles}
          avatar={bubbles ? messages.at(-1)?.role !== "assistant" && speaker && <AuthorAvatar author={speaker} /> : undefined}
          typing
        />
      )}
    </Conversation>
  );
};
