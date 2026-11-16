"use client";

import { Button, Link, OtpInput } from "@harmo-ui/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type MouseEvent, type Ref } from "react";
import { followsInPlace, type ResendAction, type ResendResult } from "../auth-form/authForm.ts";
import { messagesOf, useFormAction, useOutcome, type FormAction, type FormMessages } from "../form-action/formAction.ts";

export type { ResendAction, ResendResult };

export type VerifyCodeMessages = FormMessages<"code">;

export type VerifyCodeResult = undefined | string | VerifyCodeMessages;

export type VerifyCodeAction = FormAction<VerifyCodeResult>;

export interface VerifyCodeBack {
  label: string;
  href: string;
  onBack?: () => void;
}

export interface VerifyCodeFormProps {
  action: VerifyCodeAction;
  resendAction?: ResendAction;
  resendAfter?: number;
  title?: string;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  sentTo?: string;
  length?: number;
  characters?: "numeric" | "alphanumeric";
  groups?: readonly number[];
  back?: VerifyCodeBack;
  hiddenValues?: Record<string, string>;
  initialResult?: VerifyCodeResult;
  ref?: Ref<HTMLFormElement>;
}

const fields = ["code"] as const;

const noResend: ResendAction = () => undefined;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export const VerifyCodeForm = ({
  action,
  resendAction,
  resendAfter = 30,
  title = "Enter the code",
  titleAs: Title = "h1",
  sentTo,
  length = 6,
  characters = "numeric",
  groups,
  back,
  hiddenValues,
  initialResult,
  ref,
}: VerifyCodeFormProps) => {
  const id = useId();
  const descriptionId = `${id}-description`;
  const size = Number.isFinite(length) ? Math.min(12, Math.max(4, Math.round(length))) : 6;
  const kind = characters === "alphanumeric" ? `${size}-character` : `${size}-digit`;
  const verify = useFormAction(action, initialResult);
  const resend = useFormAction<ResendResult>(resendAction ?? noResend, undefined);
  const [error, setError] = useState(
    () => messagesOf(verify.outcome, fields, "code").code ?? messagesOf(resend.outcome, fields, "code").code,
  );
  const [resent, setResent] = useState(() => typeof resend.outcome.result === "object");
  const [shaking, setShaking] = useState(false);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const focusing = useRef(false);
  const left = until > now ? Math.ceil((until - now) / 1000) : 0;

  const wait = () => {
    const started = Date.now();
    setNow(started);
    setUntil(started + Math.max(0, resendAfter) * 1000);
  };

  const show = (message: string | undefined) => {
    setError(message);
    if (!message) return;
    setShaking(true);
    focusing.current = true;
  };

  useOutcome(verify.outcome, (next) => show(messagesOf(next, fields, "code").code));

  useOutcome(resend.outcome, (next) => {
    const message = messagesOf(next, fields, "code").code;
    if (message) return show(message);
    if (typeof next.result !== "object") return;
    setResent(true);
    setError(undefined);
    wait();
  });

  useLayoutEffect(() => {
    if (resendAction) wait();
  }, []);

  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= until) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);

  useEffect(() => {
    if (!focusing.current) return;
    focusing.current = false;
    input.current?.focus();
    input.current?.select();
  }, [verify.outcome, resend.outcome]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verify.pending || resend.pending) return;
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "");
    const found = !code ? "Enter the code." : code.length < size ? `Enter all ${size} ${characters === "alphanumeric" ? "characters" : "digits"}.` : undefined;
    if (found) {
      show(found);
      input.current?.focus();
      focusing.current = false;
      return;
    }
    setError(undefined);
    verify.run(data);
  };

  const sendAgain = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = event.currentTarget.form;
    if (!form || left > 0 || verify.pending || resend.pending) return;
    setError(undefined);
    resend.run(new FormData(form, event.currentTarget));
  };

  const address = sentTo && <strong className="hauth-form-email">{sentTo}</strong>;

  return (
    <form
      ref={ref}
      className="hcard hauth-form"
      data-variant="raised"
      data-shake={shaking ? "" : undefined}
      action={verify.formAction}
      noValidate
      onSubmit={submit}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setShaking(false);
      }}
    >
      <div className="hauth-form-header">
        <Title className="hauth-form-title" tabIndex={-1}>
          {title}
        </Title>
        <p className="hauth-form-description" id={descriptionId} aria-live="polite">
          {resent && address ? (
            <>We've sent a new code to {address}.</>
          ) : address ? (
            <>We sent a {kind} code to {address}.</>
          ) : (
            <>Enter the {kind} code from your authenticator app.</>
          )}
        </p>
      </div>
      {Object.entries(hiddenValues ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <OtpInput
        ref={input}
        label="Code"
        name="code"
        length={size}
        characters={characters}
        groups={groups}
        error={error ?? ""}
        aria-describedby={descriptionId}
        onChange={() => setError(undefined)}
        onComplete={() => input.current?.form?.requestSubmit()}
      />
      <Button type="submit" loading={verify.pending}>
        Verify
      </Button>
      {resendAction && (
        <p className="hverify-code-resend">
          Didn't get a code?{" "}
          <button
            type="submit"
            className="hlink hauth-form-action"
            data-underlined=""
            formAction={resend.formAction}
            aria-disabled={left > 0 || resend.pending ? true : undefined}
            aria-busy={resend.pending ? true : undefined}
            onClick={sendAgain}
          >
            {left > 0 ? `Send a new code in ${clock(left)}` : "Send a new code"}
          </button>
        </p>
      )}
      {back && (
        <p className="hauth-form-footer">
          <Link
            href={back.href}
            onClick={(event) => {
              if (!back.onBack || !followsInPlace(event)) return;
              event.preventDefault();
              back.onBack();
            }}
          >
            {back.label}
          </Link>
        </p>
      )}
    </form>
  );
};
