import { Checkbox, Field, Input } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  "Label and control": () => (
    <Field label="Full name">
      <Input name="full-name" type="text" autoComplete="name" required />
    </Field>
  ),

  Optional: () => (
    <Field label="Company" optional="Optional">
      <Input
        name="company"
        type="text"
        autoComplete="organization"
        placeholder="Acme Inc."
      />
    </Field>
  ),

  "With a description": () => (
    <Field
      label="Work email"
      description="We'll send sign-in links to this address."
    >
      <Input name="work-email" type="email" autoComplete="email" required />
    </Field>
  ),

  "With an error": () => (
    <Field
      label="Email address"
      optional="Optional"
      description="We'll send your receipt here."
      error="Enter a valid email address or leave this field empty."
    >
      <Input
        name="receipt-email"
        type="email"
        autoComplete="email"
        defaultValue="not-an-email"
      />
    </Field>
  ),

  Validating: () => {
    const [error, setError] = useState<string>();
    const validate = (code: string) =>
      setError(
        ["", "SPRING25"].includes(code.trim().toUpperCase())
          ? undefined
          : "This coupon code is not valid.",
      );

    return (
      <Field label="Coupon code" error={error}>
        <Input
          name="coupon"
          type="text"
          onBlur={(event) => validate(event.target.value)}
        />
      </Field>
    );
  },

  Horizontal: () => (
    <Field
      orientation="horizontal"
      label="Send a weekly summary"
      description="You can change this at any time."
    >
      <Checkbox name="summary" />
    </Field>
  ),
};
