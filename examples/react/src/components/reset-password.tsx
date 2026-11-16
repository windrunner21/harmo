import { Banner, Link } from "@harmo-ui/react";
import { WarningIcon } from "../app-icons.tsx";
import { NewPasswordForm, type NewPasswordFormResult } from "../patterns/reset-password/NewPasswordForm.tsx";
import { ResetPasswordForm, type ResetPasswordFormResult } from "../patterns/reset-password/ResetPasswordForm.tsx";

// Stand in for your app's actions, which answer after a moment, as a request
// to a server would, and keep nothing of what was typed: a link goes to any
// address but one at example.org, which fails, one at gmial.com, which can't
// receive email, and error@example.com, which fails as a request that can't
// reach the server does; and any new password is saved but "Password123!",
// which is too common, and "MyOldPassword1!", which was used before. The
// server says what's wrong with the address, or with the password, of that
// field itself. A message about the address gives it back, as `values`, for
// the page a post renders to fill in again; one about a new password gives
// nothing back.
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

const sendLink = (_: ResetPasswordFormResult, data: FormData) =>
  answer<ResetPasswordFormResult>(() => {
    const email = String(data.get("email"));
    if (email === "error@example.com") throw new Error("The server can't be reached.");
    return email.endsWith("@example.org")
      ? { form: "We couldn't send the email. Try again in a moment.", values: { email } }
      : email.endsWith("@gmial.com")
        ? { email: "We can't deliver email to gmial.com. Did you mean gmail.com?", values: { email } }
        : { step: "sent", email };
  });

const savePassword = (_: NewPasswordFormResult, data: FormData) =>
  answer<NewPasswordFormResult>(() =>
    data.get("password") === "Password123!"
      ? "This password is too common. Choose another."
      : data.get("password") === "MyOldPassword1!"
        ? { password: "You've used this password before. Choose a new one." }
        : { step: "saved" },
  );

export const examples = {
  Default: () => <ResetPasswordForm action={sendLink} signInHref="/sign-in" supportHref="/contact" />,

  "With the email filled in": () => (
    <ResetPasswordForm action={sendLink} signInHref="/sign-in" supportHref="/contact" defaultEmail="sam@gmail.com" />
  ),

  "New password": () => <NewPasswordForm action={savePassword} continueHref="/sign-in" />,

  "Expired link": () => (
    <Banner status="warning" icon={<WarningIcon />} style={{ inlineSize: "100%", maxInlineSize: "25rem" }}>
      This link to reset your password has expired or can no longer be used.{" "}
      <Link href="/reset-password" underlined>
        Request a new one
      </Link>
      .
    </Banner>
  ),
};
