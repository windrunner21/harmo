import type { CSSProperties } from "react";
import { Button, Field, TextArea } from "@harmo-ui/react";

export const examples = {
  "With a counter": () => (
    <Field label="Message">
      <TextArea
        name="message"
        maxLength={500}
        placeholder="Hello, your order has shipped…"
      />
    </Field>
  ),

  "Counting down": () => (
    <Field label="Text message">
      <TextArea
        name="sms"
        maxLength={160}
        formatCount={(length, maxLength) => `${maxLength - length} characters left`}
      />
    </Field>
  ),

  "Long text": () => (
    <Field label="Saved reply">
      <TextArea
        name="reply"
        defaultValue="Thanks for reaching out! Your order left our warehouse this morning and should arrive within three working days. You can follow it with the tracking link in your confirmation email, and reply here if anything looks off."
      />
    </Field>
  ),

  "Custom maximum height": () => (
    <Field label="Email footer">
      <TextArea
        name="footer-text"
        style={{ "--htextarea-max-height": "200px" } as CSSProperties}
        defaultValue="Acme Support · Mon–Fri, 9:00–18:00"
      />
    </Field>
  ),

  Invalid: () => (
    <Field
      label="Internal note"
      optional="Optional"
      error="Remove card numbers from notes."
    >
      <TextArea
        name="internal-note"
        defaultValue="Customer paid with card 4242 4242 4242 4242."
      />
    </Field>
  ),

  "Read-only and disabled": () => (
    <>
      <Field label="Original message">
        <TextArea
          name="original-message"
          defaultValue="Where is my order?"
          readOnly
        />
      </Field>
      <Field label="Signature">
        <TextArea name="signature" defaultValue="The Acme team" disabled />
      </Field>
    </>
  ),

  "With highlights": () => (
    <Field label="Message">
      <TextArea
        name="template"
        defaultValue={"Hello {{1}},\n\nYour order {{2}} has shipped."}
        highlight={/\{\{\d+\}\}/g}
      />
    </Field>
  ),

  "In a form": () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Reply">
        <TextArea
          name="reply"
          maxLength={500}
          defaultValue="Hello, your order has shipped."
        />
      </Field>
      <Button variant="secondary" type="reset" style={{ alignSelf: "flex-start" }}>
        Reset
      </Button>
    </form>
  ),
};
