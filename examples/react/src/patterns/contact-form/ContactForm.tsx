"use client";

import { Button, Field, Input, TextArea } from "@harmo-ui/react";
import type { ReactNode } from "react";
import { emailError, textOf, type FormAction, type FormMessages } from "../form-action/formAction.ts";
import { useContactForm } from "./useContactForm.ts";

export type ContactFormMessages = FormMessages<"name" | "email" | "message", "name" | "email" | "message">;

export type ContactFormResult = ContactFormMessages | { step: "sent"; email: string } | string | undefined;

export interface ContactFormProps {
  action: FormAction<ContactFormResult>;
  sentIcon?: ReactNode;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const ContactForm = ({ action, sentIcon, titleAs: Title = "h2" }: ContactFormProps) => {
  const { errors, failure, pending, sent, thanks, frame, form, forget, refill } = useContactForm({
    action,
    fields: ["name", "email", "message"],
    check: (data) => ({
      name: textOf(data, "name") ? undefined : "Enter your name.",
      email: emailError(textOf(data, "email")),
      message: textOf(data, "message") ? undefined : "Enter your message.",
    }),
  });

  return (
    <div className="hcard hcontact-form" data-variant="raised" {...frame}>
      <form className="hcontact-form-form" noValidate hidden={sent !== null} {...form}>
        <div className="hcontact-form-header">
          <Title className="hcontact-form-title">Send us a message</Title>
          <p className="hcontact-form-description">We read every message, and reply within a day.</p>
        </div>
        <div className="hcontact-form-fields">
          <div className="hcontact-form-row">
            <Field label="Name" error={errors.name ?? ""}>
              <Input
                key={refill.key}
                name="name"
                autoComplete="name"
                placeholder="Sam Lee"
                defaultValue={refill.values.name}
                onChange={() => forget("name")}
              />
            </Field>
            <Field label="Email" error={errors.email ?? ""}>
              <Input
                key={refill.key}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                defaultValue={refill.values.email}
                onChange={() => forget("email")}
              />
            </Field>
          </div>
          <Field label="Message" error={errors.message ?? ""}>
            <TextArea
              key={refill.key}
              className="hcontact-form-message"
              name="message"
              maxLength={1000}
              placeholder="Tell us what you need, and anything that would help us answer."
              defaultValue={refill.values.message}
              onChange={() => forget("message")}
            />
          </Field>
        </div>
        <div className="hcontact-form-submit">
          <p className="herror" aria-live="polite">
            {failure}
          </p>
          <Button type="submit" loading={pending}>
            Send message
          </Button>
        </div>
      </form>
      <div className="hempty-state" hidden={sent === null}>
        {sentIcon && (
          <div className="hempty-state-icon" aria-hidden="true">
            {sentIcon}
          </div>
        )}
        <Title className="hempty-state-title" ref={thanks} tabIndex={-1}>
          Message sent
        </Title>
        <p className="hempty-state-description">
          Thanks for writing. We'll reply to <strong>{sent?.email}</strong> within a day.
        </p>
      </div>
    </div>
  );
};
