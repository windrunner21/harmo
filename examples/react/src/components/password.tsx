import { Checkbox, Field, PasswordInput, type PasswordStrength } from "@harmo/react";
import { useState } from "react";

export const examples = {
  "Current password": () => (
    <PasswordInput
      label="Password"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      autoComplete="current-password"
    />
  ),

  "New password": () => {
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

    return (
      <PasswordInput
        label="New password"
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
        autoComplete="new-password"
        strength={strength}
        strengthLabel="Password strength"
      />
    );
  },

  Disabled: () => (
    <PasswordInput
      label="API secret, managed by your administrator"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      defaultValue="sk_live_51Hc2kq"
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
};
