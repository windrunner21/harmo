import { useActionState, useState, useTransition } from "react";

export type FormAction<Result> = (previous: Result, data: FormData) => Result | Promise<Result>;

// An answer of messages: each under its field, and `form` in the form's main
// spot, as a message on its own is. `values` puts back what was typed, on the
// page a post renders: only in the fields a form keeps, so never a password.
export type FormMessages<Field extends string, Kept extends Field = never> = {
  [Name in Field | "form"]?: string;
} & { step?: never } & ([Kept] extends [never] ? unknown : { values?: { [Name in Kept]?: string } });

export interface Outcome<Result> {
  result: Result;
  failed: boolean;
  count: number;
}

export interface Refill {
  key: number;
  values: Partial<Record<string, string>>;
}

export const somethingWrong = "Something went wrong. Try again.";

// Next.js's redirect() and notFound() throw, for its router to catch.
const navigates = (error: unknown) => {
  const digest = typeof error === "object" && error !== null && "digest" in error ? error.digest : undefined;
  return typeof digest === "string" && /^NEXT_(REDIRECT|HTTP_ERROR_FALLBACK)\b/.test(digest);
};

const none: Refill["values"] = {};

const valuesOf = (result: unknown): Refill["values"] => {
  if (typeof result !== "object" || result === null || "step" in result || !("values" in result)) return none;
  const { values } = result;
  return typeof values === "object" && values !== null ? (values as Refill["values"]) : none;
};

// The action goes to useActionState, so that without JavaScript the form
// posts to it and the server renders its result. With JavaScript, the form
// calls it in a transition of its own: through the form's action, React would
// reset the form after each call, clearing what was typed, and send a thrown
// error to the nearest error boundary rather than to the form.
//
// `refill` is what the latest result rendered from a post puts back in the
// fields: a field takes its value as its default, keyed, so a later post
// fills it in again. An answer in the browser leaves it as it was: the fields
// keep what was typed, and a changed default would change a field not typed in.
export const useFormAction = <Result>(action: FormAction<Result>, initial?: Result) => {
  const [state, formAction, replaying] = useActionState<Result, FormData>(
    action as (previous: Awaited<Result>, data: FormData) => Result | Promise<Result>,
    initial as Awaited<Result>,
  );
  const served = state as Result;
  const [outcome, setOutcome] = useState<Outcome<Result>>({ result: served, failed: false, count: 0 });
  const [refill, setRefill] = useState<Refill>(() => ({ key: 0, values: valuesOf(served) }));
  const [seen, setSeen] = useState(served);
  const [pending, startTransition] = useTransition();

  if (served !== seen) {
    setSeen(served);
    setOutcome((current) => ({ result: served, failed: false, count: current.count + 1 }));
    setRefill((current) => ({ key: current.key + 1, values: valuesOf(served) }));
  }

  const run = (
    data: FormData,
    apply: (change: () => void, next: Omit<Outcome<Result>, "count">) => void = (change) => change(),
  ) =>
    startTransition(async () => {
      let next: Omit<Outcome<Result>, "count">;
      try {
        next = { result: await action(outcome.result, data), failed: false };
      } catch (error) {
        if (navigates(error)) throw error;
        next = { result: outcome.result, failed: true };
      }
      startTransition(() => apply(() => setOutcome((current) => ({ ...next, count: current.count + 1 })), next));
    });

  return { outcome, formAction, pending: pending || replaying, run, refill };
};

// Calls `apply` as the outcome changes, as React renders, so the server's
// render shows it too.
export const useOutcome = <Result>(outcome: Outcome<Result>, apply: (outcome: Outcome<Result>) => void) => {
  const [seen, setSeen] = useState(outcome);
  if (seen !== outcome) {
    setSeen(outcome);
    apply(outcome);
  }
};

export const stepOf = <Step extends { step: string }>(result: unknown): Step | undefined =>
  typeof result === "object" && result !== null && "step" in result ? (result as Step) : undefined;

// A result's messages, by the fields that have a spot for one: a message on
// its own, `form`, a thrown error's, and one for any other field go to `main`.
export const messagesOf = <Field extends string, Main extends string>(
  { result, failed }: Pick<Outcome<unknown>, "result" | "failed">,
  fields: readonly Field[],
  main: Main,
) => {
  const messages: Partial<Record<Field | Main, string>> = {};
  if (failed) messages[main] = somethingWrong;
  else if (typeof result === "string") {
    if (result) messages[main] = result;
  } else if (typeof result === "object" && result !== null && !("step" in result)) {
    const others: string[] = [];
    for (const [key, value] of Object.entries(result)) {
      if (typeof value !== "string" || value === "") continue;
      if ((fields as readonly string[]).includes(key)) messages[key as Field] = value;
      else others.push(value);
    }
    if (others.length > 0) messages[main] = [messages[main], ...others].filter(Boolean).join(" ");
  }
  return messages;
};

export const firstOf = <Field extends string>(messages: Partial<Record<Field, string>>, fields: readonly Field[]) =>
  fields.find((field) => messages[field]);

export const textOf = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

// The rule a browser checks an email field by, as the HTML standard gives
// it, with a dot in the domain: each of its labels starts and ends with a
// letter or digit, so "name@-example.com" isn't one.
const anEmail = /^[\w.!#$%&'*+\/=?^`{|}~-]+@[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i;

export const emailError = (email: string, missing = "Enter your email address.") =>
  !email ? missing : anEmail.test(email) ? undefined : "Enter an email address, such as name@example.com.";
