"use client";

import {
  Button,
  Checkbox,
  Field,
  Input,
  Link,
  PasswordInput,
  type PasswordStrength,
} from "@harmo-ui/react";
import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { followsInPlace, mailboxOf, type ResendAction, type ResendResult } from "../auth-form/authForm.ts";
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

export interface SignUpProvider {
  name: string;
  icon: ReactNode;
  href: string;
}

export type SignUpFormMessages = FormMessages<
  "name" | "email" | "password" | "terms" | "marketing",
  "name" | "email" | "terms" | "marketing"
>;

export interface SignUpFormConfirmStep {
  step: "confirm";
  email: string;
}

export type SignUpFormResult = undefined | string | SignUpFormMessages;

export type SignUpFormConfirmResult = SignUpFormResult | SignUpFormConfirmStep;

export type SignUpConfirmEmail =
  | { by: "link"; resendAction?: ResendAction; backHref?: string }
  | {
      by: "code";
      action: VerifyCodeAction;
      resendAction?: ResendAction;
      backHref?: string;
      length?: number;
      characters?: "numeric" | "alphanumeric";
      groups?: readonly number[];
    };

interface SignUpFormOptions {
  signInHref: string;
  termsHref?: string;
  privacyHref?: string;
  termsAgreement?: "line" | "checkbox";
  askForName?: boolean;
  askForMarketing?: boolean;
  providers?: SignUpProvider[];
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export type SignUpFormProps = SignUpFormOptions &
  (
    | { action: FormAction<SignUpFormResult>; confirmEmail?: undefined; initialResult?: SignUpFormResult }
    | {
        action: FormAction<SignUpFormConfirmResult>;
        confirmEmail: SignUpConfirmEmail;
        initialResult?: SignUpFormConfirmResult;
      }
  );

const fieldOrder = ["name", "email", "password", "terms"] as const;

type SignUpField = (typeof fieldOrder)[number];

const noResend: ResendAction = () => undefined;

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

export const SignUpForm = (props: SignUpFormProps) => {
  const {
    action,
    confirmEmail,
    initialResult,
    signInHref,
    termsHref,
    privacyHref,
    termsAgreement = "line",
    askForName = true,
    askForMarketing = false,
    providers = [],
    titleAs: Title = "h1",
  } = props as SignUpFormOptions & {
    action: FormAction<SignUpFormConfirmResult>;
    confirmEmail?: SignUpConfirmEmail;
    initialResult?: SignUpFormConfirmResult;
  };
  const id = useId();
  const termsErrorId = `${id}-terms-error`;
  const agreementId = `${id}-agreement`;
  const line = Boolean(termsHref) && termsAgreement === "line";
  const checkbox = Boolean(termsHref) && termsAgreement === "checkbox";
  const fields = fieldOrder.filter(
    (field) => (field !== "name" || askForName) && (field !== "terms" || checkbox),
  );
  const many = providers.length > 3;
  const { outcome, formAction, pending, run, refill } = useFormAction(action, initialResult);
  const resend = useFormAction<ResendResult>(
    confirmEmail?.by === "link" && confirmEmail.resendAction ? confirmEmail.resendAction : noResend,
    undefined,
  );
  const confirmOf = (result: SignUpFormConfirmResult) =>
    confirmEmail ? stepOf<SignUpFormConfirmStep>(result) : undefined;
  const resendFailure = messagesOf(resend.outcome, fields, "email");
  const [errors, setErrors] = useState<SignUpFormMessages>(() =>
    resendFailure.email ? resendFailure : messagesOf(outcome, fields, "email"),
  );
  const [confirm, setConfirm] = useState(() =>
    outcome.failed || resendFailure.email ? undefined : confirmOf(outcome.result),
  );
  const [again, setAgain] = useState(() => typeof resend.outcome.result === "object");
  const [returned, setReturned] = useState(() =>
    resendFailure.email ? confirmOf(outcome.result)?.email : undefined,
  );
  const [shaking, setShaking] = useState(false);
  const card = useRef<HTMLFormElement>(null);
  const confirmCard = useRef<HTMLFormElement>(null);
  const focusing = useRef<SignUpField | "confirm" | "title">(undefined);
  const changeStep = useStepMotion(confirm, () => (confirm ? confirmCard : card).current);

  const showErrors = (found: SignUpFormMessages) => {
    setErrors(found);
    focusing.current = firstOf(found, fields);
    if (focusing.current) setShaking(true);
  };

  useOutcome(outcome, (next) => {
    const step = next.failed ? undefined : confirmOf(next.result);
    if (!step) return showErrors(messagesOf(next, fields, "email"));
    setErrors({});
    setAgain(false);
    setConfirm(step);
    focusing.current = "confirm";
  });

  useOutcome(resend.outcome, (next) => {
    const found = messagesOf(next, fields, "email");
    if (found.email) {
      setReturned(confirm?.email);
      setConfirm(undefined);
      return showErrors(found);
    }
    if (typeof next.result !== "object") return;
    setAgain(true);
    focusing.current = "confirm";
  });

  useEffect(() => {
    const target = focusing.current;
    focusing.current = undefined;
    if (target === "confirm") return focusStep(confirmCard.current?.querySelector<HTMLElement>(".hauth-form-title"));
    if (target === "title") {
      const title = card.current?.querySelector<HTMLElement>(".hauth-form-title");
      if (title) title.tabIndex = -1;
      return focusStep(title);
    }
    if (target) (card.current?.elements.namedItem(target) as HTMLElement | null)?.focus();
  }, [outcome, resend.outcome, confirm]);

  const fail = (form: HTMLFormElement, found: SignUpFormMessages) => {
    const first = firstOf(found, fields);
    if (!first) return false;
    setErrors(found);
    setShaking(true);
    (form.elements.namedItem(first) as HTMLInputElement | null)?.focus();
    return true;
  };

  const signUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const found: SignUpFormMessages = {
      name: askForName && !textOf(data, "name") ? "Enter your name." : undefined,
      email: emailError(textOf(data, "email")),
      password: !password
        ? "Enter a password."
        : strength(password).level === 1
          ? "Choose a stronger password."
          : undefined,
      terms: !checkbox || data.has("terms") ? undefined : "Agree to the terms to create your account.",
    };
    if (fail(form, found)) return;
    setErrors({});
    run(data, (change, next) => (!next.failed && confirmOf(next.result) ? changeStep(change) : change()));
  };

