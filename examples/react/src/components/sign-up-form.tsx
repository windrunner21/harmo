import { AppleIcon, GitHubIcon, GoogleIcon, MicrosoftIcon, OpenAIIcon, XIcon } from "../app-icons.tsx";
import {
  SignUpForm,
  type SignUpFormConfirmResult,
  type SignUpFormResult,
} from "../patterns/sign-up-form/SignUpForm.tsx";
import type { ResendResult, VerifyCodeResult } from "../patterns/verify-code/VerifyCodeForm.tsx";

// Stand in for your app's actions, which answer after a moment, as a request
// to a server would, and keep nothing of what was typed. sam@example.com
// already has an account, the password "Password123!" has appeared in a data
// breach, which the server says of the password itself, error@example.com
// fails as a request that can't reach the server does, and anything else
// signs up. A message gives the name and the email back, as `values`, for the
// page a post renders to fill in again; never the password.
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

const typed = (data: FormData) => ({ name: String(data.get("name") ?? ""), email: String(data.get("email")) });

const breached = (data: FormData) => ({
  password: "This password has appeared in a data breach. Choose another.",
  values: typed(data),
});

const signUp = (_: SignUpFormResult, data: FormData) =>
  answer<SignUpFormResult>(() =>
    data.get("email") === "error@example.com"
      ? unreachable()
      : data.get("email") === "sam@example.com"
        ? { form: "An account already uses that email.", values: typed(data) }
        : data.get("password") === "Password123!"
          ? breached(data)
          : undefined,
  );

// Asking to confirm the email, every address goes to the step that says an
// email is on its way, sam@example.com's too: the server emails its owner
// instead, so the form never says who has an account. By code, 123456 is
// the code, and 000000 fails as a request that can't reach the server does.
const signUpToConfirm = (_: SignUpFormConfirmResult, data: FormData) =>
  answer<SignUpFormConfirmResult>(() =>
    data.get("email") === "error@example.com"
      ? unreachable()
      : data.get("password") === "Password123!"
        ? breached(data)
        : { step: "confirm", email: String(data.get("email")) },
  );

const verifyCode = (_: VerifyCodeResult, data: FormData) =>
  answer<VerifyCodeResult>(() =>
    data.get("code") === "000000"
      ? unreachable()
      : data.get("code") === "123456"
        ? undefined
        : { code: "That code isn't right. Check it, or send a new one." },
  );

const resend = () => answer<ResendResult>(() => ({ sent: true }));

// Each leads to your app's route that starts signing in with that account.
const google = { name: "Google", icon: <GoogleIcon className="hicon" />, href: "/auth/google" };
const github = { name: "GitHub", icon: <GitHubIcon className="hicon" />, href: "/auth/github" };

export const examples = {
  Default: () => (
    <SignUpForm action={signUp} termsHref="/terms" privacyHref="/privacy" signInHref="/sign-in" />
  ),

  "Without the name": () => (
    <SignUpForm
      action={signUp}
      termsHref="/terms"
      privacyHref="/privacy"
      signInHref="/sign-in"
      askForName={false}
    />
  ),

  "Without the terms": () => <SignUpForm action={signUp} signInHref="/sign-in" />,

  "With a terms checkbox": () => (
    <SignUpForm
      action={signUp}
      termsHref="/terms"
      privacyHref="/privacy"
      signInHref="/sign-in"
      termsAgreement="checkbox"
    />
  ),

  "With marketing emails": () => (
    <SignUpForm
      action={signUp}
      termsHref="/terms"
      privacyHref="/privacy"
      signInHref="/sign-in"
      askForMarketing
    />
  ),

  "With other accounts": () => (
    <SignUpForm
      action={signUp}
      termsHref="/terms"
      privacyHref="/privacy"
      signInHref="/sign-in"
      providers={[google, github]}
    />
  ),

  "With many other accounts": () => (
    <SignUpForm
      action={signUp}
      termsHref="/terms"
      privacyHref="/privacy"
      signInHref="/sign-in"
      providers={[
        google,
        { name: "Apple", icon: <AppleIcon className="hicon" />, href: "/auth/apple" },
        { name: "Microsoft", icon: <MicrosoftIcon className="hicon" />, href: "/auth/microsoft" },
        github,
        { name: "X", icon: <XIcon className="hicon" />, href: "/auth/x" },
        { name: "OpenAI", icon: <OpenAIIcon className="hicon" />, href: "/auth/openai" },
      ]}
    />
  ),

  "Confirm by link": () => (
    <SignUpForm
      action={signUpToConfirm}
      termsHref="/terms"
      privacyHref="/privacy"
      signInHref="/sign-in"
      confirmEmail={{ by: "link", resendAction: resend }}
    />
  ),

  "Confirm by code": () => (
    <SignUpForm
      action={signUpToConfirm}
      termsHref="/terms"
      privacyHref="/privacy"
      signInHref="/sign-in"
      confirmEmail={{ by: "code", action: verifyCode, resendAction: resend }}
    />
  ),
};
