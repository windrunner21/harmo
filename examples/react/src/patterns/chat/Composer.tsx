"use client";

import { Composer, DropZone, FileList, Option } from "@harmo-ui/react";
import { useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { useAttachments, type Upload } from "../attachments/attachments.ts";
import type { Chat } from "./useChat.ts";

export interface ChatCommand {
  name: string;
  description: string;
}

type Stopping = { stopLabel?: undefined; onStop?: undefined } | { stopLabel: string; onStop: () => void };
type Attaching = { attachLabel?: undefined; onFiles?: undefined } | { attachLabel: string; onFiles: (files: File[]) => void };
type Suggesting =
  | { listLabel?: undefined; trigger?: undefined; atStart?: undefined; children?: undefined }
  | { listLabel: string; trigger: string; atStart: boolean; children: ReactNode };

const most = 5;
const largest = 10_000_000;

export const useChatFiles = ({ chat, upload, enabled }: { chat: Chat; upload?: Upload; enabled: boolean }) => {
  const attachments = useAttachments({ upload, preview: true });
  const [error, setError] = useState("");

  const add = (files: File[]) => {
    if (!enabled || chat.editing) return;
    const room = most - attachments.items.length;
    const fitting = files.filter((file) => file.size <= largest);
    const tooLarge = files.find((file) => file.size > largest);
    setError(tooLarge ? `${tooLarge.name} is over 10 MB.` : fitting.length > room ? `Attach up to ${most} files.` : "");
    attachments.add(fitting.slice(0, Math.max(0, room)));
  };

  const drop = (files: File[]) => {
    add(files);
    chat.field.current?.focus();
  };

  return { enabled, attachments, error, setError, add, drop };
};

export type ChatFiles = ReturnType<typeof useChatFiles>;

export const ChatArea = ({ files, children, ...props }: ComponentPropsWithRef<"div"> & { files?: ChatFiles }) =>
  files?.enabled ? (
    <DropZone {...props} label="Drop files to attach" onFiles={files.drop}>
      {children}
    </DropZone>
  ) : (
    <div {...props}>{children}</div>
  );

export interface ChatComposerProps {
  chat: Chat;
  files?: ChatFiles;
  placeholder: string;
  stoppable?: boolean;
  context?: ReactNode;
  note?: ReactNode;
  commands?: ChatCommand[];
  editable?: boolean;
  autofocus?: boolean;
}

export const ChatComposer = ({
  chat,
  files,
  placeholder,
  stoppable = false,
  context,
  note,
  commands = [],
  editable = false,
  autofocus = false,
}: ChatComposerProps) => {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState("");
  const [shownEdit, setShownEdit] = useState<string>();
  const latest = useRef(text);
  const editing = chat.editing;
  const attachments = files?.enabled ? files.attachments : undefined;
  const attached = attachments?.items.length ?? 0;
  const empty = !text.trim() && (editing ? !editing.files?.length : attached === 0);

  if (editing?.id !== shownEdit) {
    setShownEdit(editing?.id);
    if (editing) {
      setDraft(text);
      setText(editing.text);
    } else {
      setText(draft);
    }
  }

  useLayoutEffect(() => {
    latest.current = text;
  });

  const stopping: Stopping = stoppable ? { stopLabel: "Stop", onStop: chat.stop } : {};
  const attaching: Attaching = files && attachments && !editing ? { attachLabel: "Attach files", onFiles: files.add } : {};
  const suggesting: Suggesting =
    commands.length > 0
      ? {
          listLabel: "Commands",
          trigger: "/",
          atStart: true,
          children: commands.map((command) => (
            <Option key={command.name} value={command.name} description={command.description}>
              /{command.name}
            </Option>
          )),
        }
      : {};

  const submit = async () => {
    if (empty || !chat.ready()) return;
    if (editing) {
      if (chat.send(text)) setText("");
      chat.field.current?.focus();
      return;
    }
    const failed = await attachments?.settle?.();
    if (failed) return files?.setError(failed);
    if (!chat.ready()) return;
    chat.send(latest.current, attachments?.take());
    setText("");
    files?.setError("");
    chat.field.current?.focus();
  };

  return (
    <Composer
      ref={chat.field}
      className="hchat-composer"
      aria-label="Message"
      placeholder={placeholder}
      data-autofocus={autofocus ? "" : undefined}
      value={text}
      onValueChange={setText}
      canSend={!empty}
      replying={chat.replying}
      sendLabel="Send"
      onSend={() => void submit()}
      {...stopping}
      {...attaching}
      files={
        attachments && (
          <FileList
            aria-label="Attachments"
            hidden={attached === 0 || editing !== undefined}
            files={attachments.items}
            removeLabel={(file) => `Remove ${file.name}`}
            onRemove={(file) => {
              if (attached === 1) chat.field.current?.focus();
              attachments.remove(file);
            }}
            retryLabel="Try again"
            onRetry={attachments.retry}
          />
        )
      }
      error={attachments ? files!.error : undefined}
      context={context}
      editing={
        editing && {
          title: "Editing your message",
          text: editing.text,
          cancelLabel: "Cancel editing",
          onCancel: chat.stopEditing,
        }
      }
      onEditLast={editable ? chat.startEditing : undefined}
      note={note}
      {...suggesting}
    />
  );
};
