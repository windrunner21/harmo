"use client";

import { Button, Field, Footer, FooterGroup, Input, type FooterLink } from "@harmo-ui/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  emailError,
  messagesOf,
  stepOf,
  textOf,
  useFormAction,
  useOutcome,
  type FormAction,
  type FormMessages,
  type Outcome,
} from "../form-action/formAction.ts";
import type { SiteFooterGroup } from "./SiteFooter.tsx";

export type NewsletterFooterResult =
  | FormMessages<"email", "email">
  | { step: "subscribed"; email: string }
  | string
  | undefined;

export interface NewsletterFooterProps {
  logo: ReactNode;
  homeHref?: string;
  title: ReactNode;
  description?: ReactNode;
  action: FormAction<NewsletterFooterResult>;
  groups: SiteFooterGroup[];
  copyright: ReactNode;
  links: FooterLink[];
}

type Answer = Pick<Outcome<NewsletterFooterResult>, "result" | "failed">;

const subscribedOf = (answer: Answer) => {
  const step = answer.failed ? undefined : stepOf<{ step: "subscribed"; email: string }>(answer.result);
  return step?.step === "subscribed" ? step.email : "";
};

const errorOf = (answer: Answer) => {
  const messages = messagesOf(answer, ["email"], "form");
  return messages.email ?? messages.form ?? "";
};

export const NewsletterFooter = ({
  logo,
  homeHref = "/",
  title,
  description,
  action,
  groups,
  copyright,
  links,
}: NewsletterFooterProps) => {
  const { outcome, formAction, pending, run, refill } = useFormAction(action);
  const [error, setError] = useState(() => errorOf(outcome));
  const [subscribed, setSubscribed] = useState(() => subscribedOf(outcome));
  const form = useRef<HTMLFormElement>(null);
  const answered = useRef<"error" | "subscribed">(undefined);

  useOutcome(outcome, (next) => {
    const email = subscribedOf(next);
    const message = email ? "" : errorOf(next);
    setSubscribed(email);
    setError(message);
    answered.current = email ? "subscribed" : message ? "error" : undefined;
  });

  useEffect(() => {
    const done = answered.current;
    answered.current = undefined;
    const element = form.current;
    if (done === "subscribed") element?.reset();
    if (done === "error") element?.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
  }, [outcome]);

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const element = event.currentTarget;
    const data = new FormData(element);
    const invalid = emailError(textOf(data, "email"));
    setSubscribed("");
    if (invalid) {
      setError(invalid);
      element.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
      return;
    }
    setError("");
    run(data);
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
            <form ref={form} className="hnewsletter-footer-form" noValidate action={formAction} onSubmit={subscribe}>
              <Field label="Email" error={error}>
                <Input
                  key={refill.key}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  defaultValue={refill.values.email}
                  readOnly={pending}
                  onChange={() => setError("")}
                />
              </Field>
              <Button type="submit" loading={pending}>
                Subscribe
              </Button>
            </form>
            <p className="hnewsletter-footer-status" role="status">
              {subscribed && `Subscribed. The next one goes to ${subscribed}.`}
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
