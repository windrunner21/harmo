import { useEffect, useRef, useState, useTransition, type AnimationEvent, type FormEvent } from "react";
import {
  firstOf,
  messagesOf,
  stepOf,
  useFormAction,
  useOutcome,
  type FormAction,
  type Outcome,
} from "../form-action/formAction.ts";
import { focusStep, useStepMotion } from "../step-motion/useStepMotion.ts";

interface Sent {
  step: "sent";
}

const focusField = (scope: HTMLElement, name: string) => {
  const radios = scope.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`);
  const field =
    [...radios].find((radio) => radio.checked) ??
    radios[0] ??
    scope.querySelector<HTMLElement>(`[data-name="${name}"]`) ??
    scope.querySelector<HTMLElement>(`[name="${name}"]:not([type="hidden"])`);
  field?.focus();
};

export const useContactForm = <Result, Field extends string>({
  action,
  fields,
  check,
  files,
}: {
  action: FormAction<Result>;
  fields: readonly Field[];
  check: (data: FormData) => Partial<Record<Field, string>>;
  files?: { name: Field; entries: () => (File | string)[]; settle?: () => Promise<string | undefined> };
}) => {
  const { outcome, formAction, pending: sending, run, refill } = useFormAction(action);
  const [waiting, startWaiting] = useTransition();
  const pending = sending || waiting;
  const sentOf = (next: Pick<Outcome<Result>, "result" | "failed">) => {
    const step = next.failed ? undefined : stepOf<Extract<Result, Sent>>(next.result);
    return step?.step === "sent" ? step : null;
  };
  const [errors, setErrors] = useState<Partial<Record<Field | "form", string>>>(() =>
    messagesOf(outcome, fields, "form"),
  );
  const [sent, setSent] = useState(() => sentOf(outcome));
  const [shaking, setShaking] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const thanks = useRef<HTMLHeadingElement>(null);
  const focusing = useRef<Field>(undefined);
  const changeStep = useStepMotion(sent, () => card.current);

  useOutcome(outcome, (next) => {
    const done = sentOf(next);
    if (done) {
      setErrors({});
      setSent(done);
      return;
    }
    const found = messagesOf(next, fields, "form");
    setErrors(found);
    focusing.current = firstOf(found, fields);
    if (focusing.current || found.form) setShaking(true);
  });

  useEffect(() => {
    const target = focusing.current;
    focusing.current = undefined;
    if (target && card.current) focusField(card.current, target);
  }, [outcome]);

  useEffect(() => {
    if (sent) focusStep(thanks.current);
  }, [sent]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const found = check(data);
    const first = firstOf(found, fields);
    const refuse = (messages: Partial<Record<Field | "form", string>>, field: Field) => {
      setErrors(messages);
      setShaking(true);
      focusField(form, field);
    };
    if (first) return refuse(found as Partial<Record<Field | "form", string>>, first);
    setErrors({});
    const send = () => {
      if (files) {
        data.delete(files.name);
        for (const entry of files.entries()) data.append(files.name, entry);
      }
      run(data, (change, next) => (sentOf(next) ? changeStep(change) : change()));
    };
    const settle = files?.settle;
    if (!files || !settle) return send();
    startWaiting(async () => {
      const problem = await settle();
      const messages = { [files.name]: problem } as Partial<Record<Field | "form", string>>;
      startWaiting(() => (problem ? refuse(messages, files.name) : send()));
    });
  };

  const forget = (name: Field) =>
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));

  const frame = {
    ref: card,
    "data-shake": shaking ? "" : undefined,
    onAnimationEnd: (event: AnimationEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) setShaking(false);
    },
  };

  return {
    errors,
    failure: errors.form ?? "",
    pending,
    sent,
    thanks,
    frame,
    form: { action: formAction, onSubmit: submit },
    forget,
    refill,
  };
};
