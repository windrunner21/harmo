"use client";

import { Button, Link } from "@harmo-ui/react";
import type { ReactNode } from "react";

export interface ContactOptionsProps {
  salesHref: string;
  supportEmail: string;
  helpHref: string;
  salesIcon?: ReactNode;
  supportIcon?: ReactNode;
  helpIcon?: ReactNode;
}

const tile = (icon: ReactNode) =>
  icon && (
    <span className="hcard-icon" aria-hidden="true">
      {icon}
    </span>
  );

export const ContactOptions = ({
  salesHref,
  supportEmail,
  helpHref,
  salesIcon,
  supportIcon,
  helpIcon,
}: ContactOptionsProps) => (
  <ul className="hcontact-options" role="list">
    <li className="hcard hcontact-options-item" data-variant="raised">
      {tile(salesIcon)}
      <h2 className="hcard-title">Sales</h2>
      <p className="hcard-description">
        We'd love to talk about how we can work together, and find the plan that fits your team.
      </p>
      <Button className="hcontact-options-link" variant="secondary" href={salesHref}>
        Contact sales
      </Button>
    </li>
    <li className="hcard hcontact-options-item" data-variant="raised">
      {tile(supportIcon)}
      <h2 className="hcard-title">Support</h2>
      <p className="hcard-description">
        For help with your account, billing, or anything else, write to{" "}
        <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>.
      </p>
      <Button className="hcontact-options-link" variant="secondary" href={`mailto:${supportEmail}`}>
        Email support
      </Button>
    </li>
    <li className="hcard hcontact-options-item" data-variant="raised">
      {tile(helpIcon)}
      <h2 className="hcard-title">Help center</h2>
      <p className="hcard-description">Guides and answers to common questions, whenever you need them.</p>
      <Button className="hcontact-options-link" variant="secondary" href={helpHref}>
        Visit the help center
      </Button>
    </li>
  </ul>
);
