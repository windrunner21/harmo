import { Button, Calendar } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => (
    <Calendar
      locale="en-US"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      defaultValue="2026-11-18"
    />
  ),

  "With a minimum and maximum": () => (
    <Calendar
      locale="en-US"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      defaultMonth="2026-11"
      min="2026-11-05"
      max="2026-12-15"
    />
  ),

  "Set by the app": () => {
    const [date, setDate] = useState("2026-11-18");

    return (
      <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <Calendar
          locale="en-US"
          previousLabel="Previous month"
          nextLabel="Next month"
          today="2026-11-09"
          value={date}
          onValueChange={setDate}
        />
        <Button variant="secondary" onClick={() => setDate("2027-01-15")}>
          Choose January 15, 2027
        </Button>
      </div>
    );
  },

  "A week starting on Monday": () => (
    <Calendar
      locale="en-GB"
      previousLabel="Previous month"
      nextLabel="Next month"
      today="2026-11-09"
      defaultMonth="2026-02"
    />
  ),

  "Right to left": () => (
    <Calendar
      locale="ar-EG"
      previousLabel="الشهر السابق"
      nextLabel="الشهر التالي"
      today="2026-11-09"
      defaultValue="2026-11-18"
    />
  ),
};
