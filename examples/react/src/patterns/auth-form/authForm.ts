import type { FormAction } from "../form-action/formAction.ts";

export type ResendResult = undefined | string | { sent: true };

export type ResendAction = FormAction<ResendResult>;

const mailboxes = [
  { domain: /^gmail\.com$/, label: "Open Gmail", href: "https://mail.google.com/" },
  { domain: /^(outlook|hotmail|live)\.com$/, label: "Open Outlook", href: "https://outlook.live.com/" },
  { domain: /^yahoo\./, label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" },
];

// The inbox a button can open for an address, by its domain.
export const mailboxOf = (email: string) => {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  return mailboxes.find((candidate) => candidate.domain.test(domain));
};

// Follows a link with a handler of the form's own, such as back to its first
// step, unless the click asked for something else, such as a new tab.
export const followsInPlace = (event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }) =>
  !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
