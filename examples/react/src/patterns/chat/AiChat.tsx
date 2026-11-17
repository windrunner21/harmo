"use client";

import { Button, CopyButton, Tooltip } from "@harmo-ui/react";
import { useEffect, useEffectEvent, useRef } from "react";
import type { Upload } from "../attachments/attachments.ts";
import { ChatArea, ChatComposer, useChatFiles, type ChatCommand } from "./Composer.tsx";
import { RetryIcon } from "./icons.tsx";
import { Feedback, Messages, Suggestions } from "./Messages.tsx";
import { useChat, type ChatFeedback, type ChatMessage, type Respond } from "./useChat.ts";

export interface AiChatProps {
  respond: Respond;
  suggestions?: string[];
  commands?: ChatCommand[];
  attach?: boolean;
  upload?: Upload;
  messages?: ChatMessage[];
  onSave?: (messages: ChatMessage[]) => void;
  onFeedback?: (message: ChatMessage, feedback: ChatFeedback | undefined) => void;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}

export const AiChat = ({
  respond,
  suggestions = [],
  commands = [],
  attach = false,
  upload,
  messages,
  onSave,
  onFeedback,
  titleAs: Title = "h2",
}: AiChatProps) => {
  const chat = useChat({ respond, initial: messages });
  const files = useChatFiles({ chat, upload, enabled: attach || upload !== undefined });
  const saved = useRef(chat.messages);
  const save = useEffectEvent((kept: ChatMessage[]) => onSave?.(kept));

  useEffect(() => {
    if (chat.replying || chat.messages === saved.current) return;
    saved.current = chat.messages;
    save(chat.messages);
  }, [chat.replying, chat.messages]);

  return (
    <ChatArea className="hchat" data-variant="ai" files={files}>
      <Messages
        chat={chat}
        editable
        size="large"
        actions={(message, last) => (
          <>
            <CopyButton value={message.text} label="Copy" copiedLabel="Copied" size="small" />
            {onFeedback && <Feedback chat={chat} message={message} onFeedback={onFeedback} />}
            {last && (
              <Tooltip label="Try again">
                <Button variant="tertiary" size="small" disabled={chat.replying} onClick={chat.regenerate}>
                  <RetryIcon className="hicon" />
                </Button>
              </Tooltip>
            )}
          </>
        )}
      >
        <div className="hchat-greeting">
          <Title className="hchat-greeting-title">What can I help with?</Title>
          <Suggestions chat={chat} items={suggestions} label="Suggestions" />
        </div>
      </Messages>
      <ChatComposer
        chat={chat}
        files={files}
        placeholder={commands.length > 0 ? "Ask anything, or type / for a command" : "Ask anything"}
        stoppable
        editable
        commands={commands}
        note="AI can make mistakes. Check what matters."
      />
    </ChatArea>
  );
};
