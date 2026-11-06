import type { CSSProperties } from "react";
import { Button, Card, Tag } from "@harmo-ui/react";

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
};
