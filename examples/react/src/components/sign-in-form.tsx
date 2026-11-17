import type { CSSProperties } from "react";
import { Card, toast } from "@harmo-ui/react";
import { AppleIcon, GitHubIcon, GoogleIcon, MicrosoftIcon, OpenAIIcon, XIcon } from "../app-icons.tsx";
import {
  SignInForm,
  type SignInFormResult,
  type SignInFormTwoFactorResult,
} from "../patterns/sign-in-form/SignInForm.tsx";
import type { ResendResult, VerifyCodeResult } from "../patterns/verify-code/VerifyCodeForm.tsx";

// Stand in for your app's actions, which answer after a moment, as a request
// to a server would, and keep nothing of what was typed. The password "harmo"
// signs in, with a toast, and any other fails. With it, new@example.com hasn't confirmed
// its email yet, which the server says of the email itself, and
// error@example.com fails as a request that can't reach the server does. A
// message gives the email back, as `values`, for the page a post renders to
// fill in again; never the password.
const answer = <Result,>(result: () => Result) =>
  new Promise<Result>((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(result());
      } catch (error) {
        reject(error);
      }
    }, 800),
  );

const unreachable = () => {
  throw new Error("The server can't be reached.");
};

// Signed in, your app would go on to its first page, which says so; here a
// toast does.
const signedIn = (email?: string) => {
  toast({ status: "success", title: "Signed in", description: email && `Welcome back, ${email}.` });
  return undefined;
};

const signIn = (_: SignInFormResult, data: FormData) =>
  answer<SignInFormResult>(() => {
    const email = String(data.get("email"));
    return email === "error@example.com"
      ? unreachable()
      : data.get("password") !== "harmo"
        ? { form: "The email or password is incorrect.", values: { email } }
        : email === "new@example.com"
          ? { email: "Confirm your email address first. We've sent you a new link.", values: { email } }
          : signedIn(email);
  });

// With a second step, the right password asks for the code the server sent
// to the email; 123456 is the code, 000000 fails as a request that can't
// reach the server does, and a new one can be sent.
const signInWithCode = (_: SignInFormTwoFactorResult, data: FormData) =>
  answer<SignInFormTwoFactorResult>(() => {
    const email = String(data.get("email"));
    return data.get("password") !== "harmo"
      ? { form: "The email or password is incorrect.", values: { email } }
      : { step: "code", sentTo: email };
  });

const verifyCode = (_: VerifyCodeResult, data: FormData) =>
  answer<VerifyCodeResult>(() =>
    data.get("code") === "000000"
      ? unreachable()
      : data.get("code") === "123456"
        ? signedIn()
        : { code: "That code isn't right. Check it, or send a new one." },
  );

const sendCode = () => answer<ResendResult>(() => ({ sent: true }));

// Each leads to your app's route that starts signing in with that account.
const google = { name: "Google", icon: <GoogleIcon className="hicon" />, href: "/auth/google" };
const github = { name: "GitHub", icon: <GitHubIcon className="hicon" />, href: "/auth/github" };
const apple = { name: "Apple", icon: <AppleIcon className="hicon" />, href: "/auth/apple" };

export const examples = {
  Default: () => <SignInForm action={signIn} forgotPasswordHref="/reset-password" />,

  "Link below the field": () => (
    <SignInForm action={signIn} forgotPasswordHref="/reset-password" forgotPasswordAt="below" />
  ),

  "With other accounts": () => (
    <SignInForm action={signIn} forgotPasswordHref="/reset-password" providers={[google, github, apple]} />
  ),

  "With many other accounts": () => (
    <SignInForm
      action={signIn}
      forgotPasswordHref="/reset-password"
      providers={[
        google,
        apple,
        { name: "Microsoft", icon: <MicrosoftIcon className="hicon" />, href: "/auth/microsoft" },
        github,
        { name: "X", icon: <XIcon className="hicon" />, href: "/auth/x" },
        { name: "OpenAI", icon: <OpenAIIcon className="hicon" />, href: "/auth/openai" },
      ]}
    />
  ),

  "With a two-factor code": () => (
    <SignInForm
      action={signInWithCode}
      forgotPasswordHref="/reset-password"
      twoFactor={{ action: verifyCode, resendAction: sendCode }}
    />
  ),

  "With help links": () => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "var(--harmo-space-lg) var(--harmo-space-xl)",
      }}
    >
      <SignInForm action={signIn} forgotPasswordHref="/reset-password" />
      <ul
        style={
          {
            "--harmo-card-padding": "var(--harmo-space-xs)",
            margin: 0,
            padding: 0,
            listStyle: "none",
          } as CSSProperties
        }
      >
        <li>
          <Card
            variant="ghost"
            href="/activate"
            label="Activate your account"
            labelAs="p"
            description="Got an invitation? Set a password to start."
            chevron
          />
        </li>
        <li>
          <Card
            variant="ghost"
            href="/sign-up"
            label="New here?"
            labelAs="p"
            description="Create an account for your team in a few minutes."
            chevron
          />
        </li>
        <li>
          <Card
            variant="ghost"
            href="/contact"
            label="Talk to us"
            labelAs="p"
            description="Questions about plans or setup? We're glad to help."
            chevron
          />
        </li>
      </ul>
    </div>
  ),
};
