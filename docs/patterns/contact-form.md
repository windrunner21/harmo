# Contact Form

Forms that let people reach your team, ready to copy into your app. There are
four forms and a set of cards that lead to them:

| Use case | React | What it asks for |
| --- | --- | --- |
| A message | `ContactForm` | Name, email, and a message |
| A sales inquiry | `SalesContactForm` | Company email and full name, then an optional phone number, country, company website, and message |
| A support request | `SupportRequestForm` | Email, a topic, a subject, a message, and optional attachments |
| Help with an order | `OrderHelpForm` | Order number, email, what's wrong, and optional photos and message |
| Ways to reach you | `ContactOptions` | Nothing: cards for sales, support, and the help center, each with a link |

Each form is a raised [Card](../components/card.md) of
[Fields](../components/field.md), in React and in HTML. Once it's sent, a
thank-you takes its place.

## Try the demo

The playground's forms answer as a server would, after a moment. Type these to
see each answer:

| Form | Type | You see |
| --- | --- | --- |
| Any | Any email not listed here | The thank-you |
| Any | Email `fail@example.com` | "Your message didn't send. Try again in a moment." above the button |
| Any | Email `error@example.com` | "Something went wrong. Try again." above the button, as when the server can't be reached |
| Message, support | An email at `gmial.com` | "We can't deliver email to gmial.com. Did you mean gmail.com?" under the email |
| Sales | An email at `gmail.com`, `outlook.com`, or `yahoo.com` | "Use your company email address, not a personal one." under the email |
| Sales | A link in the message, such as `www.example.com` | "Your message can't have links in it." above the button |
| Support | A file that isn't a picture, a PDF, or text, such as an `.exe` | A message under the attachments, once you send |
| Support | A file whose name starts with `fail`, such as `fail.txt` | Its upload stops halfway, with "Try again"; it uploads the second time |
| Order help | Order number `9999` | "We can't find order 9999." under the order number |
| Order help | A photo that isn't a JPEG, PNG, or WebP, such as a `.heic` | A message under the photos, once you send |

