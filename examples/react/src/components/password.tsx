import { PasswordInput, type PasswordStrength } from "@harmo/react";

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
};
