import { Meter } from "@harmo-ui/react";

export const examples = {
  "Password strength": () => (
    <>
      <Meter
        value={1}
        max={3}
        status="error"
        aria-label="Password strength"
        aria-valuetext="Too weak"
      />
      <Meter
        value={2}
        max={3}
        aria-label="Password strength"
        aria-valuetext="Medium"
      />
      <Meter
        value={3}
        max={3}
        status="success"
        aria-label="Password strength"
        aria-valuetext="Strong"
      />
    </>
  ),

  "Other scales": () => (
    <>
      <Meter
        value={3}
        max={5}
        status="info"
        aria-label="Profile completeness"
        aria-valuetext="3 of 5 steps"
      />
      <Meter
        value={1}
        max={4}
        status="warning"
        aria-label="Message quality"
        aria-valuetext="Low"
      />
    </>
  ),
};
