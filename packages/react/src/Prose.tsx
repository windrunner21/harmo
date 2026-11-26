"use client";

import { Fragment, type ComponentPropsWithRef, type ReactNode } from "react";
import { Link } from "./Link.tsx";
import type { Naming } from "./types.ts";
import { withClass } from "./withClass.ts";

export interface ProseProps extends ComponentPropsWithRef<"div"> {
  text?: string;
}

type Block =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; ordered: boolean; start: number; items: string[] }
  | { kind: "code"; text: string };

const fence = /^\s*```/;
const bullet = /^\s*[-*•]\s+(.*)$/;
const numbered = /^\s*(\d+)[.)]\s+(.*)$/;
const inline =
  /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]*[^\s<.,:;"')\]!?])/g;

// The text's blocks: paragraphs, their lines kept; lists, bulleted or
// numbered; and code between lines of three backticks, the last one's end
// optional, as while it's still being written.
const blocksOf = (text: string) => {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  const at = (index: number) => lines[index] ?? "";
  let index = 0;
  while (index < lines.length) {
    const line = at(index);
    if (fence.test(line)) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !fence.test(at(index))) code.push(at(index++));
      index += 1;
      blocks.push({ kind: "code", text: code.join("\n") });
    } else if (bullet.test(line) || numbered.test(line)) {
      const ordered = !bullet.test(line);
      const items: string[] = [];
      for (let match; (match = (ordered ? numbered : bullet).exec(at(index))); index += 1) {
        items.push((ordered ? match[2] : match[1]) ?? "");
      }
      blocks.push({ kind: "list", ordered, start: ordered ? Number(numbered.exec(line)?.[1]) : 1, items });
    } else if (!line.trim()) {
      index += 1;
    } else {
      const paragraph: string[] = [];
      while (index < lines.length && at(index).trim() && ![fence, bullet, numbered].some((rule) => rule.test(at(index)))) {
        paragraph.push(at(index++));
      }
      blocks.push({ kind: "paragraph", lines: paragraph });
    }
  }
  return blocks;
};

// In a line: **bold**, `code`, and links, written out or as [text](address).
// Only web and email addresses become links.
const Inline = ({ text }: { text: string }) => {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(inline)) {
    const [whole, bold, code, label, href, address] = match;
    parts.push(text.slice(last, match.index));
    if (bold) parts.push(<strong key={match.index}>{bold}</strong>);
    else if (code) parts.push(<code key={match.index}>{code}</code>);
    else {
      const to = href ?? (address?.startsWith("www.") ? `https://${address}` : (address ?? ""));
      parts.push(
        <Link key={match.index} href={to} underlined target="_blank" rel="noreferrer">
          {label ?? address}
        </Link>,
      );
    }
    last = match.index + whole.length;
  }
  parts.push(text.slice(last));
  return parts;
};

const Formatted = ({ text }: { text: string }) =>
  blocksOf(text).map((block, index) => {
    if (block.kind === "code") {
      return (
        <pre key={index}>
          <code>{block.text}</code>
        </pre>
      );
    }
    if (block.kind === "list") {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List key={index} start={block.ordered && block.start !== 1 ? block.start : undefined}>
          {block.items.map((item, line) => (
            <li key={line}>
              <Inline text={item} />
            </li>
          ))}
        </List>
      );
    }
    return (
      <p key={index}>
        {block.lines.map((line, row) => (
          <Fragment key={row}>
            {row > 0 && <br />}
            <Inline text={line} />
          </Fragment>
        ))}
      </p>
    );
  });

export const Prose = ({ text, className, children, ...props }: ProseProps) => (
  <div {...props} className={withClass("hprose", className)}>
    {text === undefined ? children : <Formatted text={text} />}
  </div>
);

export type ProseTableProps = Omit<ComponentPropsWithRef<"div">, "aria-label" | "aria-labelledby"> & Naming;

export const ProseTable = ({ className, ...props }: ProseTableProps) => (
  <div role="region" tabIndex={0} {...props} className={withClass("hprose-table", className)} />
);

// What a screen reader hears of text Prose formats: the text, without its
// marks.
export const prosePlainText = (text: string) =>
  text
    .replace(/^\s*```.*$/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
