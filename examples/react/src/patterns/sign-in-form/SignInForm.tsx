"use client";

import { Button, Field, Input, Link, PasswordInput } from "@harmo-ui/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ResendAction } from "../auth-form/authForm.ts";
import {
  emailError,
  firstOf,
  messagesOf,
  stepOf,
  textOf,
  useFormAction,
  useOutcome,
  type FormAction,
  type FormMessages,
} from "../form-action/formAction.ts";
import { focusStep, useStepMotion } from "../step-motion/useStepMotion.ts";
import { VerifyCodeForm, type VerifyCodeAction } from "../verify-code/VerifyCodeForm.tsx";

export interface SignInProvider {
  name: string;
  icon: ReactNode;
  href: string;
}

export type SignInFormMessages = FormMessages<"email" | "password", "email">;

export interface SignInFormCodeStep {
  step: "code";
  sentTo?: string;
}

export type SignInFormResult = undefined | string | SignInFormMessages;

export type SignInFormTwoFactorResult = SignInFormResult | SignInFormCodeStep;

export interface SignInTwoFactor {
  action: VerifyCodeAction;
  resendAction?: ResendAction;
  backHref?: string;
  length?: number;
  characters?: "numeric" | "alphanumeric";
  groups?: readonly number[];
}

interface SignInFormOptions {
  forgotPasswordHref: string;
  forgotPasswordAt?: "label" | "below";
  signUpHref?: string;
  providers?: SignInProvider[];
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export type SignInFormProps = SignInFormOptions &
  (
    | { action: FormAction<SignInFormResult>; twoFactor?: undefined; initialResult?: SignInFormResult }
    | {
        action: FormAction<SignInFormTwoFactorResult>;
        twoFactor: SignInTwoFactor;
        initialResult?: SignInFormTwoFactorResult;
      }
  );

const fields = ["email", "password"] as const;

export const SignInForm = (props: SignInFormProps) => {
  const {
    action,
    twoFactor,
    initialResult,
    forgotPasswordHref,
    forgotPasswordAt = "label",
    signUpHref,
    providers = [],
    titleAs: Title = "h1",
  } = props as SignInFormOptions & {
    action: FormAction<SignInFormTwoFactorResult>;
    twoFactor?: SignInTwoFactor;
    initialResult?: SignInFormTwoFactorResult;
  };
  const { outcome, formAction, pending, run, refill } = useFormAction(action, initialResult);
  const codeOf = (result: SignInFormTwoFactorResult) => (twoFactor ? stepOf<SignInFormCodeStep>(result) : undefined);
  const [errors, setErrors] = useState<SignInFormMessages>(() => messagesOf(outcome, fields, "password"));
  const [code, setCode] = useState(() => (outcome.failed ? undefined : codeOf(outcome.result)));
  const [shaking, setShaking] = useState(false);
  const card = useRef<HTMLFormElement>(null);
  const codeCard = useRef<HTMLFormElement>(null);
  const focusing = useRef<"email" | "password" | "code" | "title">(undefined);
  const many = providers.length > 3;
  const changeStep = useStepMotion(code, () => (code ? codeCard : card).current);

  useOutcome(outcome, (next) => {
    const step = next.failed ? undefined : codeOf(next.result);
    if (step) {
      setErrors({});
      setCode(step);
      focusing.current = "code";
      return;
    }
    const found = messagesOf(next, fields, "password");
    setErrors(found);
    focusing.current = firstOf(found, fields);
    if (focusing.current) setShaking(true);
  });

  useEffect(() => {
    const target = focusing.current;
    focusing.current = undefined;
    if (target === "code") return focusStep(codeCard.current?.querySelector<HTMLElement>(".hauth-form-title"));
    if (target === "title") {
      const title = card.current?.querySelector<HTMLElement>(".hauth-form-title");
      if (title) title.tabIndex = -1;
      return focusStep(title);
    }
    if (target) (card.current?.elements.namedItem(target) as HTMLElement | null)?.focus();
  }, [outcome, code]);

  const fail = (form: HTMLFormElement, found: SignInFormMessages) => {
    const first = firstOf(found, fields);
    if (!first) return false;
    setErrors(found);
    setShaking(true);
    (form.elements.namedItem(first) as HTMLInputElement | null)?.focus();
    return true;
  };

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const found: SignInFormMessages = {
      email: emailError(textOf(data, "email")),
      password: data.get("password") ? undefined : "Enter your password.",
    };
    if (fail(form, found)) return;
    setErrors({});
    run(data, (change, next) => (!next.failed && codeOf(next.result) ? changeStep(change) : change()));
  };

  const backToSignIn = () =>
    changeStep(() => {
      focusing.current = "title";
      setCode(undefined);
    });

  const forget = (name: keyof SignInFormMessages) =>
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));

  const forgot = (
    <Link
      href={forgotPasswordHref}
      className={forgotPasswordAt === "label" ? "hfield-label-end" : "hauth-form-forgot"}
    >
      Forgot your password?
    </Link>
  );
  const password = (
    <PasswordInput
      label="Password"
      name="password"
      autoComplete="current-password"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      labelAccessory={forgotPasswordAt === "label" ? forgot : undefined}
      error={errors.password ?? ""}
      onChange={() => forget("password")}
    />
  );

  return (
    <>
      <form
        ref={card}
        className="hcard hauth-form"
        data-variant="raised"
        data-shake={shaking ? "" : undefined}
        hidden={code ? true : undefined}
        action={formAction}
        noValidate
        onSubmit={signIn}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setShaking(false);
        }}
      >
        <Title className="hauth-form-title">Sign in</Title>
        <div className="hauth-form-fields">
          <Field label="Email" error={errors.email ?? ""}>
            <Input
              key={refill.key}
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={refill.values.email}
              onChange={() => forget("email")}
            />
          </Field>
          {forgotPasswordAt === "label" ? (
            password
          ) : (
            <div className="hauth-form-password">
              {password}
              {forgot}
            </div>
          )}
        </div>
        <Button type="submit" loading={pending}>
          Sign in
        </Button>
        {providers.length > 0 && (
          <>
            <p className="hauth-form-divider">or</p>
            <div className="hauth-form-providers">
              {providers.map(({ name, icon, href }) => (
                <Button
                  key={name}
                  variant="secondary"
                  href={href}
                  aria-label={many ? `Continue with ${name}` : undefined}
                >
                  {icon}
                  {many ? name : `Continue with ${name}`}
                </Button>
              ))}
            </div>
          </>
        )}
        {signUpHref && (
          <p className="hauth-form-footer">
            Don't have an account? <Link underlined href={signUpHref}>Sign up</Link>
          </p>
        )}
      </form>
      {twoFactor && code && (
        <VerifyCodeForm
          ref={codeCard}
          action={twoFactor.action}
          resendAction={twoFactor.resendAction}
          length={twoFactor.length}
          characters={twoFactor.characters}
          groups={twoFactor.groups}
          title="Verify it's you"
          titleAs={Title}
          sentTo={code.sentTo}
          back={{ label: "Back to sign in", href: twoFactor.backHref ?? "", onBack: backToSignIn }}
        />
      )}
    </>
  );
};
