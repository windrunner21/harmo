import { Button, Dialog } from "@harmo-ui/react";
import { AppleIcon, GitHubIcon, GoogleIcon } from "../app-icons.tsx";
import { AccountForms } from "../patterns/account-forms/AccountForms.tsx";
import type { ResetPasswordFormResult } from "../patterns/reset-password/ResetPasswordForm.tsx";
import type { SignInFormResult } from "../patterns/sign-in-form/SignInForm.tsx";
import type { SignUpFormResult } from "../patterns/sign-up-form/SignUpForm.tsx";

// Stand in for your app's actions, which answer after a moment, as the three
// forms' own examples do, and keep nothing of what was typed: the password
// "harmo" signs in, but not yet as new@example.com, which hasn't confirmed
// its email; sam@example.com already has an account, and "Password123!" has
// appeared in a data breach; and a link goes to any address but one at
// example.org, or at gmial.com, which can't receive email; and each fails for
// error@example.com, as a request that can't reach the server does. A
// message gives back what was typed, but the password, as `values`.
const answer = <Result,>(data: FormData, result: () => Result) =>
  new Promise<Result>((resolve, reject) =>
    setTimeout(
      () => (data.get("email") === "error@example.com" ? reject(new Error("The server can't be reached.")) : resolve(result())),
      800,
    ),
  );

const signIn = (_: SignInFormResult, data: FormData) =>
  answer<SignInFormResult>(data, () => {
    const email = String(data.get("email"));
    return data.get("password") !== "harmo"
      ? { form: "The email or password is incorrect.", values: { email } }
      : email === "new@example.com"
        ? { email: "Confirm your email address first. We've sent you a new link.", values: { email } }
        : undefined;
  });

const signUp = (_: SignUpFormResult, data: FormData) =>
  answer<SignUpFormResult>(data, () => {
    const values = { name: String(data.get("name")), email: String(data.get("email")) };
    return values.email === "sam@example.com"
      ? { form: "An account already uses that email.", values }
      : data.get("password") === "Password123!"
        ? { password: "This password has appeared in a data breach. Choose another.", values }
        : undefined;
  });

const sendLink = (_: ResetPasswordFormResult, data: FormData) =>
  answer<ResetPasswordFormResult>(data, () => {
    const email = String(data.get("email"));
    return email.endsWith("@example.org")
      ? { form: "We couldn't send the email. Try again in a moment.", values: { email } }
      : email.endsWith("@gmial.com")
        ? { email: "We can't deliver email to gmial.com. Did you mean gmail.com?", values: { email } }
        : { step: "sent", email };
  });

// Each leads to your app's route that starts signing in with that account.
const providers = [
  { name: "Google", icon: <GoogleIcon className="hicon" />, href: "/auth/google" },
  { name: "GitHub", icon: <GitHubIcon className="hicon" />, href: "/auth/github" },
  { name: "Apple", icon: <AppleIcon className="hicon" />, href: "/auth/apple" },
];

const pages = {
  signInHref: "/sign-in",
  signUpHref: "/sign-up",
  resetHref: "/reset-password",
  termsHref: "/terms",
  privacyHref: "/privacy",
  supportHref: "/contact",
};

export const examples = {
  Default: () => <AccountForms signInAction={signIn} signUpAction={signUp} resetAction={sendLink} {...pages} />,

  "Starting at sign-up": () => (
    <AccountForms signInAction={signIn} signUpAction={signUp} resetAction={sendLink} {...pages} initial="sign-up" />
  ),

  "With other accounts": () => (
    <AccountForms
      signInAction={signIn}
      signUpAction={signUp}
      resetAction={sendLink}
      {...pages}
      providers={providers}
    />
  ),

  "In a Dialog": () => (
    <Dialog
      id="account-dialog"
      label="Sign in to continue"
      closeLabel="Close"
      description="Your changes stay here while you sign in."
      closedby="closerequest"
      trigger={<Button>Save changes</Button>}
    >
      <AccountForms signInAction={signIn} signUpAction={signUp} resetAction={sendLink} {...pages} titleAs="h3" />
    </Dialog>
  ),
};
