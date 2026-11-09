import { Button, DatePicker } from "@harmo-ui/react";
import * as chrono from "chrono-node";
import { useState } from "react";

export const examples = {
  Default: () => (
    <DatePicker
      label="Due date"
      name="due"
      locale="en-US"
      placeholder="mm/dd/yyyy"
      calendarLabel="Choose a date"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      defaultValue="2026-11-18"
    />
  ),

  "With a minimum and maximum": () => (
    <DatePicker
      label="Start date"
      name="start"
      locale="en-US"
      placeholder="mm/dd/yyyy"
      calendarLabel="Choose a date"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      min="2026-11-05"
      max="2026-12-15"
    />
  ),

  "With an error": () => {
    const [invalid, setInvalid] = useState(false);

    return (
      <DatePicker
        label="Renewal date"
        name="renewal"
        locale="en-US"
        placeholder="mm/dd/yyyy"
        calendarLabel="Choose a date"
        previousLabel="Previous month"
        nextLabel="Next month"
        today="2026-11-09"
        onInvalidChange={setInvalid}
        error={invalid ? "Enter a date as mm/dd/yyyy." : undefined}
      />
    );
  },

  "Typed in words": () => (
    <DatePicker
      label="Send on"
      name="send"
      locale="en-US"
      placeholder="Tomorrow, or in 2 days"
      calendarLabel="Choose a date"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      natural={chrono}
    />
  ),

  "With a time": () => (
    <DatePicker
      label="Send at"
      name="send-at"
      locale="en-US"
      placeholder="Tomorrow at 2:00 PM"
      calendarLabel="Choose a date"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      natural={chrono}
      time
      defaultValue="2026-11-18T14:00"
    />
  ),

  "In a form": () => {
    const [sent, setSent] = useState<string | null>(null);

    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSent(String(new FormData(event.currentTarget).get("due-form")));
        }}
      >
        <DatePicker
          label="Due date"
          name="due-form"
          locale="en-US"
          placeholder="mm/dd/yyyy"
          calendarLabel="Choose a date"
          previousLabel="Previous month"
          nextLabel="Next month"
          today="2026-11-09"
          defaultValue="2026-11-18"
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit">Save</Button>
          <Button type="reset" variant="secondary">
            Reset
          </Button>
        </div>
        <p role="status" hidden={sent === null}>
          {sent !== null && `Sent ${sent}`}
        </p>
      </form>
    );
  },

  Disabled: () => (
    <DatePicker
      label="Due date"
      name="locked"
      locale="en-US"
      calendarLabel="Choose a date"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      defaultValue="2026-11-18"
      disabled
    />
  ),

  "Right to left": () => (
    <DatePicker
      label="تاريخ الاستحقاق"
      name="due-ar"
      locale="ar-EG"
      calendarLabel="اختر تاريخًا"
      previousLabel="الشهر السابق"
      nextLabel="الشهر التالي"
      today="2026-11-09"
      defaultValue="2026-11-18"
    />
  ),
};
