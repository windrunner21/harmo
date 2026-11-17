import { prosePlainText } from "@harmo-ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Attachment } from "../attachments/attachments.ts";

export interface ChatAuthor {
  name: string;
  role?: string;
  avatar?: ReactNode;
}

export interface ChatReply {
  text: string;
  suggestions?: string[];
  from?: ChatAuthor;
}

export type ChatAnswer = string | ChatReply | AsyncIterable<string>;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  files?: (File | string)[];
}

export type Respond = (
  conversation: ChatTurn[],
  options: { signal: AbortSignal },
) => ChatAnswer | Promise<ChatAnswer>;

export type ChatFeedback = "good" | "bad";

export interface ChatMessage extends Omit<ChatTurn, "files"> {
  id: string;
  time?: Date;
  feedback?: ChatFeedback;
  files?: Attachment[];
  suggestions?: string[];
  from?: ChatAuthor;
  failed?: boolean;
  streaming?: boolean;
}

export type Chat = ReturnType<typeof useChat>;

const streamed = (answer: ChatAnswer): answer is AsyncIterable<string> =>
  typeof answer === "object" && Symbol.asyncIterator in answer;

const authorOf = (messages: ChatMessage[]) => [...messages].reverse().find((message) => message.from)?.from;

export const useChat = ({ respond, initial = [] }: { respond: Respond; initial?: ChatMessage[] }) => {
  const [messages, setMessages] = useState(initial);
  const [replying, setReplying] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const current = useRef(messages);
  const asking = useRef<AbortController | null>(null);
  const count = useRef(0);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    current.current = messages;
  }, [messages]);

  useEffect(() => {
    const ask = asking;
    return () => ask.current?.abort();
  }, []);

  const nextId = () => {
    const taken = current.current.map((message) => Number(/^message-(\d+)$/.exec(message.id)?.[1] ?? 0));
    count.current = Math.max(count.current, ...taken) + 1;
    return `message-${count.current}`;
  };

  const announce = (reply: ChatReply, before = authorOf(current.current)) => {
    const joined = reply.from && reply.from.name !== before?.name ? `${reply.from.name} joined the conversation. ` : "";
    setAnnouncement(`${joined}${reply.from ? `${reply.from.name}: ` : ""}${prosePlainText(reply.text)}`);
  };

  const change = (id: string, patch: Partial<ChatMessage>) =>
    setMessages((list) => list.map((message) => (message.id === id ? { ...message, ...patch } : message)));

  const ask = async (conversation: ChatMessage[], asker: string) => {
    const controller = new AbortController();
    asking.current = controller;
    setReplying(true);
    const id = nextId();
    const before = authorOf(conversation);
    const turns = conversation
      .filter((message) => !message.failed)
      .map(({ role, text, files }): ChatTurn => ({
        role,
        text,
        ...(files && { files: files.map((file) => file.key ?? file.file) }),
      }));
    try {
      const answer = await respond(turns, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (streamed(answer)) {
        let text = "";
        for await (const piece of answer) {
          if (controller.signal.aborted) return;
          if (!piece) continue;
          if (!text) setMessages((list) => [...list, { id, role: "assistant", time: new Date(), text: piece, streaming: true }]);
          else change(id, { text: text + piece });
          text += piece;
        }
        if (controller.signal.aborted || !text) return;
        change(id, { streaming: false });
        announce({ text }, before);
      } else {
        const reply = typeof answer === "string" ? { text: answer } : answer;
        setMessages((list) => [...list, { id, role: "assistant", time: new Date(), ...reply }]);
        announce(reply, before);
      }
    } catch {
      if (controller.signal.aborted) return;
      setMessages((list) =>
        list.filter((message) => message.id !== id).map((message) => (message.id === asker ? { ...message, failed: true } : message)),
      );
      setAnnouncement("Your message didn't send.");
    } finally {
      if (asking.current === controller) {
        asking.current = null;
        setReplying(false);
      }
    }
  };

  const start = (conversation: ChatMessage[], text: string, files?: Attachment[]) => {
    const message: ChatMessage = { id: nextId(), role: "user", time: new Date(), text, ...(files?.length && { files }) };
    current.current = [...conversation, message];
    setMessages(current.current);
    void ask(current.current, message.id);
  };

  const ready = () => !asking.current;

  const send = (text: string, files: Attachment[] = []) => {
    if (editingId) {
      if (!edit(editingId, text)) return false;
      setEditingId(null);
      return true;
    }
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || asking.current) return false;
    start(current.current, trimmed, files);
    return true;
  };

  const retry = (id: string) => {
    const message = current.current.find((candidate) => candidate.id === id);
    if (!message || asking.current) return;
    start(
      current.current.filter((candidate) => candidate.id !== id),
      message.text,
      message.files,
    );
  };

  const edit = (id: string, text: string) => {
    const list = current.current;
    const index = list.findIndex((message) => message.id === id);
    const message = list[index];
    const trimmed = text.trim();
    if (!message || asking.current || (!trimmed && !message.files?.length)) return false;
    start(list.slice(0, index), trimmed, message.files);
    return true;
  };

  const rate = (id: string, feedback: ChatFeedback | undefined) => change(id, { feedback });

  const lastAsked = () => [...current.current].reverse().find((message) => message.role === "user");

  const startEditing = () => {
    const last = lastAsked();
    if (!last || asking.current) return false;
    setEditingId(last.id);
    return true;
  };

  const stopEditing = () => setEditingId(null);

  const regenerate = () => {
    const list = current.current;
    const asker = [...list].reverse().find((message) => message.role === "user");
    if (asking.current || list.at(-1)?.role !== "assistant" || !asker) return;
    current.current = list.slice(0, -1);
    setMessages(current.current);
    void ask(current.current, asker.id);
  };

  const receive = (reply: ChatReply) => {
    const message: ChatMessage = { id: nextId(), role: "assistant", time: new Date(), ...reply };
    announce(reply);
    current.current = [...current.current, message];
    setMessages((list) => [...list, message]);
  };

  const stop = () => {
    if (!asking.current) return;
    asking.current.abort();
    asking.current = null;
    setReplying(false);
    setMessages((list) =>
      list.flatMap((message) => (!message.streaming ? [message] : message.text ? [{ ...message, streaming: false }] : [])),
    );
    setAnnouncement("Stopped.");
  };

  const reset = () => {
    setEditingId(null);
    asking.current?.abort();
    asking.current = null;
    setReplying(false);
    current.current = initial;
    setMessages(initial);
    setAnnouncement("");
  };

  return {
    messages,
    replying,
    waiting: replying && !messages.some((message) => message.streaming),
    announcement,
    field,
    ready,
    send,
    receive,
    retry,
    edit,
    rate,
    regenerate,
    stop,
    reset,
    editing: messages.find((message) => message.id === editingId),
    startEditing,
    stopEditing,
  };
};
