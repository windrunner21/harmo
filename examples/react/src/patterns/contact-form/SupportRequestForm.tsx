"use client";

import {
  Button,
  Field,
  FileInput,
  FileList,
  Input,
  Option,
  Select,
  TextArea,
  type FileListItem,
} from "@harmo-ui/react";
import { useRef, type ReactNode } from "react";
import { emailError, textOf, type FormAction, type FormMessages } from "../form-action/formAction.ts";
import { useAttachments, type Upload } from "./attachments.ts";
import { useContactForm } from "./useContactForm.ts";

export type SupportRequestFormMessages = FormMessages<
  "email" | "topic" | "subject" | "message" | "attachments",
  "email" | "topic" | "subject" | "message"
>;

export type SupportRequestFormResult =
  | SupportRequestFormMessages
  | { step: "sent"; email: string }
  | string
  | undefined;

export interface SupportRequestFormProps {
  action: FormAction<SupportRequestFormResult>;
  upload?: Upload;
  sentIcon?: ReactNode;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const most = 5;
const largest = 10_000_000;

export const SupportRequestForm = ({ action, upload, sentIcon, titleAs: Title = "h2" }: SupportRequestFormProps) => {
  const attachments = useAttachments({ upload });
  const picker = useRef<HTMLInputElement>(null);
  const { errors, failure, pending, sent, thanks, frame, form, forget, refill } = useContactForm({
    action,
    fields: ["email", "topic", "subject", "message", "attachments"],
    check: (data) => ({
      email: emailError(textOf(data, "email")),
      topic: textOf(data, "topic") ? undefined : "Choose a topic.",
      subject: textOf(data, "subject") ? undefined : "Enter a subject.",
      message: textOf(data, "message") ? undefined : "Enter your message.",
    }),
    files: { name: "attachments", entries: attachments.entries, settle: attachments.settle },
  });

  const attach = (files: File[]) => {
    attachments.add(files);
    forget("attachments");
  };

  const remove = (item: FileListItem) => {
    if (attachments.items.length === 1) picker.current?.focus();
    attachments.remove(item);
    forget("attachments");
  };

  const retry = (item: FileListItem) => {
    attachments.retry(item);
    forget("attachments");
  };

  return (
    <div className="hcard hcontact-form" data-variant="raised" {...frame}>
      <form className="hcontact-form-form" noValidate hidden={sent !== null} {...form}>
        <div className="hcontact-form-header">
          <Title className="hcontact-form-title">Contact support</Title>
          <p className="hcontact-form-description">
            Tell us what's happening, and we'll reply by email, usually within a day.
          </p>
        </div>
        <div className="hcontact-form-fields">
          <div className="hcontact-form-row">
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
            <Select
              key={refill.key}
              label="Topic"
              name="topic"
              placeholder="Choose a topic"
              defaultValue={refill.values.topic}
              error={errors.topic ?? ""}
              onValueChange={() => forget("topic")}
            >
              <Option value="account">Account</Option>
              <Option value="billing">Billing</Option>
              <Option value="technical">A technical problem</Option>
              <Option value="other">Something else</Option>
            </Select>
          </div>
          <Field label="Subject" error={errors.subject ?? ""}>
            <Input
              key={refill.key}
              name="subject"
              placeholder="I can't sign in on my phone"
              defaultValue={refill.values.subject}
              onChange={() => forget("subject")}
            />
          </Field>
          <Field label="Message" error={errors.message ?? ""}>
            <TextArea
              key={refill.key}
              className="hcontact-form-message"
              name="message"
              maxLength={2000}
              placeholder="Tell us what happened, what you expected, and the steps that led to it."
              defaultValue={refill.values.message}
              onChange={() => forget("message")}
            />
          </Field>
          <FileInput
            ref={picker}
            name="attachments"
            label="Attachments"
            optional="Optional"
            description="Up to 5 screenshots or files that show the problem, 10 MB each."
            multiple
            hidden={!attachments.shown}
            variant="strip"
            dropLabel="or drop them here"
            chooseLabel="Add files"
            validate={(file, accepted) =>
              attachments.items.length + accepted >= most
                ? `Add up to ${most} files.`
                : file.size > largest
                  ? `${file.name} is over 10 MB.`
                  : null
            }
            error={errors.attachments ?? ""}
            onFilesAdd={attach}
          />
          <FileList
            aria-label="Attachments"
            files={attachments.items}
            removeLabel={(file) => `Remove ${file.name}`}
            onRemove={remove}
            retryLabel="Try again"
            onRetry={retry}
          />
        </div>
        <div className="hcontact-form-submit">
          <p className="herror" aria-live="polite">
            {failure}
          </p>
          <Button type="submit" loading={pending}>
            Send request
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
          Request sent
        </Title>
        <p className="hempty-state-description">
          We'll reply to <strong>{sent?.email}</strong>, usually within a day.
        </p>
      </div>
    </div>
  );
};
