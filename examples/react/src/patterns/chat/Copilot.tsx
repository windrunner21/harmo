"use client";

import { Button, CopyButton, Tag, Tooltip } from "@harmo-ui/react";
import { ChatComposer, type ChatCommand } from "./Composer.tsx";
import { AssistantIcon, CloseIcon, NewChatIcon } from "./icons.tsx";
import { Feedback, Messages, Suggestions } from "./Messages.tsx";
import { useChat, type ChatFeedback, type ChatMessage, type Respond } from "./useChat.ts";

export interface CopilotProps {
  respond: Respond;
  context?: string;
  suggestions?: string[];
  commands?: ChatCommand[];
  onInsert?: (text: string) => void;
  onFeedback?: (message: ChatMessage, feedback: ChatFeedback | undefined) => void;
  onClose?: () => void;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}

export const Copilot = ({
  respond,
  context,
  suggestions = [],
  commands = [],
  onInsert,
  onFeedback,
  onClose,
  titleAs: Title = "h2",
}: CopilotProps) => {
  const chat = useChat({ respond });

  return (
    <div className="hchat" data-variant="copilot">
      <header className="hchat-header">
        <AssistantIcon className="hicon" />
        <div className="hchat-header-text">
          <Title className="hchat-title">Copilot</Title>
        </div>
        <div className="hchat-header-actions">
          <Tooltip label="New chat">
            <Button
              variant="tertiary"
              size="small"
              disabled={chat.messages.length === 0}
              onClick={() => {
                chat.reset();
                chat.field.current?.focus();
              }}
            >
              <NewChatIcon className="hicon" />
            </Button>
          </Tooltip>
          {onClose && (
            <Tooltip label="Close">
              <Button variant="tertiary" size="small" onClick={onClose}>
                <CloseIcon className="hicon" />
              </Button>
            </Tooltip>
          )}
        </div>
      </header>
      <Messages
        chat={chat}
        editable
        actions={(message) => (
          <>
            {onInsert && (
              <Button variant="secondary" size="small" onClick={() => onInsert(message.text)}>
                Insert
              </Button>
            )}
            <CopyButton value={message.text} label="Copy" copiedLabel="Copied" size="small" />
            {onFeedback && <Feedback chat={chat} message={message} onFeedback={onFeedback} />}
          </>
        )}
      >
        <div className="hchat-greeting">
          <p className="hchat-greeting-title">How can I help?</p>
          <Suggestions chat={chat} items={suggestions} label="Suggestions" />
        </div>
      </Messages>
      <ChatComposer
        chat={chat}
        placeholder={commands.length > 0 ? "Ask Copilot, or type / for a command" : "Ask Copilot"}
        stoppable
        editable
        commands={commands}
        context={context && <Tag>{context}</Tag>}
      />
    </div>
  );
};
