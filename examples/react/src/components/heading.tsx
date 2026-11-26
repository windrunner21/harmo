import { Heading, Prose, Title } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <div style={{ display: "grid", gap: "var(--harmo-space-md)" }}>
      <Title>Orders</Title>
      <div style={{ display: "grid", gap: "var(--harmo-space-2xs)" }}>
        <Heading>Today</Heading>
        <p style={{ margin: 0 }}>12 orders to pack, and 3 to deliver before noon.</p>
      </div>
      <div style={{ display: "grid", gap: "var(--harmo-space-2xs)" }}>
        <Heading>This week</Heading>
        <p style={{ margin: 0 }}>86 orders, 9 more than last week.</p>
      </div>
    </div>
  ),

  "Beside Prose": () => (
    <div style={{ display: "grid", gap: "var(--harmo-space-md)" }}>
      <Prose>
        <h2>Today</h2>
        <p>Moving the checkout to the new payment provider.</p>
      </Prose>
      <div style={{ display: "grid", gap: "var(--harmo-space-2xs)" }}>
        <Heading>Projects</Heading>
        <p style={{ margin: 0 }}>A delivery app, a design system, and this site.</p>
      </div>
    </div>
  ),
};
