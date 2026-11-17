import { Composer, Conversation, EmptyState, FileList, Message, Option, Tag } from "@harmo-ui/react";
import { useRef, useState, type CSSProperties } from "react";

// Example only: a conversation that takes what's sent, and a reply after a
// moment, standing in for your app's chat.
interface Sent {
  id: string;
  name: string;
  detail: string;
}

interface Line {
  id: number;
  from: "user" | "assistant";
  text: string;
  files?: Sent[];
}

// A chat's panel: the Conversation over the Composer.
const panel = (width: string): CSSProperties => ({
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr) auto",
  boxSizing: "border-box",
  inlineSize: "100%",
  maxInlineSize: width,
  blockSize: "24rem",
  marginInline: "auto",
  overflow: "hidden",
  background: "var(--harmo-color-background)",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "calc(var(--harmo-border-radius) * 2)",
});
const foot: CSSProperties = { padding: "0 var(--harmo-space-sm) var(--harmo-space-sm)" };

const kilobytes = new Intl.NumberFormat(undefined, { style: "unit", unit: "kilobyte", maximumFractionDigits: 0 });

const useReplies = (initial: Line[] = []) => {
  const [lines, setLines] = useState(initial);
  const [replying, setReplying] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const next = useRef(initial.length + 1);

  const add = (line: Omit<Line, "id">) => setLines((all) => [...all, { ...line, id: next.current++ }]);

  const send = (text: string, files?: Sent[]) => {
    add({ from: "user", text, files });
    setReplying(true);
    timer.current = setTimeout(() => {
      const reply = files?.length ? `Thanks, I've got ${files.length === 1 ? "the file" : "the files"}.` : `On it: "${text.trim()}".`;
      add({ from: "assistant", text: reply });
      setStatus(reply);
      setReplying(false);
    }, 1500);
  };

  const stop = () => {
    clearTimeout(timer.current);
    setReplying(false);
    setStatus("Stopped");
  };

  return { lines, setLines, replying, status, send, stop };
};

const Lines = ({ lines, status }: { lines: Line[]; status: string }) => (
  <Conversation
    aria-label="Conversation"
    latestLabel="Jump to latest"
    status={status}
    empty={<EmptyState label="No messages yet" labelAs="p" description="Send one to start." size="small" />}
  >
    {lines.map((line) => (
      <Message
        key={line.id}
        from={line.from}
        files={line.files && <FileList aria-label="Attachments" files={line.files} />}
      >
        {line.text}
      </Message>
    ))}
  </Conversation>
);

export const examples = {
  Default: () => {
    const chat = useReplies();
    const [text, setText] = useState("");
    const [files, setFiles] = useState<Sent[]>([]);
    const next = useRef(1);

    return (
      <div style={panel("40rem")}>
        <Lines lines={chat.lines} status={chat.status} />
        <Composer
          aria-label="Message"
          placeholder="Ask anything"
          style={foot}
          value={text}
          onValueChange={setText}
          canSend={text.trim() !== "" || files.length > 0}
          replying={chat.replying}
          sendLabel="Send"
          stopLabel="Stop"
          onStop={chat.stop}
          attachLabel="Attach files"
          onFiles={(added) =>
            setFiles((all) => [
              ...all,
              ...added.map((file) => ({ id: String(next.current++), name: file.name, detail: kilobytes.format(Math.max(1, Math.round(file.size / 1000))) })),
            ])
          }
          files={
            <FileList
              aria-label="Attachments"
              hidden={files.length === 0}
              files={files}
              removeLabel={(file) => `Remove ${file.name}`}
              onRemove={(file) => setFiles((all) => all.filter((each) => each.id !== file.id))}
            />
          }
          note="Replies here are made up."
          onSend={(sent) => {
            chat.send(sent, files.length > 0 ? files : undefined);
            setText("");
            setFiles([]);
          }}
        />
      </div>
    );
  },

  Commands: () => {
    const chat = useReplies();

    return (
      <div style={panel("32rem")}>
        <Lines lines={chat.lines} status={chat.status} />
        <Composer
          aria-label="Message"
          placeholder="Ask about this ticket, or type / for a command"
          style={foot}
          replying={chat.replying}
          sendLabel="Send"
          context={<Tag>Ticket #4821</Tag>}
          listLabel="Commands"
          trigger="/"
          atStart
          onSend={(sent) => chat.send(sent)}
        >
          <Option value="summarize" description="Summarize this ticket">
            /summarize
          </Option>
          <Option value="draft" description="Draft a reply">
            /draft
          </Option>
          <Option value="translate" description="Translate the customer's message">
            /translate
          </Option>
        </Composer>
      </div>
    );
  },

  Editing: () => {
    const chat = useReplies([
      { id: 1, from: "user", text: "Where's my order?" },
      { id: 2, from: "assistant", text: "Which order? Its number is in your confirmation email." },
    ]);
    const [text, setText] = useState("");
    const [editing, setEditing] = useState<Line>();
    const field = useRef<HTMLTextAreaElement>(null);
    const last = [...chat.lines].reverse().find((line) => line.from === "user");

    return (
      <div style={panel("32rem")}>
        <Lines lines={chat.lines} status={chat.status} />
        <Composer
          ref={field}
          aria-label="Message"
          placeholder="Message"
          style={foot}
          value={text}
          onValueChange={setText}
          replying={chat.replying}
          sendLabel="Send"
          editing={
            editing && {
              title: "Editing your message",
              text: editing.text,
              cancelLabel: "Cancel editing",
              onCancel: () => {
                setEditing(undefined);
                setText("");
              },
            }
          }
          onEditLast={() => {
            if (!last || chat.replying) return false;
            setEditing(last);
            setText(last.text);
            return true;
          }}
          onSend={(sent) => {
            if (editing) {
              chat.setLines((all) => all.map((line) => (line.id === editing.id ? { ...line, text: sent } : line)));
              setEditing(undefined);
            } else {
              chat.send(sent);
            }
            setText("");
          }}
        />
      </div>
    );
  },
};
