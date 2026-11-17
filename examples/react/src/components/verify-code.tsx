import { toast } from "@harmo-ui/react";
import { VerifyCodeForm, type ResendResult, type VerifyCodeResult } from "../patterns/verify-code/VerifyCodeForm.tsx";

// Stand in for your app's actions, which answer after a moment, as a request
// to a server would, and keep nothing of what was typed: 123456 is the code,
// with a toast where your app would go on to its next page, 000000 fails as a request that can't reach the server does, and a new code
// can always be sent.
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

const verify = (_: VerifyCodeResult, data: FormData) =>
  answer<VerifyCodeResult>(() => {
    if (data.get("code") === "000000") throw new Error("The server can't be reached.");
    if (data.get("code") !== "123456") return { code: "That code isn't right. Check it, or send a new one." };
    toast({ status: "success", title: "Code accepted" });
    return undefined;
  });

const resend = () => answer<ResendResult>(() => ({ sent: true }));

export const examples = {
  Default: () => (
    <VerifyCodeForm
      action={verify}
      resendAction={resend}
      sentTo="sam@example.com"
      back={{ label: "Back to sign in", href: "/sign-in" }}
    />
  ),

  "From an authenticator app": () => (
    <VerifyCodeForm action={verify} back={{ label: "Back to sign in", href: "/sign-in" }} />
  ),

  "Confirming a phone number": () => (
    <VerifyCodeForm
      action={verify}
      resendAction={resend}
      resendAfter={60}
      title="Confirm your phone number"
      sentTo="+1 (555) 010-4821"
      groups={[3, 3]}
      back={{ label: "Use another number", href: "/settings/phone" }}
    />
  ),
};
