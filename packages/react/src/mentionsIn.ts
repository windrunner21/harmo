// What counts as a mention, shared by Mentions' highlight and mentionsIn, with
// no "use client", so a server action can call mentionsIn too.

export interface MentionList {
  values: readonly string[];
  atStart?: boolean;
}

export type MentionLists = Record<string, readonly string[] | MentionList>;

export interface Mention {
  trigger: string;
  value: string;
  start: number;
  end: number;
}

interface Source extends MentionList {
  trigger: string;
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A mention starts the text, or follows a space, and ends at the end, a space,
// or punctuation or a symbol, but for "_" and "-", which a handle can hold. At
// the same place, the longest trigger is tried first.
const ordered = (sources: Source[]) =>
  sources
    .map((source, index) => ({ ...source, index }))
    .filter(({ values }) => values.length > 0)
    .sort((a, b) => b.trigger.length - a.trigger.length);

const patternOf = (sources: ReturnType<typeof ordered>) =>
  sources
    .map(({ trigger, values, atStart }) => {
      const names = [...values].sort((a, b) => b.length - a.length).map(escaped).join("|");
      return `${atStart ? "^" : "(?<!\\S)"}(${escaped(trigger)}(?:${names}))(?=$|[\\s\\p{P}\\p{S}])(?![_-])`;
    })
    .join("|");

export const mentionPattern = (sources: Source[]) => {
  const source = patternOf(ordered(sources));
  return source ? new RegExp(source, "giu") : undefined;
};

const sourcesOf = (lists: MentionLists): Source[] =>
  Object.entries(lists).map(([trigger, list]) =>
    Array.isArray(list) ? { trigger, values: list } : { trigger, ...(list as MentionList) },
  );

export const mentionsIn = (text: string, lists: MentionLists): Mention[] => {
  const sources = ordered(sourcesOf(lists));
  const source = patternOf(sources);
  if (!source) return [];
  return [...text.matchAll(new RegExp(source, "giu"))].map((match) => {
    const group = match.slice(1).findIndex((found) => found !== undefined);
    const list = sources[group]!;
    const typed = match[0].slice(list.trigger.length);
    const value = list.values.find((each) => new RegExp(`^${escaped(each)}$`, "iu").test(typed)) ?? typed;
    return { trigger: list.trigger, value, start: match.index, end: match.index + match[0].length };
  });
};
