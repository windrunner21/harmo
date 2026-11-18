import { describe, expect, test } from "bun:test";
import { Mentions, MentionsTrigger, mentionsIn, Option } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/mentions.md says about mentionsIn and the highlight: a
// mention is a trigger and a value from its list, at the start of the text or
// after a space, and ending at a space, punctuation, or the end; in any case,
// given back as the list spells it.
describe("mentionsIn", () => {
  const lists = { "@": ["sam", "ana"], "#": ["releases"] };

  test("finds each trigger's values, where they are", () => {
    expect(mentionsIn("Thanks @sam! See #releases, @ana.", lists)).toEqual([
      { trigger: "@", value: "sam", start: 7, end: 11 },
      { trigger: "#", value: "releases", start: 17, end: 26 },
      { trigger: "@", value: "ana", start: 28, end: 32 },
    ]);
  });

  test("leaves out a longer word, an address, and what isn't in a list", () => {
    expect(mentionsIn("@samuel mail sam@example.com @maya", lists)).toEqual([]);
  });

  test("matches any case, and gives the list's spelling back", () => {
    expect(mentionsIn("Hi @SAM", lists)).toEqual([{ trigger: "@", value: "sam", start: 3, end: 7 }]);
  });

  test("a trigger in another case, and letters in any script, as the list spells them", () => {
    expect(mentionsIn("TO:ANA", { "to:": ["Ana"] })).toEqual([{ trigger: "to:", value: "Ana", start: 0, end: 6 }]);
    expect(mentionsIn("@ς", { "@": ["Σ"] })).toEqual([{ trigger: "@", value: "Σ", start: 0, end: 2 }]);
  });

  test("where one trigger starts another, the longer one's list answers", () => {
    expect(mentionsIn("@@Ana", { "@": ["@Ana"], "@@": ["ana"] })).toEqual([{ trigger: "@@", value: "ana", start: 0, end: 5 }]);
  });

  test("a mention ends at punctuation or a symbol, but not at _ or -", () => {
    expect(mentionsIn("Ping @sam… and @sam_lee, @sam-x", lists).map(({ start }) => start)).toEqual([5]);
  });

  test("a list of commands counts only at the start", () => {
    expect(mentionsIn("/remind me, not /poll", { "/": { values: ["remind", "poll"], atStart: true } })).toEqual([
      { trigger: "/", value: "remind", start: 0, end: 7 },
    ]);
  });
});

describe("Mentions", () => {
  test("highlights what's mentioned, in the text drawn over the field", () => {
    const markup = renderToStaticMarkup(
      <Mentions aria-label="Note" listLabel="People" defaultValue="Ask @sam, not @samuel">
        <Option value="sam">Sam Rivera</Option>
      </Mentions>,
    );
    expect(markup).toContain('class="htextarea-highlight"');
    expect(markup).toContain("<mark>@sam</mark>, not @samuel");
  });

  test("a highlight of your own marks what it matches instead", () => {
    const markup = renderToStaticMarkup(
      <Mentions aria-label="Note" listLabel="People" highlight={/TODO/g} defaultValue="TODO: ask @sam">
        <Option value="sam">Sam Rivera</Option>
      </Mentions>,
    );
    expect(markup).toContain("<mark>TODO</mark>: ask @sam");
  });

  test("with highlight={false}, the field is a plain TextArea", () => {
    const markup = renderToStaticMarkup(
      <Mentions aria-label="Note" listLabel="People" highlight={false}>
        <Option value="sam">Sam Rivera</Option>
      </Mentions>,
    );
    expect(markup).not.toContain("htextarea-highlight");
  });

  test("a MentionsTrigger for each list: a popup for each, named by its listLabel", () => {
    const markup = renderToStaticMarkup(
      <Mentions aria-label="Message" defaultValue="/remind #releases">
        <MentionsTrigger trigger="#" listLabel="Channels">
          <Option value="releases">#releases</Option>
        </MentionsTrigger>
        <MentionsTrigger trigger="/" listLabel="Commands" atStart>
          <Option value="remind">/remind</Option>
        </MentionsTrigger>
      </Mentions>,
    );
    expect(markup.match(/class="hpopup"/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="Channels"');
    expect(markup).toContain('aria-label="Commands"');
    expect(markup).toContain("<mark>/remind</mark> <mark>#releases</mark>");
  });
});
