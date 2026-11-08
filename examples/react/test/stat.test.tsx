import { describe, expect, test } from "bun:test";
import { Stat, StatGroup, Tooltip } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/stat.md and tooltip.md say: a hint names its button
// and a trend's hint describes it, whatever their text, 0 included; and a
// Stat takes its group's trend hint unless it has its own.
const tooltipFor = (markup: string, attribute: string) => {
  const id = new RegExp(`${attribute}="([^"]+)"`).exec(markup)?.[1];
  return id && new RegExp(`id="${id}"[^>]*>([^<]*)<`).exec(markup)?.[1];
};

describe("Stat", () => {
  test("a hint names its button, and a trend's hint describes it, even when it's 0", () => {
    const markup = renderToStaticMarkup(
      <Stat label="Tickets" value={0} hint={0} trend={{ direction: "up", label: "+1" }} trendHint={0} />,
    );
    expect(tooltipFor(markup, "aria-labelledby")).toBe("0");
    expect(tooltipFor(markup, "aria-describedby")).toBe("0");
    expect(markup).not.toMatch(/<\/button>0/);
  });

  test("a Stat takes its group's trend hint, unless it has its own, or opts out with false", () => {
    const markup = renderToStaticMarkup(
      <StatGroup trendHint="This week">
        <Stat label="Tickets" value="12" trend={{ direction: "up", label: "+1" }} />
        <Stat label="Replies" value="30" trend={{ direction: "up", label: "+2" }} trendHint="Today" />
        <Stat label="Chats" value="8" trend={{ direction: "down", label: "−1" }} trendHint={false} />
      </StatGroup>,
    );
    const [tickets, replies, chats] = markup.split('class="hstat"').slice(1);
    expect(tooltipFor(tickets!, "aria-describedby")).toBe("This week");
    expect(tooltipFor(replies!, "aria-describedby")).toBe("Today");
    expect(chats).not.toContain("tooltip");
  });
});

describe("Tooltip", () => {
  test("a label or description of 0 names or describes its control, and shows in the tooltip", () => {
    const named = renderToStaticMarkup(
      <Tooltip label={0}>
        <button type="button" />
      </Tooltip>,
    );
    expect(tooltipFor(named, "aria-labelledby")).toBe("0");
    const described = renderToStaticMarkup(
      <Tooltip description={0}>
        <button type="button">Count</button>
      </Tooltip>,
    );
    expect(tooltipFor(described, "aria-describedby")).toBe("0");
  });
});
