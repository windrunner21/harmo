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
import { useAttachments, type Upload } from "../attachments/attachments.ts";
import { useContactForm } from "./useContactForm.ts";

export type OrderHelpFormMessages = FormMessages<
  "order" | "email" | "problem" | "photos" | "message",
  "order" | "email" | "problem" | "message"
>;

export type OrderHelpFormResult =
  | OrderHelpFormMessages
  | { step: "sent"; order: string; email: string }
  | string
  | undefined;

export interface OrderHelpFormProps {
  action: FormAction<OrderHelpFormResult>;
  upload?: Upload;
  sentIcon?: ReactNode;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const most = 5;
const largest = 10_000_000;

export const OrderHelpForm = ({ action, upload, sentIcon, titleAs: Title = "h2" }: OrderHelpFormProps) => {
  const photos = useAttachments({ upload, preview: true });
  const picker = useRef<HTMLInputElement>(null);
  const { errors, failure, pending, sent, thanks, frame, form, forget, refill } = useContactForm({
    action,
    fields: ["order", "email", "problem", "photos"],
    check: (data) => ({
      order: textOf(data, "order") ? undefined : "Enter your order number.",
      email: emailError(textOf(data, "email")),
      problem: textOf(data, "problem") ? undefined : "Choose what's wrong with your order.",
    }),
    files: { name: "photos", entries: photos.entries, settle: photos.settle },
  });

  const attach = (files: File[]) => {
    photos.add(files);
    forget("photos");
  };

  const remove = (item: FileListItem) => {
    if (photos.items.length === 1) picker.current?.focus();
    photos.remove(item);
    forget("photos");
  };

  const retry = (item: FileListItem) => {
    photos.retry(item);
    forget("photos");
  };

  return (
    <div className="hcard hcontact-form" data-variant="raised" {...frame}>
      <form className="hcontact-form-form" noValidate hidden={sent !== null} {...form}>
        <div className="hcontact-form-header">
          <Title className="hcontact-form-title">Get help with an order</Title>
          <p className="hcontact-form-description">
            Something wrong with what arrived? Tell us, and we'll put it right.
          </p>
        </div>
        <div className="hcontact-form-fields">
          <div className="hcontact-form-row">
            <Field label="Order number" error={errors.order ?? ""}>
              <Input
                key={refill.key}
                name="order"
                placeholder="1042"
                defaultValue={refill.values.order}
                onChange={() => forget("order")}
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
          <Select
            key={refill.key}
            label="What's wrong?"
            name="problem"
            placeholder="Choose what's wrong"
            defaultValue={refill.values.problem}
            error={errors.problem ?? ""}
            onValueChange={() => forget("problem")}
          >
            <Option value="damaged">It arrived damaged</Option>
            <Option value="missing">An item is missing</Option>
            <Option value="wrong-item">I got the wrong item</Option>
            <Option value="return">I'd like to return it</Option>
          </Select>
          <FileInput
            ref={picker}
            name="photos"
            label="Photos"
            optional="Optional"
            description="Up to 5 photos of the damage, or of what arrived, 10 MB each."
            multiple
            hidden={!photos.shown}
            accept="image/*"
            variant="strip"
            dropLabel="or drop them here"
            chooseLabel="Add photos"
            validate={(file, accepted) =>
              photos.items.length + accepted >= most
                ? `Add up to ${most} photos.`
                : !file.type.startsWith("image/")
                  ? `${file.name} isn't a picture.`
                  : file.size > largest
                    ? `${file.name} is over 10 MB.`
                    : null
            }
            error={errors.photos ?? ""}
            onFilesAdd={attach}
          />
          <FileList
            aria-label="Photos"
            layout="grid"
            files={photos.items}
            removeLabel={(file) => `Remove ${file.name}`}
            onRemove={remove}
            retryLabel="Try again"
            onRetry={retry}
          />
          <Field label="Message" optional="Optional">
            <TextArea
              key={refill.key}
              className="hcontact-form-message"
              name="message"
              maxLength={1000}
              placeholder="Tell us anything else that would help us put it right."
              defaultValue={refill.values.message}
            />
          </Field>
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
          We'll look into order <strong>{sent?.order}</strong> and reply to <strong>{sent?.email}</strong> within
          a day.
        </p>
      </div>
    </div>
  );
};
