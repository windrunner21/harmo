import { Button, Field, Input } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <>
      <Field label="Company">
        <Input
          name="company"
          type="text"
          autoComplete="organization"
          placeholder="Acme Inc."
        />
      </Field>
      <Field label="Full name">
        <Input
          name="full-name"
          type="text"
          autoComplete="name"
          defaultValue="Jane Smith"
        />
      </Field>
    </>
  ),

  Types: () => (
    <>
      <Field label="Work email">
        <Input name="work-email" type="email" autoComplete="email" />
      </Field>
      <Field label="Phone number">
        <Input name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label="Website">
        <Input
          name="website"
          type="url"
          autoComplete="url"
          placeholder="https://"
        />
      </Field>
      <Field label="Search contacts">
        <Input name="contact-search" type="search" />
      </Field>
    </>
  ),

  Invalid: () => (
    <Field label="Billing email" error="Enter a valid email address.">
      <Input
        name="billing-email"
        type="email"
        autoComplete="email"
        defaultValue="not-an-email"
      />
    </Field>
  ),

  "Read-only and disabled": () => (
    <>
      <Field label="Account ID">
        <Input name="account-id" type="text" defaultValue="ACC-20391" readOnly />
      </Field>
      <Field label="Sender name">
        <Input
          name="sender-name"
          type="text"
          defaultValue="Acme Support"
          disabled
        />
      </Field>
      <Field label="Sender ID">
        <Input
          name="sender-id"
          type="text"
          placeholder="Not available in your region"
          disabled
        />
      </Field>
    </>
  ),

  "Next to a button": () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Input
        type="search"
        aria-label="Search conversations"
        placeholder="Search conversations"
      />
      <Button variant="secondary">Search</Button>
    </div>
  ),

  "With highlights": () => (
    <Field label="Subject">
      <Input
        name="subject"
        defaultValue="Hello {{1}}, your order {{2}} has shipped"
        highlight={/\{\{\d+\}\}/g}
      />
    </Field>
  ),
};
