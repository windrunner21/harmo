"use client";

import { Button, Field, Footer, FooterGroup, Input, type FooterLink } from "@harmo-ui/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { emailError, textOf } from "../form-action/formAction.ts";
import type { SiteFooterGroup } from "./SiteFooter.tsx";

export interface NewsletterFooterProps {
  logo: ReactNode;
  homeHref?: string;
  title: ReactNode;
  description?: ReactNode;
  onSubscribe: (email: string) => Promise<string | void>;
  groups: SiteFooterGroup[];
  copyright: ReactNode;
  links: FooterLink[];
}

export const NewsletterFooter = ({
  logo,
  homeHref = "/",
  title,
  description,
  onSubscribe,
  groups,
  copyright,
  links,
}: NewsletterFooterProps) => {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [subscribed, setSubscribed] = useState("");

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const field = form.elements.namedItem("email") as HTMLInputElement | null;
    const email = textOf(new FormData(form), "email");
    const invalid = emailError(email);
    setSubscribed("");
    if (invalid) {
      setError(invalid);
      field?.focus();
      return;
    }
    setError("");
    setSending(true);
    let failed: string | void;
    try {
      failed = await onSubscribe(email);
    } catch {
      failed = "Something went wrong. Try again.";
    } finally {
      setSending(false);
    }
    if (failed) {
      setError(failed);
      field?.focus();
      return;
    }
    form.reset();
    setSubscribed(`Subscribed. The next one goes to ${email}.`);
  };

  return (
    <Footer
      className="hnewsletter-footer"
      aria-label="Footer"
      brand={
        <>
          <a href={homeHref}>{logo}</a>
          <div className="hnewsletter-footer-signup">
            <p className="hnewsletter-footer-title">{title}</p>
            {description && <p>{description}</p>}
            <form className="hnewsletter-footer-form" noValidate onSubmit={subscribe}>
              <Field label="Email" error={error}>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  onChange={() => setError("")}
                />
              </Field>
              <Button type="submit" loading={sending}>
                Subscribe
              </Button>
            </form>
            <p className="hnewsletter-footer-status" role="status">
              {subscribed}
            </p>
          </div>
        </>
      }
      bottom={
        <>
          <p>{copyright}</p>
          <nav aria-label="Legal">
            <ul className="hfooter-bottom-links">
              {links.map((link) => (
                <li key={link.href}>
                  <a className="hfooter-link" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      }
    >
      {groups.map((group) => (
        <FooterGroup key={group.label} label={group.label} links={group.links} />
      ))}
    </Footer>
  );
};
