import { Card, Kbd, ShowcaseCard, Status } from "@harmo-ui/react";
import type { ReactNode } from "react";

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(16rem, 100%), 1fr))",
  gap: "var(--harmo-space-sm)",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

// What a post is about, drawn small in a card's media.
const drawn = {
  display: "grid",
  justifyItems: "start",
  gap: "var(--harmo-space-xs)",
  maxInlineSize: "14rem",
  fontSize: "var(--harmo-font-size-sm)",
};

// A message as it reads, small, for a card's media.
const message = (label: ReactNode, description: ReactNode) => (
  <Card variant="raised" label={label} labelAs="p" description={description} style={{ maxInlineSize: "13rem" }} />
);

export const examples = {
  Default: () => (
    <ul role="list" style={grid}>
      <li>
        <ShowcaseCard
          href="/news/scheduled-messages"
          media={
            <Card variant="raised" style={drawn}>
              <Status status="info">Sends tomorrow at 9:00</Status>
              <p style={{ margin: 0 }}>Your order is on its way. We'll write again when it's out for delivery.</p>
            </Card>
          }
          label="Messages that go out on time"
          description="Schedule a reply for later, and it's sent when you chose, even while you're away."
          action="Read more"
        />
      </li>
      <li>
        <ShowcaseCard
          href="/news/saved-replies"
          media={
            <Card variant="raised" style={drawn}>
              <p style={{ margin: 0 }}>
                Type <Kbd>/thanks</Kbd> to send
              </p>
              <p style={{ margin: 0, color: "var(--harmo-color-text-secondary)" }}>
                Thanks for your patience! It's all sorted now.
              </p>
            </Card>
          }
          label="Saved replies, a keystroke away"
          description="Type a slash in any chat to send an answer you've written before."
          action="Read more"
        />
      </li>
      <li>
        <ShowcaseCard
          href="/news/weekly-report"
          media={
            <Card variant="raised" style={{ display: "grid", justifyItems: "start", gap: "var(--harmo-space-2xs)", maxInlineSize: "14rem", fontSize: "var(--harmo-font-size-sm)" }}>
              <p style={{ margin: 0, color: "var(--harmo-color-text-secondary)" }}>Replies this week</p>
              <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: "var(--harmo-font-weight-semibold)" }}>1,284</p>
              <Status status="success">Up 12% on last week</Status>
            </Card>
          }
          label="Your week, in one email"
          description="Every Monday: replies, response times, and what changed since the week before."
          action="Read more"
        />
      </li>
    </ul>
  ),

  Images: () => (
    <ul role="list" style={grid}>
      <li>
        <ShowcaseCard
          href="/backgrounds/dune"
          media={<img src="images/dune.svg" alt="" />}
          label="Dune"
          description="Warm sand, for the chat window's background."
          action="Preview"
        />
      </li>
      <li>
        <ShowcaseCard
          href="/backgrounds/dusk"
          media={<img src="images/dusk.svg" alt="" />}
          label="Dusk"
          description="An evening sky, quiet behind long threads."
          action="Preview"
        />
      </li>
      <li>
        <ShowcaseCard
          href="/backgrounds/forest"
          media={<img src="images/forest.svg" alt="" />}
          label="Forest"
          description="Deep greens, easy on the eyes all day."
          action="Preview"
        />
      </li>
    </ul>
  ),

  "Folded corner": () => (
    <ul role="list" style={grid}>
      <li>
        <ShowcaseCard
          href="/stories/northwind"
          fold
          media={message("2.4× faster replies", "Since moving their inbox over.")}
          label="Northwind Travel"
          description="How a team of six answers a whole season's bookings."
          action="Read the story"
        />
      </li>
      <li>
        <ShowcaseCard
          href="/stories/fernhill"
          fold
          media={message("40% fewer tickets", "With answers sent before anyone asks.")}
          label="Fernhill Market"
          description="How a grocer keeps customers posted on every delivery."
          action="Read the story"
        />
      </li>
    </ul>
  ),
};
