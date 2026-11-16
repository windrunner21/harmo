import { Button, Checkbox, Field, Link, PasswordInput, type PasswordStrength } from "@harmo-ui/react";
import { useState } from "react";

const strength = (password: string): PasswordStrength => {
  if (password.length < 10) {
    return {
      level: 1,
      word: "Too weak",
      hint: "Passwords need to be at least 10 characters. Include multiple words and phrases to make it more secure.",
      status: "error",
    };
  }
  const kinds = [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*(),.?":{}|<>]/];
  return kinds.every((kind) => kind.test(password))
    ? { level: 3, word: "Strong", status: "success" }
    : {
        level: 2,
        word: "Medium",
        hint: "Include multiple words and phrases to make it more secure.",
      };
};

export const examples = {
  "Current password": () => (
    <PasswordInput
      label="Password"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      autoComplete="current-password"
    />
  ),

  "With a link beside the label": () => (
    <PasswordInput
      label="Password"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      autoComplete="current-password"
      labelAccessory={
        <Link href="/reset-password" className="hfield-label-end">
          Forgot your password?
        </Link>
      }
    />
  ),

  "New password": () => (
    <PasswordInput
      label="New password"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      autoComplete="new-password"
      strength={strength}
      strengthLabel="Password strength"
    />
  ),

  "With its strength and a link": () => (
    <PasswordInput
      label="New password"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      autoComplete="new-password"
      strength={strength}
      strengthLabel="Password strength"
      labelAccessory={
        <Link href="/password-rules" className="hfield-label-end">
          Password rules
        </Link>
      }
    />
  ),

  "With an error": () => (
    <PasswordInput
      label="New password"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      autoComplete="new-password"
      strength={strength}
      strengthLabel="Password strength"
      error="This password has appeared in a data breach. Choose another."
    />
  ),

  Disabled: () => (
    <PasswordInput
      label="API secret, managed by your administrator"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      defaultValue="example-api-secret"
      disabled
    />
  ),

  Disabling: () => {
    const [protecting, setProtecting] = useState(true);
    return (
      <>
        <Field orientation="horizontal" label="Protect the export with a password">
          <Checkbox
            name="export-protect"
            checked={protecting}
            onChange={(event) => setProtecting(event.target.checked)}
          />
        </Field>
        <PasswordInput
          label="Export password"
          showPasswordLabel="Show password"
          hidePasswordLabel="Hide password"
          autoComplete="new-password"
          disabled={!protecting}
        />
      </>
    );
  },

  "In a form": () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PasswordInput
        label="New password"
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
        autoComplete="new-password"
        strength={strength}
        strengthLabel="Password strength"
      />
      <Button variant="secondary" type="reset" style={{ alignSelf: "flex-start" }}>
        Reset
      </Button>
    </form>
  ),
};
