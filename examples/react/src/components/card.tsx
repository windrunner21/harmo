import { Button, Card, Section, Status, Tag } from "@harmo-ui/react";
import { DevelopersIcon, LockIcon, MessagesIcon, UserIcon } from "../app-icons.tsx";

export const examples = {
  Default: () => (
    <Card>
      <p>
        Your trial ends in 12 days. Add a payment method to keep your campaigns
        running.
      </p>
      <Button variant="secondary">Add payment method</Button>
    </Card>
  ),

  Raised: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(16rem, 100%), 1fr))",
        gap: "var(--harmo-space-sm)",
        alignItems: "start",
      }}
    >
      <Card style={{ display: "grid", gap: "var(--harmo-space-xs)" }}>
        <Status status="info" style={{ justifySelf: "start" }}>
          Open
        </Status>
        <Card variant="raised">
          <p>Refund not received for order 1042</p>
          <Tag>Billing</Tag>
        </Card>
        <Card variant="raised">
          <p>Can't connect a custom domain</p>
          <Tag>Setup</Tag>
        </Card>
      </Card>
      <Card style={{ display: "grid", gap: "var(--harmo-space-xs)" }}>
        <Status status="warning" style={{ justifySelf: "start" }}>
          Waiting on customer
        </Status>
        <Card variant="raised">
          <p>Invoice shows the old address</p>
          <Tag>Billing</Tag>
        </Card>
      </Card>
    </div>
  ),

  Ghost: () => (
    <Section label="Workspace" labelAs="h3">
      <nav aria-label="Workspace settings" style={{ marginBlock: "calc(-1px - var(--harmo-card-padding))" }}>
        <Card variant="ghost" href="#team">
          Team members
        </Card>
        <Card variant="ghost" href="#billing">
          Billing
        </Card>
        <Card variant="ghost" href="#developers">
          Developers
        </Card>
      </nav>
    </Section>
  ),

  Padding: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(16rem, 100%), 1fr))",
        gap: "var(--harmo-space-sm)",
        alignItems: "start",
      }}
    >
      <Card>
        <p>Last synced 5 minutes ago</p>
      </Card>
      <Card style={{ "--harmo-card-padding": "var(--harmo-space-xs)" }}>
        <p>Last synced 5 minutes ago</p>
      </Card>
    </div>
  ),

  "Links with icons": () => (
    <Section label="Settings" labelAs="h3">
      <nav
        aria-label="Settings"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(18rem, 100%), 1fr))",
          gap: "var(--harmo-space-sm)",
          marginBlock: "calc(-1px - var(--harmo-card-padding))",
        }}
      >
        <Card
          variant="ghost"
          href="/settings/personal"
          icon={<UserIcon className="hicon" />}
          label="Personal"
          labelAs="h4"
          description="Your name, email address, language, and password."
        />
        <Card
          variant="ghost"
          href="/settings/notifications"
          icon={<MessagesIcon className="hicon" />}
          label="Notifications"
          labelAs="h4"
          description="How and when we tell you about new messages and tickets."
        />
        <Card
          variant="ghost"
          href="/settings/security"
          icon={<LockIcon className="hicon" />}
          label="Security"
          labelAs="h4"
          description="Two-step verification, and the devices signed in to your account."
        />
        <Card
          variant="ghost"
          href="/settings/developers"
          icon={<DevelopersIcon className="hicon" />}
          label="Developers"
          labelAs="h4"
          description="API keys and webhooks, to connect your own tools."
        />
      </nav>
    </Section>
  ),

  "Links with a chevron": () => (
    <ul
      style={{
        "--harmo-card-padding": "var(--harmo-space-xs)",
        marginBlock: "calc(-1px - var(--harmo-card-padding))",
        padding: 0,
        listStyle: "none",
      }}
    >
      <li>
        <Card
          variant="ghost"
          href="/activate"
          label="Activate your account"
          labelAs="p"
          description="Got an invitation? Set a password to start."
          chevron
        />
      </li>
      <li>
        <Card
          variant="ghost"
          href="/sign-up"
          label="New here?"
          labelAs="p"
          description="Create an account for your team in a few minutes."
          chevron
        />
      </li>
      <li>
        <Card
          variant="ghost"
          href="/contact"
          label="Talk to us"
          labelAs="p"
          description="Questions about plans or setup? We're glad to help."
          chevron
        />
      </li>
    </ul>
  ),

  "Not a link": () => (
    <Card
      icon={<LockIcon className="hicon" />}
      label="Two-step verification is on"
      description="We ask for a code from your phone each time you sign in."
    />
  ),

  "Right to left": () => (
    <Card
      variant="ghost"
      href="/settings/personal"
      style={{ marginBlock: "calc(-1px - var(--harmo-card-padding))" }}
      icon={<UserIcon className="hicon" />}
      label="الملف الشخصي"
      description="اسمك وبريدك الإلكتروني ولغتك وكلمة المرور."
      chevron
    />
  ),

  "With a detail": () => (
    <ul
      style={{
        "--harmo-card-padding": "var(--harmo-space-xs)",
        marginBlock: "calc(-1px - var(--harmo-card-padding))",
        padding: 0,
        listStyle: "none",
      }}
    >
      <li>
        <Card variant="ghost" label="Product engineer, Speedwagon" labelAs="p" meta="2023–now" description="The ordering app, from the first order to the hundred-thousandth." />
      </li>
      <li>
        <Card variant="ghost" label="Frontend engineer, Northwind" labelAs="p" meta="2020–2023" description="The design system, and the checkout built on it." />
      </li>
      <li>
        <Card variant="ghost" label="Designer, Lumen Studio" labelAs="p" meta="2018–2020" description="Brands and sites for small producers." />
      </li>
    </ul>
  ),

  "Links with a detail": () => (
    <ul
      style={{
        "--harmo-card-padding": "var(--harmo-space-xs)",
        marginBlock: "calc(-1px - var(--harmo-card-padding))",
        padding: 0,
        listStyle: "none",
      }}
    >
      <li>
        <Card
          variant="ghost"
          href="/blog/native-popovers"
          label="Moving a design system to native popovers"
          labelAs="p"
          meta={<time dateTime="2026-11-20">Nov 20</time>}
          description="What the browser now does for us, and what it still doesn't."
        />
      </li>
      <li>
        <Card
          variant="ghost"
          href="/blog/golden-spacing"
          label="Spacing on the golden ratio"
          labelAs="p"
          meta={<time dateTime="2026-10-02">Oct 2</time>}
          description="Why every gap here is 6, 10, 16, or 26 pixels."
        />
      </li>
      <li>
        <Card
          variant="ghost"
          href="https://example.com/accessible-forms"
          label="Notes on accessible forms"
          labelAs="p"
          meta={<time dateTime="2026-08-14">Aug 14</time>}
          description={<span className="hexternal">On example.com</span>}
        />
      </li>
    </ul>
  ),
};
