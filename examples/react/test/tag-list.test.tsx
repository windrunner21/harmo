import { describe, expect, test } from "bun:test";
import { Tag, TagList } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";
import * as source from "../../../packages/react/src/Tag.tsx";

// What docs/components/tag-list.md says about the React TagList: a list,
// kept one in Safari, with each tag in an <li>, though tags come in a
// fragment, and none for a hidden tag or an empty string; and the copies in
// the tooltip of "+N" are only to look at, with no remove button.
const tags = (markup: string) =>
  [...markup.matchAll(/<li(?! class="htag-list-more")[^>]*>(.*?)<\/li>/g)].map((item) => item[1]);

describe("TagList", () => {
  test("it's a list, with role=\"list\"", () => {
    const markup = renderToStaticMarkup(
      <TagList moreLabel={(count) => `${count} more`}>
        <Tag>Billing</Tag>
      </TagList>,
    );
    expect(markup).toStartWith('<ul class="htag-list" role="list">');
  });

  test("tags in a fragment each get their own <li>; a hidden tag, an empty string, and nothing get none", () => {
    const urgent = false;
    const markup = renderToStaticMarkup(
      <TagList moreLabel={(count) => `${count} more`}>
        <>
          <Tag>Billing</Tag>
          <Tag>Refund</Tag>
        </>
        {""}
        {urgent && <Tag>Urgent</Tag>}
        <Tag hidden>Archived</Tag>
        <Tag>Partner</Tag>
      </TagList>,
    );
    expect(tags(markup)).toEqual([
      '<span class="htag">Billing</span>',
      '<span class="htag">Refund</span>',
      '<span class="htag">Partner</span>',
    ]);
  });

  test("in a copy, as in the tooltip of +N, a TagRemove renders nothing; elsewhere, its button", () => {
    const tag = (
      <source.Tag>
        Billing
        <source.TagRemove aria-label="Remove Billing" />
      </source.Tag>
    );
    expect(renderToStaticMarkup(<source.TagCopyContext value={true}>{tag}</source.TagCopyContext>)).toBe(
      '<span class="htag">Billing</span>',
    );
    expect(renderToStaticMarkup(tag)).toContain('<button aria-label="Remove Billing" class="htag-remove" type="button">');
  });
});