The support form uploads each file as it's added, and the order form sends
its photos with the form, as [Files](#files) explains.

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. To work without JavaScript, a framework that runs React server actions, such as Next.js with its App Router, on Node.js 20 or newer |
| HTML | Harmo's CSS, and a script of your own, as [HTML](#html) says |
| Your server | Somewhere to keep each request, such as your database or your help desk's API, and a rate limit |
| Files | Only for the support and order forms: storage the browser uploads to, such as Amazon S3 or Cloudflare R2, or a larger request size limit, as [Files](#files) compares |
| Email | Only if your action emails your team |

[Security](#security) says what your server must do.

## React

### Install

```sh
npx harmo-ui add contact-form
```

It copies into `components/harmo/patterns/`:

- `contact-form/`, the five components, `useContactForm.ts`, which the four
  forms share, `attachments.ts`, for files, and `contact-form.css`;
- `form-action/formAction.ts`, which runs every pattern form's action;
- `step-motion/useStepMotion.ts`, which animates the card to its thank-you.

It also copies the Harmo components they use, and adds the stylesheet to
`harmo.css`. Delete the forms you don't need. Without the CLI, copy the same
files from [examples/react/src/patterns](../../examples/react/src/patterns),
and set them up as [Patterns](README.md#install) says.

### Use it

Write a server action that checks what was sent and answers. In a Next.js
app:

```ts
// app/contact/actions.ts
"use server";

import type { ContactFormResult } from "@/components/harmo/patterns/contact-form/ContactForm";

export async function sendMessage(previous: ContactFormResult, data: FormData): Promise<ContactFormResult> {
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  const values = { name, email, message };

  if (!name || name.length > 200) return { name: "Enter your name.", values };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { email: "Enter an email address, such as name@example.com.", values };
  if (!message || message.length > 1000) return { message: "Enter your message, up to 1,000 characters.", values };

  await saveMessage({ name, email, message });
  return { step: "sent", email };
}
```

`saveMessage` stands for your app's own, such as your database or your help
desk. Then give the action to the form:

```tsx
// app/contact/page.tsx
import { ContactForm } from "@/components/harmo/patterns/contact-form/ContactForm";
import { sendMessage } from "./actions";

export default function ContactPage() {
  return <ContactForm action={sendMessage} />;
}
```

That's all it takes. The form checks the fields, shows the button working
while your action runs, and shows its [answer](#answers). Before you ship it,
go through [Security](#security).

#### Without a server

Give `action` a plain async function instead. It gets the same `FormData`, and
returns the same answers:

```tsx
<ContactForm
  action={async (previous, data) => {
    const response = await fetch("/api/contact", { method: "POST", body: data });
    if (!response.ok) return "Your message didn't send. Try again in a moment.";
    return { step: "sent", email: String(data.get("email")) };
  }}
/>
```

### Files

The support form takes up to 5 attachments, and the order form up to 5
photos, of up to 10 MB each. There are two ways to get them to your server:

| | Upload to storage (recommended) | Send them with the form |
| --- | --- | --- |
| How | Each file goes from the browser straight to your storage as it's added, and the form sends only the keys they're stored under | The files go in the form's request, to your action |
| Setup | A storage bucket, a server action that signs each upload, and the form's `upload` prop | Next.js's request size limit raised to 52 MB, for every server action in your app |
| Hosting | Works on every host | Vercel takes at most 4.5 MB per request; Cloudflare up to 100 MB on its Free and Pro plans |
| Progress | Each file shows its progress, a check once it's stored, and "Try again" if it fails | None: the files go when the form is sent |
| Without JavaScript | The files field is hidden, and the rest of the form still sends | The files go with the form |

#### Upload to storage

You need a bucket the browser can upload to with a signed URL, such as Amazon
S3, Cloudflare R2, or another S3-compatible store, with CORS allowing `PUT`
from your site's origin with a `Content-Type` header. Then a server action
that signs each upload, here through `@aws-sdk/client-s3` and
`@aws-sdk/s3-request-presigner`:

```ts
// app/support/actions.ts
"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { SupportRequestFormResult } from "@/components/harmo/patterns/contact-form/SupportRequestForm";

// For R2, endpoint is https://<account id>.r2.cloudflarestorage.com; for S3, leave it out.
const storage = new S3Client({ region: process.env.STORAGE_REGION, endpoint: process.env.STORAGE_ENDPOINT });
const bucket = process.env.STORAGE_BUCKET;
const types = ["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain"];

export async function signUpload(type: string, size: number) {
  await limit("sign-upload");
  if (!types.includes(type) || !Number.isInteger(size) || size < 1 || size > 10_000_000) {
    throw new Error("That file can't be uploaded.");
  }
  const key = `support/${crypto.randomUUID()}`;
  const url = await getSignedUrl(storage, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: type }), {
    expiresIn: 300,
  });
  await rememberUpload(key);
  return { url, key };
}

const topics = ["account", "billing", "technical", "other"];

export async function sendSupportRequest(
  previous: SupportRequestFormResult,
  data: FormData,
): Promise<SupportRequestFormResult> {
  await limit("support-request");
  const email = String(data.get("email") ?? "").trim();
  const topic = String(data.get("topic") ?? "");
  const subject = String(data.get("subject") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  const keys = data.getAll("attachments").filter((key): key is string => typeof key === "string" && key !== "");
  const values = { email, topic, subject, message };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { email: "Enter an email address, such as name@example.com.", values };
  if (!topics.includes(topic)) return { topic: "Choose a topic.", values };
  if (!subject || subject.length > 200) return { subject: "Enter a subject, up to 200 characters.", values };
  if (!message || message.length > 2000) return { message: "Enter your message, up to 2,000 characters.", values };
  if (keys.length > 5) return { attachments: "Add up to 5 files.", values };

  const files = await claimUploads(keys);
  if (!files) return { attachments: "Those files can't be sent. Add them again.", values };

  await saveSupportRequest({ email, topic, subject, message, files });
  return { step: "sent", email };
}
```

`limit`, `rememberUpload`, `claimUploads`, and `saveSupportRequest` stand for
your app's own: a rate limit; a note of each key `signUpload` made; a check
that takes each key once, only if `signUpload` made it, and checks the stored
file, as [Security](#security) says; and where the request is kept.

Give the form `upload`, in a client component of yours, since a server page
can't pass a function. `putFile`, from `attachments.ts`, puts the file at the
signed URL and reports its progress:

```tsx
// app/support/SupportForm.tsx
"use client";

import { putFile } from "@/components/harmo/patterns/contact-form/attachments";
import { SupportRequestForm } from "@/components/harmo/patterns/contact-form/SupportRequestForm";
import { sendSupportRequest, signUpload } from "./actions";

export function SupportForm() {
  return (
    <SupportRequestForm
      action={sendSupportRequest}
      upload={async (file, report) => {
        const { url, key } = await signUpload(file.type, file.size);
        await putFile(url, file, report);
        return key;
      }}
    />
  );
}
```

The form calls `upload` for each file as it's added, with `report`:
`report.progress(percent)` shows how far it has got, and `report.signal`
aborts when the file is removed. `upload` returns the key the file is stored
under, and the action gets that key in the file's place. If `upload` throws,
the file says "That didn't upload. Check your connection." with "Try again".
Sending waits for uploads still running, and won't send while one has failed.

For storage that isn't S3-compatible, such as Vercel Blob, write `upload` with
its own client library: anything that stores the file and returns its key.
`putFile(url, file, report, headers)` takes headers, for storage that needs
more. Add a lifecycle rule to the bucket that deletes files under `support/` a
day after they're added, unless `claimUploads` moved them, to clear files that
were uploaded but never sent.

#### Send them with the form

Leave out `upload`, and the form sends the files themselves. Next.js takes at
most 1 MB per request to a server action, so raise its
[`bodySizeLimit`](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit):

```js
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: "52mb", // five files of 10 MB, and the rest of the form
    },
  },
};
```

That limit is for the whole app: every server action, sign-in included, then
accepts 52 MB from anyone, read before your action's rate limit runs, so limit
request size and rate at your host or proxy too. To stay under 1 MB instead,
lower `most` and `largest` at the top of the form's file. The action gets the
files as `File`s:

```ts
const files = data.getAll("attachments").filter((file): file is File => file instanceof File && file.size > 0);
if (files.length > 5 || files.some((file) => file.size > 10_000_000)) {
  return { attachments: "Add up to 5 files, 10 MB each.", values };
}
```

### Props

Every form takes:

| Prop | |
| --- | --- |
| `action` | Required. Your [form action](https://react.dev/reference/react/useActionState): a server action, or an async function of yours. It gets `(previous, data)`, `data` holding the form's fields, and returns one of the [answers](#answers) |
| `sentIcon` | An icon for the thank-you, such as an `<svg className="hicon">` of a check. Without it, there's none |
| `titleAs` | The tag of the title and the thank-you's: `"h2"` by default, for a page with its own `<h1>`. Use `"h1"` on a page that's only the form, or `"h3"` to `"h6"` |
| `privacyHref` | Required, and only, for `SalesContactForm`: where "privacy policy", under the button, leads |
| `upload` | Only for `SupportRequestForm` and `OrderHelpForm`: uploads each file as it's added, and returns its key, as [Upload to storage](#upload-to-storage) says. Without it, the files go with the form |

`ContactOptions` takes:

| Prop | |
| --- | --- |
| `salesHref` | Required. Where "Contact sales" leads |
| `supportEmail` | Required. The address in the support card's sentence, and where "Email support" writes to |
| `helpHref` | Required. Where "Visit the help center" leads |
| `salesIcon`, `supportIcon`, `helpIcon` | Each card's icon. A card without one has no icon tile |

```tsx
<ContactOptions
  salesHref="/contact/sales"
  supportEmail="support@example.com"
  helpHref="/help"
  salesIcon={<UserIcon className="hicon" />}
  supportIcon={<MessagesIcon className="hicon" />}
  helpIcon={<InfoIcon className="hicon" />}
/>
```

### Answers

Your action returns one of these:

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"Your message didn't send. Try again in a moment."` | Shows it above the button, and shakes the card |
| Messages by field, such as `{ email: "Use your company email address, not a personal one." }` | Shows each under its field, moves focus to the first, and shakes the card. `form`, or a message for a field with no place for one, such as the sales form's message, goes above the button |
| The same with `values`, such as `{ form: "Your message didn't send.", values: { name, email, message } }` | As above, and without JavaScript, fills in each field `values` names again |
| `{ step: "sent", … }` | Shows the thank-you, with what you give it, such as `email` |

If the action throws, the form shows "Something went wrong. Try again." above
the button. Next.js's `redirect()` and `notFound()` work as usual.

| Form | Fields it sends | Thank-you |
| --- | --- | --- |
| `ContactForm` | `name`, `email`, `message` | `{ step: "sent", email }` |
| `SalesContactForm` | `email`, `name`, `phone`, `country` (a region code, or `""`), `website`, `message` | `{ step: "sent" }` |
| `SupportRequestForm` | `email`, `topic`, `subject`, `message`, `attachments` (files, or keys with `upload`) | `{ step: "sent", email }` |
| `OrderHelpForm` | `order`, `email`, `problem`, `photos` (files, or keys with `upload`), `message` | `{ step: "sent", order, email }` |

Each form's types are named after it, such as `ContactFormResult` and
`ContactFormMessages`. TypeScript checks your answers against them: a message
only for a field the form has, `values` only for fields it fills in, never a
file, and what each thank-you needs. [Patterns](README.md#actions) explains
answers in more depth.

### Without JavaScript

Given a server action, each form works before its script runs, or without
one:

- It posts to your action as `multipart/form-data`, in the request's body.
- Your framework runs the action, and renders the page again with its answer:
  messages under their fields or above the button, or the thank-you.
- The page is new, so its fields are empty, except those your answer's
  `values` fills in. Files must be chosen again.
- Each Select, such as the support topic, is a native `<select>`, with the
  same options. One left on its placeholder isn't sent at all, so
  `data.get("topic")` is `null`: answer with a message for it.
- With `upload`, the files field is hidden, since uploading needs a script.
- The form's own checks, the shake, and the motion don't run. Your action's
  checks are the ones that count.

Given a function of yours instead, the form needs JavaScript. A submit made
before the script has loaded is held, then sent once it has.

## HTML

### Markup

The message form. The others are built the same way:

```html
<div class="hcard hcontact-form" data-variant="raised">
  <form class="hcontact-form-form" method="post" novalidate>
    <div class="hcontact-form-header">
      <h2 class="hcontact-form-title">Send us a message</h2>
      <p class="hcontact-form-description">We read every message, and reply within a day.</p>
    </div>
    <div class="hcontact-form-fields">
      <div class="hcontact-form-row">
        <div class="hfield">
          <label class="hlabel" for="contact-name">Name</label>
          <input class="hinput" id="contact-name" name="name" autocomplete="name"
            placeholder="Sam Lee" aria-describedby="contact-name-error" />
          <p class="herror" id="contact-name-error" aria-live="polite"></p>
        </div>
        <div class="hfield">
          <label class="hlabel" for="contact-email">Email</label>
          <input class="hinput" id="contact-email" name="email" type="email" autocomplete="email"
            placeholder="name@example.com" aria-describedby="contact-email-error" />
          <p class="herror" id="contact-email-error" aria-live="polite"></p>
        </div>
      </div>
      <div class="hfield">
        <label class="hlabel" for="contact-message">Message</label>
        <textarea class="htextarea hcontact-form-message" id="contact-message" name="message" maxlength="1000"
          placeholder="Tell us what you need, and anything that would help us answer."
          aria-describedby="contact-message-error contact-message-counter"></textarea>
        <p class="htextarea-counter" id="contact-message-counter">0/1000</p>
        <p class="herror" id="contact-message-error" aria-live="polite"></p>
      </div>
    </div>
    <div class="hcontact-form-submit">
      <p class="herror" aria-live="polite"></p>
      <button class="hbutton" type="submit">
        <span class="hbutton-label">Send message</span>
      </button>
    </div>
  </form>
  <div class="hempty-state" hidden>
    <div class="hempty-state-icon" aria-hidden="true">
      <svg class="hicon" …>…</svg>
    </div>
    <h2 class="hempty-state-title" tabindex="-1">Message sent</h2>
    <p class="hempty-state-description">
      Thanks for writing. We'll reply to <strong></strong> within a day.
    </p>
  </div>
</div>
```

Give the `<form>` an `action`, your server's endpoint for it, and it works
even without a script. The `.herror` in `.hcontact-form-submit` is for a send
that fails. A line under the button, such as the sales form's, is a
`<p class="hcontact-form-footer">` after `.hcontact-form-submit`. Load Harmo's
CSS, then `contact-form.css`.

The sales form's country is a [Select](../components/select.md) with a
search, in a Field marked Optional, with a native `<select>` that the form
sends, and that shows until `select.js` runs. The topic and the problem have
one too:

```html
<div class="hfield">
  <div class="hfield-label-row">
    <span class="hlabel" id="sales-country-label">Country</span>
    <span class="hfield-optional" id="sales-country-optional">Optional</span>
  </div>
  <span class="hselect-fallback">
    <select name="country" aria-labelledby="sales-country-label" aria-describedby="sales-country-optional">
      <option value="" disabled selected>Choose a country</option>
      <option value="AF">Afghanistan</option>
      …
    </select>
    <svg class="hexpand-chevron" …>…</svg>
  </span>
  <button class="hselect" id="sales-country" type="button" data-name="country" role="combobox"
    aria-labelledby="sales-country-label" aria-describedby="sales-country-optional"
    aria-haspopup="listbox" aria-expanded="false" aria-controls="sales-country-listbox"
    popovertarget="sales-country-popup" style="anchor-name: --sales-country">
    <span class="hselect-value" data-placeholder>Choose a country</span>
    …
  </button>
  <div class="hpopup" id="sales-country-popup" popover style="position-anchor: --sales-country">
    <div class="hlistbox-search">…</div>
    <ul class="hlistbox" id="sales-country-listbox" role="listbox" aria-labelledby="sales-country-label">
      <li class="hoption" id="sales-country-af" role="option" data-value="AF" aria-selected="false">
        <span class="hoption-label">Afghanistan</span>
      </li>
      …
    </ul>
    <p class="hlistbox-empty" role="status"></p>
  </div>
</div>
```

Files are a [File Input](../components/file-input.md) that takes several,
followed by a [File List](../components/file-list.md), in a form that posts as
multipart:

```html
<form class="hcontact-form-form" method="post" enctype="multipart/form-data" novalidate>
  …
  <div class="hfield">
    <div class="hfield-label-row">
      <label class="hlabel" for="support-attachments">Attachments</label>
      <span class="hfield-optional" id="support-attachments-optional">Optional</span>
    </div>
    <p class="hdescription" id="support-attachments-description">Up to 5 screenshots or files that show the problem, 10 MB each.</p>
    <div class="hfile-input" data-variant="strip">
      <span class="hfile-input-drop">or drop them here</span>
      <label class="hbutton" data-variant="secondary">
        <input class="hfile-input-control" id="support-attachments" name="attachments" type="file" multiple
          aria-describedby="support-attachments-optional support-attachments-description support-attachments-error" />
        …
        <span class="hbutton-label">Add files</span>
      </label>
    </div>
    <p class="herror" id="support-attachments-error" aria-live="polite"></p>
  </div>
  <ul class="hfile-list" role="list" aria-label="Attachments" tabindex="-1"></ul>
  …
</form>
```

Write the empty File List with nothing between its tags, so `:empty` matches
it. For the order's photos, name the input `photos`, add `accept="image/*"`
to it, and `data-layout="grid"` to the list. To upload files as they're
added, put `hidden` on the files' `.hfield`, and take it off in your script,
so without one the field stays hidden.

The ways to reach you:

```html
<ul class="hcontact-options" role="list">
  <li class="hcard hcontact-options-item" data-variant="raised">
    <span class="hcard-icon" aria-hidden="true"><svg class="hicon" …>…</svg></span>
    <h2 class="hcard-title">Sales</h2>
    <p class="hcard-description">We'd love to talk about how we can work together, and find the plan that fits your team.</p>
    <a class="hbutton hcontact-options-link" data-variant="secondary" href="/contact/sales">
      <span class="hbutton-label">Contact sales</span>
    </a>
  </li>
  <li class="hcard hcontact-options-item" data-variant="raised">
    …
    <h2 class="hcard-title">Support</h2>
    <p class="hcard-description">
      For help with your account, billing, or anything else, write to
      <a class="hlink" href="mailto:support@example.com">support@example.com</a>.
    </p>
    <a class="hbutton hcontact-options-link" data-variant="secondary" href="mailto:support@example.com">
      <span class="hbutton-label">Email support</span>
    </a>
  </li>
  …
</ul>
```

### Classes

| Class or attribute | What it's for |
| --- | --- |
| `.hcontact-form` on a raised `.hcard` | The card, holding the form, then the thank-you |
| `.hcontact-form-form` | The form |
| `.hcontact-form-header` | The title with a description under it |
| `.hcontact-form-title` | The title |
| `.hcontact-form-description` | The description |
| `.hcontact-form-fields` | The fields. An empty `.hfile-list` takes no room |
| `.hcontact-form-row` | Fields side by side, one over the other where there isn't room |
| `.hcontact-form-message` on a `.htextarea` | A message, four lines tall to start |
| `.hcontact-form-submit` | A send's error and the button. The error takes no room while it's empty |
| `.hcontact-form-footer` | A line under the button |
| `.hempty-state` in `.hcontact-form` | The thank-you. Its title shows no focus ring |
| `data-shake` on `.hcontact-form` | Shakes the card once, unless reduced motion is asked for. Remove it at the card's own `animationend`, so the next failure shakes it again |
| `.hcontact-options` | Cards side by side |
| `.hcontact-options-item` on a raised `.hcard` | A card with its parts one over the other |
| `.hcontact-options-link` | The card's link, at its bottom |

### What your script does

[contact-form.js](../../examples/html/src/scripts/contact-form.js) is an
example. The Select, the TextArea's counter, and the files use those
components' example scripts: `select.js` and `listbox.js`, `textarea.js`, and
`file-input.js` and `file-list.js`.

**On submit:**

1. Call `preventDefault()`. `novalidate` leaves the checks to the script.
2. Check each field. Put an error in the `.herror` of each one that's required
   and empty, or isn't right, with `aria-invalid="true"` on its control, and
   clear the others. Move focus to the first field in error, for a Select its
   trigger, found by its `data-name`. Add `data-shake` to the card, and stop.
3. Show the button working: `aria-busy="true"`, `aria-disabled="true"`, and a
   `.hspinner` after its label. Ignore another submit meanwhile.
4. With uploads, wait for those still running. If a file didn't upload, put
   "Some files didn't upload. Try them again, or remove them." under the
   files, and stop.
5. Send the form's data. For files, send what the File List holds under the
   File Input's `name`: the files, or with uploads, their keys.
6. Clear the messages, then show the answer:
   - nothing: leave the form as it is, as your server has redirected;
   - a message, or a thrown error's "Something went wrong. Try again.": put
     it in `.hcontact-form-submit > .herror`, and shake the card;
   - messages by field: put each in its field's `.herror`, as for the form's
     own checks, and one for a field with none above the button;
   - `{ step: "sent", … }`: show the thank-you, below.

**Once sent:** fill in what the answer gives, such as `email`. Add `hidden` to
the form and remove it from `.hempty-state`. Move focus to
`.hempty-state-title` with `focus({ preventScroll: true })`, then
`scrollIntoView({ block: "nearest" })`, smoothly unless reduced motion is
asked for. Animate the change as
[Moving between steps](README.md#moving-between-steps) says.

**As people type:** on `input` in a field, a Select's choice, or a file added
or removed, take that field's error away. A File Input's own refusal, such as
"Add up to 5 files.", stays. Remove `data-shake` at the card's own
`animationend`, not one that bubbles up from inside it.

**Files:** choose, refuse, list, and remove them as File Input and File List
describe. Once the last file is removed, move focus to the File Input.

**Uploads**, if your form uploads files as they're added: take `hidden` off
the files' `.hfield`. Upload each file as it's added, showing its progress as
File List does, `data-status="uploading"` on its row. Once stored, keep its
key, and show `data-status="done"`. If it fails, show `data-status="error"`,
a `.hfile-list-error`, and a "Try again" button described by the file's name.
When a file is removed, abort its upload.

## Security

The form checks fields for the person typing. It's not a defense: anyone can
send your action anything. Your server must:

- **Check everything again**, each field's length as well as its format,
  since `maxlength` only stops a browser.
- **Limit how often the form can be sent**, by network address, or by account
  for someone signed in, before your action does anything that costs, such as
  sending an email. Never limit by the email typed, which the sender picks.
- **Check a website before you keep it**, as the sales form does, and keep the
  address it reads, so `javascript:alert(document.domain).com` never becomes a
  link in your sales tool:

  ```ts
  const websiteOf = (text: string) => {
    const address = /^[a-z][a-z\d+-]*:/i.test(text) ? text : `https://${text}`;
    const url = /\s/.test(text) || !URL.canParse(address) ? null : new URL(address);
    return url && /^https?:$/.test(url.protocol) && url.hostname.includes(".") && !url.username && !url.password
      ? url.href
      : undefined;
  };
  ```

- **Keep line breaks out of email headers.** Before a field goes in a header,
  such as the subject or `Reply-To`, take out every CR and LF, or leave it to
  your mail library's header encoding. Otherwise someone can add headers of
  their own, such as a `Bcc`.
- **Never send what was submitted to the address submitted**, as an
  auto-reply that repeats the message would. Anyone can type someone else's
  address. If you reply at all, say only that you got it.
- **Check files on the server**: how many, how large, and what they are, by
  their content, never by their names or the types the browser gives. Keep
  them away from what your site serves, under names of your own.
- **With `upload`, trust only keys you made.** Sign uploads only for types and
  sizes you take, behind a rate limit. In the action, take each key only once,
  and only if `signUpload` made it. A signed URL doesn't limit what's put
  there, so check the stored file's size, with `HeadObjectCommand`, and what
  it is, by its first bytes, before you use it.
- **Treat every field as untrusted text.** Escape it wherever it's shown, such
  as in an email to your team. React escapes what it renders; HTML you build
  yourself doesn't.
- **Never trust `previous`.** It always comes from the browser, as
  [Patterns](README.md#never-trust-previous) explains.
- **Give back in `values` only what the person typed**, each field by name.
  Never `Object.fromEntries(data)`, which holds every field posted.

The forms themselves post what's typed in the request's body, never in the
page's address, and never log it: a message can hold anything, a password
included. Keep it out of your own logs too.

## Customize

- **Words**: they're written in, in English. Change them in your copy, or put
  your app's translation calls in their place. For country names, pass your
  language to `Intl.DisplayNames` and to `localeCompare`.
- **Placeholders**: they're examples, such as "name@example.com". Write ones
  that fit your app, such as your own order number format. A rule someone
  needs while typing goes in the field's description, which stays.
- **A field**: add it to the form with a `name`, and to the form's messages
  type: its first list is every field, its second the fields `values` fills
  in. Give its control `key={refill.key}` and
  `defaultValue={refill.values.yourField}`. If it has an error, add it to
  `fields` in the form's `useContactForm` call, and to `check` if the form
  checks it.
- **Two short fields side by side**: put both in a `.hcontact-form-row`.
- **Optional fields**: a required field has no "Optional". Give one that isn't
  `optional="Optional"`.
- **Message height**: set `--htextarea-min-height` on it, or take off
  `hcontact-form-message` for one line. A TextArea's `rows` does nothing.
- **The phone number**: [Phone Input](../components/phone-input.md) can take
  the Input's place. It checks the number for its country, and needs the
  libphonenumber-js package.
- **Countries, topics, and problems**: change the Select's options, or give
  it a `defaultValue`, such as the country you've found for the person.
- **Photos only when needed**: hold the Select's value, with `value` and
  `onValueChange`, and show the photos only for "damaged" or "wrong item".
- **File limits**: `most` and `largest`, at the top of each form's file. Check
  them again in your action.
- **Headings**: titles are `<h2>`, for a page with its own `<h1>`. Pass
  `titleAs="h1"` on a page that's only the form. In HTML, change the tags.
- **No card**: take `hcard` and `data-variant` off `.hcontact-form` for a form
  on the page's own surface, such as in a [Section](../components/section.md).

## Accessibility

- Each field is named by its label. Its "Optional" and its error are read with
  it, through `aria-describedby`. A Select's button is named and described the
  same way, and so is the native `<select>` without JavaScript.
- Errors are polite live regions, in the page from the start, empty, so a
  screen reader reads each one as it appears, after the field that takes
  focus. Without JavaScript, the server's messages are in the page as it
  loads, each read with its field.
- Placeholders are examples, not the fields' names: each field keeps its
  visible label, since a placeholder goes as soon as someone types.
- `autocomplete` on the name, email, phone number, and website lets a browser
  fill them in.
- After a failed send, focus stays on the button, so pressing it again tries
  again. Messages by field move it to the first field with one.
- Once sent, focus moves to the thank-you's title: a heading with
  `tabindex="-1"`, which a screen reader reads as it takes focus. It shows no
  focus ring, since it isn't a control.
- Each upload's progress bar is named by its file. A failed upload's message
  is announced, and its "Try again" button is described by the file's name,
  so several are told apart. Once the last file is removed, focus moves to the
  File Input, since the empty list takes no room.
- Each contact option's title is a heading, and its link is named by its own
  text. The support card shows the address as well as linking to it, so it
  can be copied. It's semibold as well as in the link's color, so color isn't
  the only thing that marks it, as WCAG 1.4.1 asks.
- The shake only repeats what the errors say, so reduced motion loses nothing.

## Design details

**Every form:**

- A raised Card, at most 576px wide, with 42px (`--harmo-space-lg`) padding:
  the title, a description 6px (`--harmo-space-2xs`) under it, the fields,
  and a button as wide as the form, 26px (`--harmo-space-md`) apart. Fields
  are 16px (`--harmo-space-sm`) apart.
- The title is 20px bold, its line trimmed to the top of its capitals with
  `text-box`. The description is 14px, in `--harmo-color-text-secondary`.
- Short fields, such as name and email, sit side by side, each at least 208px
  wide, and stack where there isn't room.
- Fields that can be left empty say "Optional" beside their label. Each text
  field has a placeholder that's an example: "Sam Lee"; "name@example.com",
  or "name@company.com" for a work email; "https://example.com"; an order
  number, "1042". A Select keeps its own "Choose a …".
- Each message is a TextArea with a counter, four lines tall to start, 94px,
  growing from there.
- An error shakes the card once: 12px each way, in 300ms
  (`--harmo-duration-slow`). A message for the whole form goes above the
  button, 6px over it.
- Once sent, the thank-you is an [Empty State](../components/empty-state.md),
  centered, with the card's padding: an icon if you give one, a title, and a
  line on what happens next. The card grows or shrinks to it, easing out
  (`--harmo-ease-out-cubic`), 200ms (`--harmo-duration-normal`) for a small
  change, plus half a millisecond per pixel, up to 350ms. The form goes at
  once, and the thank-you fades in over 200ms. Under reduced motion, the card
  takes its new height at once, and only the fade plays.

**The message form**, `ContactForm`: name and email side by side, then a
message of up to 1,000 characters, and "Send message". Its thank-you, "Message
sent", repeats the email.

**The sales form**, `SalesContactForm`, for a sales page, often beside a
pitch: company email and full name, then an optional phone number and
country, side by side, an optional company website, and an optional message
of up to 300 characters. "Send inquiry", with a line under it, 14px in
`--harmo-color-text-secondary`, that links to your privacy policy. Its
thank-you, "Inquiry received", says you'll reply within one business day.

- The phone number is an `<Input type="tel">`, checked only for digits and a
  phone number's punctuation, with at least seven digits.
- The country is a Select with a search. Its options are region codes, named
  in English by `Intl.DisplayNames` and sorted by name: the ISO 3166 codes,
  less six where no one lives, such as Antarctica, 243 in all. The form sends
  the code, such as `DE`.
- A website can be typed with or without `https://`: an `http` or `https`
  address, to a host with a dot in it.

**The support form**, `SupportRequestForm`: email and topic side by side, then
a subject, a message of up to 2,000 characters, and attachments: up to five
files of 10 MB each, chosen or dropped, shown in a File List under the File
Input. "Send request"; its thank-you repeats the email.

**The order form**, `OrderHelpForm`, for a shop: order number and email side
by side, then what's wrong: it arrived damaged, an item is missing, I got the
wrong item, or I'd like to return it. Then optional photos, only pictures, up
to five of 10 MB each, shown as a grid of thumbnails, and an optional message
of up to 1,000 characters. "Send request"; its thank-you names the order and
the email.

**The contact options**, `ContactOptions`: raised Cards side by side, each at
least 224px wide, 16px apart, stacking where there isn't room. Each has 26px
of padding: the icon in its tile, the title, the description, and a secondary
Button that's a link, 16px under the text. The links line up at the bottom.
The support address in its sentence is a [Link](../components/link.md), not
underlined, semibold (`--harmo-font-weight-semibold`).

| Card | Link |
| --- | --- |
| Sales | "Contact sales", to your sales page |
| Support | "Email support", a `mailto:` link. The description shows the address too |
| Help center | "Visit the help center", to your guides |
