import { Link, Stat, StatGroup } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <Stat
      style={{ inlineSize: "16rem" }}
      label="New tickets"
      value="128"
      caption="Compared to yesterday"
      trend={{ direction: "up", label: "+12%" }}
    />
  ),

  "With a hint and an action": () => (
    <Stat
      style={{ inlineSize: "16rem" }}
      label="Open tickets"
      hint="Tickets that aren't closed yet, across every channel."
      value="37"
      caption="Compared to yesterday"
      trend={{ direction: "down", label: "−8%" }}
      action={<Link href="/tickets">View tickets</Link>}
    />
  ),

  "In a group": () => (
    <StatGroup
      style={{ inlineSize: "100%" }}
      trendHint="Nov 1–7, 2026, compared with Oct 25–31, 2026."
    >
      <Stat
        label="Tickets"
        value="1,284"
        caption="Total for this period"
        trend={{ direction: "up", label: "+12%" }}
      />
      <Stat
        label="First response time"
        value="4m 12s"
        caption="Median, in working hours"
        trend={{ direction: "down", label: "−18%" }}
      />
      <Stat
        label="Open tickets"
        hint="Tickets that aren't closed yet, across every channel."
        value="37"
        caption="Open right now"
      />
    </StatGroup>
  ),

  "Right to left": () => (
    <Stat
      style={{ inlineSize: "16rem" }}
      label="التذاكر الجديدة"
      value="128"
      caption="مقارنة بالأمس"
      // As Intl.NumberFormat("ar") writes +12%, with marks that keep the sign
      // before the number.
      trend={{ direction: "up", label: "\u200e+12\u200e%\u200e" }}
      action={<Link href="/tickets">عرض التذاكر</Link>}
    />
  ),
};
