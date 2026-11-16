"use client";

import { Button, Field, Input, Link } from "@harmo-ui/react";
import { Fragment, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { followsInPlace, mailboxOf } from "../auth-form/authForm.ts";
import {
  emailError,
  messagesOf,
  stepOf,
  textOf,
  useFormAction,
  useOutcome,
  type FormAction,
  type FormMessages,
} from "../form-action/formAction.ts";
import { focusStep, useStepMotion } from "../step-motion/useStepMotion.ts";

export type ResetPasswordFormMessages = FormMessages<"email", "email">;

export interface ResetPasswordFormSentStep {
  step: "sent";
  email: string;
}

export type ResetPasswordFormResult = undefined | string | ResetPasswordFormMessages | ResetPasswordFormSentStep;

export type ResetPasswordFormAction = FormAction<ResetPasswordFormResult>;

export interface ResetPasswordFormProps {
  action: ResetPasswordFormAction;
  signInHref: string;
  supportHref: string;
  defaultEmail?: string;
  initialResult?: ResetPasswordFormResult;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

type Step = "request" | "sent" | "resent";

const fields = ["email"] as const;

export const ResetPasswordForm = ({
  action,
  signInHref,
  supportHref,
  defaultEmail = "",
  initialResult,
  titleAs: Title = "h1",
}: ResetPasswordFormProps) => {
  const { outcome, formAction, pending, run, refill } = useFormAction(action, initialResult);
  const sentOf = (next: { result: ResetPasswordFormResult; failed: boolean }) =>
    next.failed ? undefined : stepOf<ResetPasswordFormSentStep>(next.result);
  const [step, setStep] = useState<Step>(() => (sentOf(outcome) ? "sent" : "request"));
  const [email, setEmail] = useState(() => sentOf(outcome)?.email ?? refill.values.email ?? defaultEmail);
  const [refilled, setRefilled] = useState(refill);
  const [error, setError] = useState(() => messagesOf(outcome, fields, "email").email);
  const [shaking, setShaking] = useState(false);
  const card = useRef<HTMLFormElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const resending = useRef(false);
  const focusing = useRef<"title" | "field">(undefined);
  const changeStep = useStepMotion(step, () => card.current);

  if (refilled !== refill) {
    setRefilled(refill);
    setEmail((current) => refill.values.email ?? current);
  }

  useOutcome(outcome, (next) => {
    const again = resending.current;
    resending.current = false;
    const sent = sentOf(next);
    if (sent) {
      setEmail(sent.email);
      setError(undefined);
      setStep(again ? "resent" : "sent");
      focusing.current = "title";
      return;
    }
    const message = messagesOf(next, fields, "email").email;
    setError(message);
    if (!message) return;
    setStep("request");
    setShaking(true);
    focusing.current = "field";
  });

  useEffect(() => {
    if (focusing.current) focusStep((focusing.current === "title" ? title : field).current);
    focusing.current = undefined;
  }, [outcome, step]);

  const go = (next: Step) =>
    changeStep(() => {
      focusing.current = "title";
      setStep(next);
    });

  const fail = (message: string) => {
    setError(message);
    setShaking(true);
    field.current?.focus();
  };

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const found = emailError(textOf(data, "email"));
    if (found) return fail(found);
    setError(undefined);
    run(data, (change, next) => (sentOf(next) ? changeStep(change) : change()));
  };

  const resend = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = event.currentTarget.form;
    if (!form || pending) return;
    resending.current = true;
    run(new FormData(form), (change) => changeStep(change));
  };

  const mailbox = mailboxOf(email);
  const address = <strong className="hauth-form-email">{email}</strong>;
  const tryAnother = (label: string) => (
    <Link
      href=""
      underlined
      onClick={(event) => {
        if (!followsInPlace(event)) return;
        event.preventDefault();
        go("request");
      }}
    >
      {label}
    </Link>
  );

  return (
    <form
      ref={card}
      className="hcard hauth-form"
      data-variant="raised"
      data-shake={shaking ? "" : undefined}
      action={formAction}
      noValidate
      onSubmit={send}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setShaking(false);
      }}
    >
      {step === "request" ? (
        <Fragment key="request">
          <div className="hauth-form-header">
            <Title ref={title} className="hauth-form-title" tabIndex={-1}>
              Reset your password
            </Title>
            <p className="hauth-form-description">
              Enter the email address of your account, and we'll send you a link to reset your password.
            </p>
          </div>
          <Field label="Email" error={error ?? ""}>
            <Input
              key={refill.key}
              ref={field}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={email || undefined}
              onChange={() => setError(undefined)}
            />
          </Field>
          <Button type="submit" loading={pending}>
            Continue
          </Button>
        </Fragment>
      ) : (
        <Fragment key={step}>
          <div className="hauth-form-header">
            <Title ref={title} className="hauth-form-title" tabIndex={-1}>
              Check your email
            </Title>
            {step === "sent" ? (
              <div className="hauth-form-message">
                <p className="hauth-form-description">
                  If an account uses {address}, we've sent a link there to reset your password.
                </p>
                <p className="hauth-form-description">
                  If you didn't receive an email, check your spam,{" "}
                  <button
                    type="submit"
                    className="hlink hauth-form-action"
                    data-underlined=""
                    aria-disabled={pending ? true : undefined}
                    aria-busy={pending ? true : undefined}
                    onClick={resend}
                  >
                    resend
                  </button>
                  , or {tryAnother("try another email")}.
                </p>
              </div>
            ) : (
              <div className="hauth-form-message">
                <p className="hauth-form-description">
                  If an account uses {address}, we've sent the link there again.
                </p>
                <p className="hauth-form-description">
                  If you still didn't receive an email, this might be the wrong email for your account.{" "}
                  {tryAnother("Try another email")} or{" "}
                  <Link href={supportHref} underlined>
                    contact our support
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
          <input type="hidden" name="email" value={email} />
          {step === "sent" && mailbox && (
            <Button href={mailbox.href} target="_blank" rel="noopener noreferrer">
              {mailbox.label}
            </Button>
          )}
        </Fragment>
      )}
      <p className="hauth-form-footer">
        <Link href={signInHref}>Return to sign in</Link>
      </p>
    </form>
  );
};
