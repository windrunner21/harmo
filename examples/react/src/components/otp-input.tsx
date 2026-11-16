import { Button, OtpInput, Status } from "@harmo-ui/react";
import { useRef, useState } from "react";

export const examples = {
  Default: () => <OtpInput label="Verification code" name="code" />,

  "Four digits": () => <OtpInput label="Confirmation code" name="confirmation-code" length={4} />,

  Grouped: () => <OtpInput label="Sign-in code" name="sign-in-code" groups={[3, 3]} />,

  "Letters and digits": () => (
    <OtpInput label="Recovery code" name="recovery-code" length={8} characters="alphanumeric" groups={[4, 4]} />
  ),

  "With a description and an error": () => (
    <OtpInput
      label="Verification code"
      name="checked-code"
      description="Enter the 6-digit code we sent to your phone."
      error="That code has expired. Send a new one."
      defaultValue="482913"
    />
  ),

  "Read-only and disabled": () => (
    <>
      <OtpInput label="Pairing code" name="pairing-code" defaultValue="731904" readOnly />
      <OtpInput label="Verification code" name="disabled-code" defaultValue="482913" disabled />
    </>
  ),

  "In a form": () => {
    const form = useRef<HTMLFormElement>(null);
    const [sent, setSent] = useState("");
    return (
      <form
        ref={form}
        method="post"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSent(String(new FormData(event.currentTarget).get("code")));
        }}
        onReset={() => setSent("")}
      >
        <OtpInput label="Verification code" name="code" onComplete={() => form.current?.requestSubmit()} />
        <Status status={sent ? "success" : undefined}>{sent ? `Sent ${sent}` : "Not sent yet"}</Status>
        <Button variant="secondary" type="reset" style={{ alignSelf: "flex-start" }}>
          Reset
        </Button>
      </form>
    );
  },
};
