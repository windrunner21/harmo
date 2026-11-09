import { Button, DatePicker, TimePicker } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => (
    <TimePicker
      label="Start time"
      name="start"
      locale="en-US"
      hourLabel="Hour"
      minuteLabel="Minute"
      periodLabel="AM or PM"
      defaultValue="14:30"
    />
  ),

  "On a 24-hour clock": () => (
    <TimePicker
      label="Opens at"
      name="opens"
      locale="en-GB"
      hourLabel="Hour"
      minuteLabel="Minute"
      periodLabel="AM or PM"
      defaultValue="09:00"
    />
  ),

  "Every 5 minutes": () => (
    <TimePicker
      label="Closes at"
      name="closes"
      locale="en-GB"
      hourLabel="Hour"
      minuteLabel="Minute"
      periodLabel="AM or PM"
      minuteStep={5}
      defaultValue="17:07"
    />
  ),

  "With nothing chosen": () => (
    <TimePicker
      label="Reminder"
      name="reminder"
      locale="en-US"
      hourLabel="Hour"
      minuteLabel="Minute"
      periodLabel="AM or PM"
      placeholder="Choose a time"
    />
  ),

  "Beside a date": () => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 8 }}>
      <DatePicker
        label="Send on"
        name="send-date"
        locale="en-US"
        placeholder="mm/dd/yyyy"
        calendarLabel="Choose a date"
        previousLabel="Previous month"
        nextLabel="Next month"
        today="2026-11-09"
        defaultValue="2026-11-18"
      />
      <TimePicker
        label="At"
        name="send-time"
        locale="en-US"
        hourLabel="Hour"
        minuteLabel="Minute"
        periodLabel="AM or PM"
        defaultValue="14:00"
      />
    </div>
  ),

  "In a form": () => {
    const [sent, setSent] = useState<string | null>(null);

    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSent(String(new FormData(event.currentTarget).get("start-form")));
        }}
      >
        <TimePicker
          label="Start time"
          name="start-form"
          locale="en-US"
          hourLabel="Hour"
          minuteLabel="Minute"
          periodLabel="AM or PM"
          defaultValue="14:30"
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
    <TimePicker
      label="Start time"
      name="locked"
      locale="en-US"
      hourLabel="Hour"
      minuteLabel="Minute"
      periodLabel="AM or PM"
      defaultValue="14:30"
      disabled
    />
  ),

  "Right to left": () => (
    <TimePicker
      label="وقت البدء"
      name="start-ar"
      locale="ar-EG"
      hourLabel="الساعة"
      minuteLabel="الدقيقة"
      periodLabel="صباحًا أو مساءً"
      defaultValue="14:30"
    />
  ),
};
