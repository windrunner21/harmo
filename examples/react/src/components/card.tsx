import type { CSSProperties } from "react";
import { Button, Card, Tag } from "@harmo-ui/react";
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
    <Card variant="raised">
      <p>Refund not received for order 1042</p>
      <Tag>Billing</Tag>
    </Card>
  ),

  Ghost: () => (
    <nav aria-label="Settings">
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
  ),

  Padding: () => (
    <Card style={{ "--harmo-card-padding": "8px" } as CSSProperties}>
      <p>Last synced 5 minutes ago</p>
    </Card>
  ),

  "Links with icons": () => (
    <nav
      aria-label="Settings"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(18rem, 100%), 1fr))",
        gap: 16,
        inlineSize: "100%",
      }}
    >
      <Card
        variant="ghost"
        href="/settings/personal"
        icon={<UserIcon className="hicon" />}
        label="Personal"
        description="Your name, email address, language, and password."
      />
      <Card
        variant="ghost"
        href="/settings/notifications"
        icon={<MessagesIcon className="hicon" />}
        label="Notifications"
        description="How and when we tell you about new messages and tickets."
      />
      <Card
        variant="ghost"
        href="/settings/security"
        icon={<LockIcon className="hicon" />}
        label="Security"
        description="Two-step verification, and the devices signed in to your account."
      />
      <Card
        variant="ghost"
        href="/settings/developers"
        icon={<DevelopersIcon className="hicon" />}
        label="Developers"
        description="API keys and webhooks, to connect your own tools."
      />
    </nav>
  ),

  "Links with a chevron": () => (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", inlineSize: "100%", maxInlineSize: "24rem" }}>
      <li>
        <Card
          variant="ghost"
          href="/activate"
          style={{ "--harmo-card-padding": "12px" } as CSSProperties}
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
          style={{ "--harmo-card-padding": "12px" } as CSSProperties}
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
          style={{ "--harmo-card-padding": "12px" } as CSSProperties}
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
      style={{ inlineSize: "100%", maxInlineSize: "24rem" }}
      icon={<UserIcon className="hicon" />}
      label="الملف الشخصي"
      description="اسمك وبريدك الإلكتروني ولغتك وكلمة المرور."
      chevron
    />
  ),
};
