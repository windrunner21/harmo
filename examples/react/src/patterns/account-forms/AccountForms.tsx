"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { FormAction } from "../form-action/formAction.ts";
import { ResetPasswordForm, type ResetPasswordFormAction } from "../reset-password/ResetPasswordForm.tsx";
import {
  SignInForm,
  type SignInFormProps,
  type SignInFormResult,
  type SignInFormTwoFactorResult,
  type SignInProvider,
  type SignInTwoFactor,
} from "../sign-in-form/SignInForm.tsx";
import {
  SignUpForm,
  type SignUpConfirmEmail,
  type SignUpFormConfirmResult,
  type SignUpFormProps,
  type SignUpFormResult,
} from "../sign-up-form/SignUpForm.tsx";
import { focusStep, useStepMotion } from "../step-motion/useStepMotion.ts";

export type AccountForm = "sign-in" | "sign-up" | "reset";

interface AccountFormsOptions {
  resetAction: ResetPasswordFormAction;
  signInHref: string;
  signUpHref: string;
  resetHref: string;
  termsHref: string;
  privacyHref: string;
  supportHref: string;
  providers?: SignInProvider[];
  initial?: AccountForm;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export type AccountFormsProps = AccountFormsOptions &
  (
    | { signInAction: FormAction<SignInFormResult>; twoFactor?: undefined }
    | { signInAction: FormAction<SignInFormTwoFactorResult>; twoFactor: SignInTwoFactor }
  ) &
  (
    | { signUpAction: FormAction<SignUpFormResult>; confirmEmail?: undefined }
    | { signUpAction: FormAction<SignUpFormConfirmResult>; confirmEmail: SignUpConfirmEmail }
  );

const forms: AccountForm[] = ["sign-in", "sign-up", "reset"];

const emailIn = (view: Element | undefined) =>
  view?.querySelector<HTMLInputElement>('.hauth-form:not([hidden]) input[name="email"]:not([type="hidden"])');

const cardIn = (view: Element | undefined) =>
  [...(view?.children ?? [])].find((child) => child instanceof HTMLElement && !child.hidden);

export const AccountForms = ({
  signInAction,
  signUpAction,
  resetAction,
  twoFactor,
  confirmEmail,
  signInHref,
  signUpHref,
  resetHref,
  termsHref,
  privacyHref,
  supportHref,
  providers,
  initial = "sign-in",
  titleAs,
}: AccountFormsProps) => {
  const [shown, setShown] = useState(initial);
  const root = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  const viewOf = (form: AccountForm) => root.current?.children[forms.indexOf(form)];
  const changeStep = useStepMotion(shown, () => cardIn(viewOf(shown)));

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const title = cardIn(viewOf(shown))?.querySelector<HTMLElement>(".hauth-form-title");
    if (!title) return;
    title.tabIndex = -1;
    focusStep(title);
  }, [shown]);

  const hrefs: Record<AccountForm, string> = { "sign-in": signInHref, "sign-up": signUpHref, reset: resetHref };

  const follow = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const next = forms.find((form) => form !== shown && hrefs[form] === link?.getAttribute("href"));
    if (!next) return;
    event.preventDefault();
    const typed = emailIn(viewOf(shown))?.value;
    const field = emailIn(viewOf(next));
    if (typed && field) field.value = typed;
    moved.current = true;
    changeStep(() => setShown(next));
  };

  const content: Record<AccountForm, ReactNode> = {
    "sign-in": (
      <SignInForm
        {...({ action: signInAction, twoFactor } as SignInFormProps)}
        forgotPasswordHref={resetHref}
        signUpHref={signUpHref}
        providers={providers}
        titleAs={titleAs}
      />
    ),
    "sign-up": (
      <SignUpForm
        {...({ action: signUpAction, confirmEmail } as SignUpFormProps)}
        termsHref={termsHref}
        privacyHref={privacyHref}
        signInHref={signInHref}
        providers={providers}
        titleAs={titleAs}
      />
    ),
    reset: (
      <ResetPasswordForm action={resetAction} signInHref={signInHref} supportHref={supportHref} titleAs={titleAs} />
    ),
  };

  return (
    <div ref={root} className="haccount-forms" onClick={follow}>
      {forms.map((form) => (
        <div key={form} className="haccount-forms-view" hidden={form !== shown}>
          {content[form]}
        </div>
      ))}
    </div>
  );
};