  const back = () =>
    changeStep(() => {
      focusing.current = "title";
      setConfirm(undefined);
    });

  const sendAgain = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = event.currentTarget.form;
    if (!form || resend.pending) return;
    resend.run(new FormData(form, event.currentTarget), (change, next) =>
      messagesOf(next, fields, "email").email ? changeStep(change) : change(),
    );
  };

  const termsLinks = termsHref && (
    <>
      <Link href={termsHref}>Terms of Service</Link>
      {privacyHref && (
        <>
          {" "}and <Link href={privacyHref}>Privacy Policy</Link>
        </>
      )}
    </>
  );

  const forget = (field: keyof SignUpFormMessages) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const address = confirm && <strong className="hauth-form-email">{confirm.email}</strong>;
  const mailbox = confirm && mailboxOf(confirm.email);
  const another = (
    <Link
      href={confirmEmail?.backHref ?? ""}
      underlined
      onClick={(event) => {
        if (!followsInPlace(event)) return;
        event.preventDefault();
        back();
      }}
    >
      use another email
    </Link>
  );

  return (
    <>
      <form
        ref={card}
        className="hcard hauth-form"
        data-variant="raised"
        data-shake={shaking ? "" : undefined}
        hidden={confirm ? true : undefined}
        action={formAction}
        noValidate
        onSubmit={signUp}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setShaking(false);
        }}
      >
        <Title className="hauth-form-title">Create your account</Title>
        <div className="hauth-form-fields">
          {askForName && (
            <Field label="Name" error={errors.name ?? ""}>
              <Input
                key={refill.key}
                name="name"
                autoComplete="name"
                defaultValue={refill.values.name}
                onChange={() => forget("name")}
              />
            </Field>
          )}
          <Field label="Email" error={errors.email ?? ""}>
            <Input
              key={refill.key}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={refill.values.email ?? returned}
              onChange={() => forget("email")}
            />
          </Field>
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="new-password"
            showPasswordLabel="Show password"
            hidePasswordLabel="Hide password"
            strength={strength}
            strengthLabel="Password strength"
            error={errors.password ?? ""}
            onChange={() => forget("password")}
          />
          {askForMarketing && (
            <Field
              className="hsign-up-form-consent"
              orientation="horizontal"
              size="small"
              label="Email me product news and tips"
            >
              <Checkbox key={refill.key} name="marketing" defaultChecked={refill.values.marketing === "on"} />
            </Field>
          )}
          {checkbox && (
            <div className="hsign-up-form-terms">
              <Field
                className="hsign-up-form-consent"
                orientation="horizontal"
                size="small"
                label={<>I agree to the {termsLinks}</>}
              >
                <Checkbox
                  key={refill.key}
                  name="terms"
                  defaultChecked={refill.values.terms === "on"}
                  aria-describedby={termsErrorId}
                  aria-invalid={errors.terms ? true : undefined}
                  onChange={() => forget("terms")}
                />
              </Field>
              <p className="herror" id={termsErrorId} aria-live="polite">
                {errors.terms}
              </p>
            </div>
          )}
        </div>
        <Button type="submit" loading={pending} aria-describedby={line ? agreementId : undefined}>
          Create account
        </Button>
        {line && (
          <p className="hsign-up-form-agreement" id={agreementId}>
            By creating an account, you agree to our {termsLinks}.
          </p>
        )}
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
        <p className="hauth-form-footer">
          Already have an account? <Link underlined href={signInHref}>Sign in</Link>
        </p>
      </form>
      {confirm && confirmEmail?.by === "link" && (
        <form
          ref={confirmCard}
          className="hcard hauth-form"
          data-variant="raised"
          action={confirmEmail.resendAction ? resend.formAction : undefined}
          noValidate
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="hauth-form-header">
            <Title className="hauth-form-title" tabIndex={-1}>
              Check your email
            </Title>
            <div className="hauth-form-message">
              <p className="hauth-form-description">
                {again ? (
                  <>We've sent the link to {address} again.</>
                ) : (
                  <>We've sent a link to {address}. Open it to confirm your email address.</>
                )}
              </p>
              <p className="hauth-form-description">
                {confirmEmail.resendAction ? (
                  <>
                    If you didn't receive an email, check your spam,{" "}
                    <button
                      type="submit"
                      className="hlink hauth-form-action"
                      data-underlined=""
                      aria-disabled={resend.pending ? true : undefined}
                      aria-busy={resend.pending ? true : undefined}
                      onClick={sendAgain}
                    >
                      resend
                    </button>
                    , or {another}.
                  </>
                ) : (
                  <>If you didn't receive an email, check your spam, or {another}.</>
                )}
              </p>
            </div>
          </div>
          <input type="hidden" name="email" value={confirm.email} />
          {mailbox && (
            <Button href={mailbox.href} target="_blank" rel="noopener noreferrer">
              {mailbox.label}
            </Button>
          )}
          <p className="hauth-form-footer">
            Already have an account? <Link underlined href={signInHref}>Sign in</Link>
          </p>
        </form>
      )}
      {confirm && confirmEmail?.by === "code" && (
        <VerifyCodeForm
          ref={confirmCard}
          action={confirmEmail.action}
          resendAction={confirmEmail.resendAction}
          length={confirmEmail.length}
          characters={confirmEmail.characters}
          groups={confirmEmail.groups}
          title="Check your email"
          titleAs={Title}
          sentTo={confirm.email}
          hiddenValues={{ email: confirm.email }}
          back={{ label: "Use another email", href: confirmEmail.backHref ?? "", onBack: back }}
        />
      )}
    </>
  );
};
