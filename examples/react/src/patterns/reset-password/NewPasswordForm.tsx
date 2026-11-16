"use client";

import { Button, PasswordInput, type PasswordStrength } from "@harmo-ui/react";
import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import {
  firstOf,
  messagesOf,
  stepOf,
  useFormAction,
  useOutcome,
  type FormAction,
  type FormMessages,
} from "../form-action/formAction.ts";
import { focusStep, useStepMotion } from "../step-motion/useStepMotion.ts";

export type NewPasswordFormMessages = FormMessages<"password" | "confirmation">;

export interface NewPasswordFormSavedStep {
  step: "saved";
}

export type NewPasswordFormResult = undefined | string | NewPasswordFormMessages | NewPasswordFormSavedStep;

export type NewPasswordFormAction = FormAction<NewPasswordFormResult>;

export interface NewPasswordFormProps {
  action: NewPasswordFormAction;
  continueHref: string;
  initialResult?: NewPasswordFormResult;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const fields = ["password", "confirmation"] as const;

const mismatch = "Passwords must match.";

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

export const NewPasswordForm = ({ action, continueHref, initialResult, titleAs: Title = "h1" }: NewPasswordFormProps) => {
  const { outcome, formAction, pending, run } = useFormAction(action, initialResult);
  const savedOf = (next: { result: NewPasswordFormResult; failed: boolean }) =>
    !next.failed && stepOf<NewPasswordFormSavedStep>(next.result)?.step === "saved";
  const [errors, setErrors] = useState<NewPasswordFormMessages>(() => messagesOf(outcome, fields, "password"));
  const [shaking, setShaking] = useState(false);
  const [saved, setSaved] = useState(() => savedOf(outcome));
  const card = useRef<HTMLFormElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const focusing = useRef<"password" | "confirmation" | "title">(undefined);
  const changeStep = useStepMotion(saved, () => card.current);

  useOutcome(outcome, (next) => {
    if (savedOf(next)) {
      setErrors({});
      setSaved(true);
      focusing.current = "title";
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
    if (target === "title") focusStep(title.current);
    else if (target) (card.current?.elements.namedItem(target) as HTMLElement | null)?.focus();
  }, [outcome]);

  const fail = (form: HTMLFormElement, found: NewPasswordFormMessages) => {
    const first = firstOf(found, fields);
    if (!first) return false;
    setErrors(found);
    setShaking(true);
    (form.elements.namedItem(first) as HTMLInputElement | null)?.focus();
    return true;
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    const found: NewPasswordFormMessages = {
      password: !password
        ? "Enter a new password."
        : strength(password).level === 1
          ? "Choose a stronger password."
          : undefined,
      confirmation: confirmation ? undefined : "Enter the new password again.",
    };
    if (!found.password && !found.confirmation && password !== confirmation) {
      found.password = mismatch;
      found.confirmation = mismatch;
    }
    if (fail(form, found)) return;
    setErrors({});
    run(data, (change, next) => (savedOf(next) ? changeStep(change) : change()));
  };

  const forget = (name: keyof NewPasswordFormMessages) =>
    setErrors((current) =>
      current[name] === mismatch ? {} : current[name] ? { ...current, [name]: undefined } : current,
    );

  return (
    <form
      ref={card}
      className="hcard hauth-form"
      data-variant="raised"
      data-shake={shaking ? "" : undefined}
      action={formAction}
      noValidate
      onSubmit={save}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setShaking(false);
      }}
    >
      {saved ? (
        <Fragment key="saved">
          <Title ref={title} className="hauth-form-title" tabIndex={-1}>
            Your password was updated
          </Title>
          <Button href={continueHref}>Continue</Button>
        </Fragment>
      ) : (
        <Fragment key="choosing">
          <Title className="hauth-form-title">Reset password</Title>
          <div className="hauth-form-fields">
            <PasswordInput
              label="New password"
              name="password"
              autoComplete="new-password"
              showPasswordLabel="Show password"
              hidePasswordLabel="Hide password"
              strength={strength}
              strengthLabel="Password strength"
              error={errors.password ?? ""}
              onChange={() => forget("password")}
            />
            <PasswordInput
              label="Confirm new password"
              name="confirmation"
              autoComplete="new-password"
              showPasswordLabel="Show password"
              hidePasswordLabel="Hide password"
              error={errors.confirmation ?? ""}
              onChange={() => forget("confirmation")}
            />
          </div>
          <Button type="submit" loading={pending}>
            Reset password
          </Button>
        </Fragment>
      )}
    </form>
  );
};
