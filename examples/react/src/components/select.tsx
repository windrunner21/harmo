import { Button, Checkbox, Field, Input, Option, Select } from "@harmo/react";
import { useState, type FormEvent } from "react";

export const examples = {
  Default: () => (
    <Select label="Channel" name="channel" defaultValue="whatsapp">
      <Option value="whatsapp">WhatsApp</Option>
      <Option value="telegram">Telegram</Option>
      <Option value="viber">Viber</Option>
    </Select>
  ),

  Placeholder: () => (
    <Select
      label="Fallback channel"
      optional="Optional"
      description="Used when a message can't be delivered on the main channel."
      name="fallback"
      placeholder="Select a channel"
    >
      <Option value="email">Email</Option>
      <Option value="sms">SMS</Option>
    </Select>
  ),

  Multiple: () => (
    <Select
      multiple
      label="Message statuses"
      name="statuses"
      placeholder="Any status"
      defaultValue={["delivered", "read"]}
    >
      <Option value="delivered">Delivered</Option>
      <Option value="read">Read</Option>
      <Option value="failed">Failed</Option>
      <Option value="pending">Pending</Option>
    </Select>
  ),

  "Long value": () => (
    <Select label="Sender number" name="sender" defaultValue="support">
      <Option value="support">
        +41 44 7654321 · Customer support for Switzerland
      </Option>
      <Option value="sales">+44 20 7946 0000 · Sales</Option>
    </Select>
  ),

  Invalid: () => (
    <Select
      label="Template language"
      name="language"
      placeholder="Select a language"
      error="Choose a language for the template."
    >
      <Option value="en">English</Option>
      <Option value="es">Spanish</Option>
      <Option value="ar">Arabic</Option>
    </Select>
  ),

  Disabled: () => (
    <Select label="Region" name="region" defaultValue="europe" disabled>
      <Option value="europe">Europe</Option>
    </Select>
  ),

  Disabling: () => {
    const [reminding, setReminding] = useState(true);
    return (
      <>
        <Field orientation="horizontal" label="Send a reminder">
          <Checkbox
            name="reminder"
            checked={reminding}
            onChange={(event) => setReminding(event.target.checked)}
          />
        </Field>
        <Select
          label="Reminder channel"
          name="reminder-channel"
          defaultValue="sms"
          disabled={!reminding}
        >
          <Option value="sms">SMS</Option>
          <Option value="email">Email</Option>
        </Select>
      </>
    );
  },

  "In a form": () => {
    const [sent, setSent] = useState("Save to see what the form sends.");
    const save = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new URLSearchParams(
        [...new FormData(event.currentTarget)].map(([key, value]) => [
          key,
          String(value),
        ]),
      ).toString();
      setSent(data ? `Sends ${data}` : "Sends nothing");
    };

    return (
      <form
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={save}
      >
        <Select label="Channel" name="channel" defaultValue="whatsapp">
          <Option value="whatsapp">WhatsApp</Option>
          <Option value="telegram">Telegram</Option>
          <Option value="viber">Viber</Option>
        </Select>
        <Select
          multiple
          label="Notify me about"
          name="statuses"
          placeholder="No statuses"
          defaultValue={["failed"]}
        >
          <Option value="delivered">Delivered</Option>
          <Option value="read">Read</Option>
          <Option value="failed">Failed</Option>
        </Select>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit">Save</Button>
          <Button variant="secondary" type="reset">
            Reset
          </Button>
        </div>
        <output className="hdescription">{sent}</output>
      </form>
    );
  },

  "Next to an input": () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Input
        type="search"
        aria-label="Search messages"
        placeholder="Search messages"
      />
      <Select aria-label="Status" placeholder="Any status">
        <Option value="delivered">Delivered</Option>
        <Option value="failed">Failed</Option>
      </Select>
    </div>
  ),
};
