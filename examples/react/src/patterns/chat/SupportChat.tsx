"use client";

import { Button, Launcher, Tooltip } from "@harmo-ui/react";
import { useEffect, useEffectEvent, useState } from "react";
import type { Upload } from "../attachments/attachments.ts";
import { ChatArea, ChatComposer, useChatFiles } from "./Composer.tsx";
import { ChatIcon, CloseIcon } from "./icons.tsx";
import { AuthorAvatar, Messages } from "./Messages.tsx";
import { useChat, type ChatAuthor, type ChatReply, type Respond } from "./useChat.ts";

export interface SupportChatProps {
  respond: Respond;
  assistant: ChatAuthor;
  greeting: string;
  suggestions?: string[];
  attach?: boolean;
  upload?: Upload;
  subscribe?: (receive: (reply: ChatReply) => void) => () => void;
  defaultOpen?: boolean;
}

export const SupportChat = ({
  respond,
  assistant,
  greeting,
  suggestions,
  attach = false,
  upload,
  subscribe,
  defaultOpen = false,
}: SupportChatProps) => {
  const chat = useChat({ respond, initial: [{ id: "greeting", role: "assistant", text: greeting, suggestions }] });
  const files = useChatFiles({ chat, upload, enabled: attach || upload !== undefined });
  const [open, setOpen] = useState(defaultOpen);
  const [seen, setSeen] = useState(chat.messages.length);
  const speaker = [...chat.messages].reverse().find((message) => message.from)?.from ?? assistant;
  const unread = open ? [] : chat.messages.slice(seen).filter((message) => message.role === "assistant");
  const latest = unread.at(-1);
  const name = `Chat with ${assistant.name}`;

  const received = useEffectEvent((reply: ChatReply) => chat.receive(reply));

  useEffect(() => subscribe?.((reply) => received(reply)), [subscribe]);

  const toggle = (next: boolean) => {
    if (!next) setSeen(chat.messages.length);
    setOpen(next);
  };

  return (
    <Launcher
      aria-label={name}
      buttonLabel={unread.length > 0 ? `${name}, ${unread.length} new` : name}
      icon={<ChatIcon className="hicon" />}
      badge={unread.length > 0 ? unread.length : undefined}
      status={
        latest && (unread.length === 1 ? `New message from ${(latest.from ?? speaker).name}` : `${unread.length} new messages`)
      }
      open={open}
      onOpenChange={toggle}
    >
      <ChatArea className="hchat" data-variant="support" files={files}>
        <header className="hchat-header">
          <AuthorAvatar author={speaker} />
          <div className="hchat-header-text">
            <p className="hchat-title">{speaker.name}</p>
            {speaker.role && <p className="hchat-subtitle">{speaker.role}</p>}
          </div>
          <div className="hchat-header-actions">
            <Tooltip label="Close">
              <Button variant="tertiary" size="small" onClick={() => toggle(false)}>
                <CloseIcon className="hicon" />
              </Button>
            </Tooltip>
          </div>
        </header>
        <Messages chat={chat} assistant={assistant} bubbles align="end" times />
        <ChatComposer chat={chat} files={files} placeholder="Write a message" autofocus />
      </ChatArea>
    </Launcher>
  );
};
