import type { CSSProperties } from "react";
import { Field, TextArea } from "@harmo-ui/react";

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
};
