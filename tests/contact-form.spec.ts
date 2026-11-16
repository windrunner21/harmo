import { expect, type Locator, type Page } from "@playwright/test";
import {
  animations,
  boxes,
  colorOf,
  example,
  fadingIn,
  onEachPlayground,
  openPopup,
  release,
  resizing,
  settled,
  shakesOf,
  slowDownSteps,
  test,
} from "./playgrounds.ts";

// What docs/patterns/contact-form.md says, on the Contact Form page: each form
// is a raised Card; sending checks the fields first, puts each error under its
// field, moves focus to the first field in error, and shakes the card once,
// unless reduced motion is asked for; then the button works while the form's
// data goes to the action, the files the form holds with it, and a thank-you
// takes the form's place and focus, filled in from the action's answer, the
// card's height going from the form's to the thank-you's, easing out,
// as the thank-you fades in, with nothing left inline; under reduced motion,
// the height changes at once and the thank-you still fades in. A message the
// action answers with goes above the button; one for a field goes under that
// field, which takes focus, as the form's own errors do, unless the field has
// no error of its own, when it goes above the button too; and an action that
// throws says "Something went wrong. Try again." Each control is named, so
// the form can be sent without its script: the HTML forms post, with files as
// multipart, and React holds its forms until it runs. The examples' stand-in
// answers what's sent from fail@example.com with a message and throws for
// error@example.com, and turns down an address at gmial.com in a message or
// a support request, a personal address or a link in the message in a sales
// inquiry, a file that isn't a picture, a PDF, or text in a support request,
// a photo that isn't a JPEG, PNG, or WebP, and order 9999.
const parts = async (page: Page, id = "contact-form-default") => {
  const container = await example(page, id);
  const card = container.locator(".hcontact-form");
  const form = card.locator("form");
  const thanks = card.locator(".hempty-state");
  return {
    container,
    card,
    form,
    thanks,
    title: thanks.locator(".hempty-state-title"),
    failure: form.locator(".hcontact-form-submit > .herror"),
    button: form.locator(".hcontact-form-submit > .hbutton"),
  };
};
const errorOf = (control: Locator) =>
  control.evaluate(
    (node) =>
      document.getElementById(`${node.getAttribute("aria-describedby")?.split(" ").find((id) => id.endsWith("-error"))}`)
        ?.textContent ?? "",
  );
// Sends a form, then expects the message the app gave for a field under it:
// the field invalid and focused, the card shaking, nothing above the button,
// and the form still there.
const expectFieldMessage = async (
  { card, form, thanks, failure, button }: Awaited<ReturnType<typeof parts>>,
  control: Locator,
  message: string,
) => {
  await button.click();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect.poll(() => errorOf(control)).toBe(message);
  await expect.poll(() => shakesOf(card)).toBeGreaterThan(0);
  await expect(control).toHaveAttribute("aria-invalid", "true");
  await expect(control).toBeFocused();
  await expect(failure).toBeEmpty();
  await expect(form).toBeVisible();
  await expect(thanks).toBeHidden();
};

const png = (name = "box.png") => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"),
});
const text = (name: string) => ({ name, mimeType: "text/plain", buffer: Buffer.from("notes") });

const inReact = (page: Page) => page.url().includes("/examples/react/");

// Fills a support request in, with a topic, ready to send.
// Chooses an option once its list has opened and settled, so the click
// doesn't land where the opening list hasn't reached yet.
const choose = async (container: Locator, select: string, option: string) => {
  await container.getByRole("combobox", { name: select }).click();
  const popup = openPopup(container);
  await expect(popup).toBeVisible();
  await settled(popup);
  await popup.locator(`.hoption:has-text("${option}")`).click();
};

const fillSupportRequest = async ({ container, form }: Awaited<ReturnType<typeof parts>>, email = "sam@example.com") => {
  await form.getByLabel("Email").fill(email);
  await choose(container, "Topic", "Billing");
  await form.getByLabel("Subject").fill("A refund");
  await form.getByLabel("Message").fill("Hello");
};

// Fills an order help request in, with what's wrong, ready to send.
const fillOrderHelp = async ({ container, form }: Awaited<ReturnType<typeof parts>>, order = "1042") => {
  await form.getByLabel("Order number").fill(order);
  await form.getByLabel("Email").fill("sam@example.com");
  await choose(container, "What's wrong?", "An item is missing");
};

onEachPlayground("contact-form", () => {
  test("a raised Card, with the name and email side by side, and the button the form's width", async ({ page }) => {
    const { card, form, button } = await parts(page);
    await expect(card).toHaveAttribute("data-variant", "raised");
    await expect(card).toHaveCSS("padding-top", "42px");
    const [box, submit, name, email] = await boxes(card, button, form.getByLabel("Name"), form.getByLabel("Email"));
    expect(submit!.width).toBeCloseTo(box!.width - 2 * 43, 0);
    expect(email!.y).toBeCloseTo(name!.y, 0);
    expect(email!.x).toBeGreaterThan(name!.x + name!.width);
  });

  test("sent with nothing typed, each field says what's missing, the first takes focus, and the card shakes", async ({ page }) => {
    const { card, form, button } = await parts(page);
    const name = form.getByLabel("Name");
    const email = form.getByLabel("Email");
    const message = form.getByLabel("Message");
    await button.click();
    await expect.poll(() => errorOf(name)).toBe("Enter your name.");
    expect(await errorOf(email)).toBe("Enter your email address.");
    expect(await errorOf(message)).toBe("Enter your message.");
    for (const field of [name, email, message]) await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();
    await expect.poll(() => shakesOf(card)).toBe(1);
  });

  test("an email that isn't an address says so, and typing in the field takes its error away", async ({ page }) => {
    const { form, button } = await parts(page);
    const email = form.getByLabel("Email");
    await form.getByLabel("Name").fill("Sam");
    await email.fill("sam");
    await form.getByLabel("Message").fill("Hello");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter an email address, such as name@example.com.");
    await expect(email).toBeFocused();
    await email.pressSequentially("@example.com");
    await expect.poll(() => errorOf(email)).toBe("");
    await expect(email).not.toHaveAttribute("aria-invalid");
  });

  test("sent, the button works for a moment, then a thank-you with the email takes the form's place and focus", async ({ page }) => {
    const { form, thanks, title, button } = await parts(page);
    await form.getByLabel("Name").fill("Sam");
    await form.getByLabel("Email").fill("sam@example.com");
    await form.getByLabel("Message").fill("Hello");
    await expect(form.locator(".htextarea-counter")).toHaveText("5/1000");
    await expect(thanks).toBeHidden();
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect(thanks).toBeVisible();
    await expect(form).toBeHidden();
    await expect(title).toHaveText("Message sent");
    await expect(title).toBeFocused();
    await expect(thanks.locator("strong")).toHaveText("sam@example.com");
  });

  test("sent, the card's height goes from the form's to the thank-you's as the thank-you fades in, and nothing is left inline", async ({ page }) => {
    const { container, card, form, thanks, title, button } = await parts(page);
    await slowDownSteps(container);
    await form.getByLabel("Name").fill("Sam");
    await form.getByLabel("Email").fill("sam@example.com");
    await form.getByLabel("Message").fill("Hello");
    const [before] = await boxes(card);
    await button.click();
    await expect(title).toBeFocused();

    const resize = await resizing(card);
    expect(resize, "a size animation").toBeDefined();
    expect(resize!.from).toBeCloseTo(before!.height, 0);
    expect(resize!.to).toBeLessThan(resize!.from);
    expect(resize!.height).toBeGreaterThan(resize!.to);
    expect(resize!.easing).toBe("cubic-bezier(0.215, 0.61, 0.355, 1)");
    await expect(card).toHaveCSS("overflow", "clip");
    expect(await fadingIn(thanks)).toBe(true);

    await release(card);
    await expect(card).not.toHaveAttribute("style");
    const [after] = await boxes(card);
    expect(after!.height).toBeCloseTo(resize!.to, 0);
  });

  test("under reduced motion, sent, the card takes the thank-you's height at once, and the thank-you still fades in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { container, card, form, thanks, title, button } = await parts(page);
    await slowDownSteps(container);
    await form.getByLabel("Name").fill("Sam");
    await form.getByLabel("Email").fill("sam@example.com");
    await form.getByLabel("Message").fill("Hello");
    await button.click();
    await expect(title).toBeFocused();
    expect(await resizing(card)).toBeUndefined();
    expect(await animations(card)).toBe(0);
    await expect(card).not.toHaveAttribute("style");
    expect(await fadingIn(thanks)).toBe(true);
  });

  test("a send that fails says so above the button, keeps the form, and shakes the card", async ({ page }) => {
    const { card, form, thanks, failure, button } = await parts(page);
    await form.getByLabel("Name").fill("Sam");
    await form.getByLabel("Email").fill("fail@example.com");
    await form.getByLabel("Message").fill("Hello");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(failure).toHaveText("Your message didn't send. Try again in a moment.");
    await expect(failure).toHaveAttribute("aria-live", "polite");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect.poll(() => shakesOf(card)).toBeGreaterThan(0);
    await expect(form).toBeVisible();
    await expect(thanks).toBeHidden();
    await settled(failure);
    const [error, submit] = await boxes(failure, button);
    expect(submit!.y - (error!.y + error!.height)).toBeCloseTo(6, 0);
  });

  test("an action that throws says something went wrong above the button, keeps the form, and shakes the card", async ({ page }) => {
    const { card, form, thanks, failure, button } = await parts(page);
    await form.getByLabel("Name").fill("Sam");
    await form.getByLabel("Email").fill("error@example.com");
    await form.getByLabel("Message").fill("Hello");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(failure).toHaveText("Something went wrong. Try again.");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect.poll(() => shakesOf(card)).toBeGreaterThan(0);
    await expect(form).toBeVisible();
    await expect(thanks).toBeHidden();
  });

  test("a message the app gives for a field, here the email, goes under that field, which takes focus, and the card shakes", async ({ page }) => {
    const elements = await parts(page);
    const { form } = elements;
    const email = form.getByLabel("Email");
    await form.getByLabel("Name").fill("Sam");
    await email.fill("sam@gmial.com");
    await form.getByLabel("Message").fill("Hello");
    await expectFieldMessage(elements, email, "We can't deliver email to gmial.com. Did you mean gmail.com?");
    expect(await errorOf(form.getByLabel("Name"))).toBe("");
  });

  test("the sales form's message for a personal address goes under the email", async ({ page }) => {
    const elements = await parts(page, "contact-form-sales-inquiry");
    const { form } = elements;
    const email = form.getByLabel("Company email");
    await email.fill("sam@gmail.com");
    await form.getByLabel("Full name").fill("Sam Lee");
    await expectFieldMessage(elements, email, "Use your company email address, not a personal one.");
  });

  test("a message for a field with no error of its own, the sales form's message, goes above the button, and the card shakes", async ({ page }) => {
    const { card, form, thanks, failure, button } = await parts(page, "contact-form-sales-inquiry");
    await form.getByLabel("Company email").fill("sam@example.com");
    await form.getByLabel("Full name").fill("Sam Lee");
    await form.getByLabel("Message").fill("See https://example.com");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(failure).toHaveText("Your message can't have links in it. Take them out, and send it again.");
    await expect.poll(() => shakesOf(card)).toBeGreaterThan(0);
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
    await expect(form).toBeVisible();
    await expect(thanks).toBeHidden();
  });

  test("the support form's message for an address that can't receive email goes under the email", async ({ page }) => {
    const elements = await parts(page, "contact-form-support-request");
    const email = elements.form.getByLabel("Email");
    await fillSupportRequest(elements, "sam@gmial.com");
    await expectFieldMessage(elements, email, "We can't deliver email to gmial.com. Did you mean gmail.com?");
  });

  test("the support form's files reach the action: one it can't open gets a message under the File Input, which takes focus, until another is added", async ({ page }) => {
    const elements = await parts(page, "contact-form-support-request");
    const { card, form, thanks, failure, button } = elements;
    const input = form.locator(".hfile-input-control");
    const error = form.locator(".hfile-input + .herror");
    await fillSupportRequest(elements);
    await input.setInputFiles([text("log.txt"), { name: "setup.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") }]);
    await expect(form.locator(".hfile-list-item")).toHaveCount(2);
    // Uploaded first, so the answer comes in time to see the card shake.
    await expect(form.locator('.hfile-list-item[data-status="done"]')).toHaveCount(2);
    await button.click();
    await expect(error).toHaveText("setup.exe isn't a file we can open. Send screenshots, PDFs, or text files.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toBeFocused();
    await expect.poll(() => shakesOf(card)).toBeGreaterThan(0);
    await expect(failure).toBeEmpty();
    await expect(thanks).toBeHidden();
    await input.setInputFiles(text("notes.txt"));
    await expect(error).toBeEmpty();
    await expect(input).not.toHaveAttribute("aria-invalid");
  });

  test("the support form sends its files' keys once they've uploaded, and once sent, thanks with the email from the answer", async ({ page }) => {
    const elements = await parts(page, "contact-form-support-request");
    const { form, thanks, title, button } = elements;
    await fillSupportRequest(elements);
    await form.locator(".hfile-input-control").setInputFiles([png(), text("log.txt")]);
    await button.click();
    await expect(title).toBeFocused();
    await expect(title).toHaveText("Request sent");
    await expect(thanks.locator("strong")).toHaveText("sam@example.com");
  });

  test("the support form uploads each file as it's added: its progress, then a check", async ({ page }) => {
    const { form } = await parts(page, "contact-form-support-request");
    const row = form.locator(".hfile-list-item");
    const bar = row.locator(".hfile-list-progress");
    await form.locator(".hfile-input-control").setInputFiles(text("log.txt"));
    await expect(row).toHaveAttribute("data-status", "uploading");
    await expect(bar).toHaveAttribute("role", "progressbar");
    await expect(bar).toHaveAccessibleName("log.txt");
    await expect.poll(async () => Number(await bar.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    await expect(row).toHaveAttribute("data-status", "done");
    await expect(bar).toHaveAttribute("aria-valuenow", "100");
    await expect(row.locator(".hfile-list-done")).toBeVisible();
  });

  test("sending waits for an upload still running, the button working meanwhile", async ({ page }) => {
    const elements = await parts(page, "contact-form-support-request");
    const { form, title, button } = elements;
    await fillSupportRequest(elements);
    await form.locator(".hfile-input-control").setInputFiles(text("log.txt"));
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(form.locator(".hfile-list-item")).toHaveAttribute("data-status", "uploading");
    await expect(title).toBeFocused();
  });

  test("a file that doesn't upload says so, with a way to try again; sending meanwhile asks for it", async ({ page }) => {
    const elements = await parts(page, "contact-form-support-request");
    const { card, form, title, button } = elements;
    const input = form.locator(".hfile-input-control");
    const row = form.locator(".hfile-list-item");
    await fillSupportRequest(elements);
    await input.setInputFiles(text("fail-log.txt"));
    await expect(row).toHaveAttribute("data-status", "error");
    await expect(row.locator(".hfile-list-error")).toHaveText("That didn't upload. Check your connection.");
    await expect(row.locator(".hfile-list-progress")).toHaveCount(0);
    await button.click();
    await expect(form.locator(".hfile-input + .herror")).toHaveText("Some files didn't upload. Try them again, or remove them.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toBeFocused();
    await expect.poll(() => shakesOf(card)).toBeGreaterThan(0);
    const retry = row.getByRole("button", { name: "Try again" });
    await expect(retry).toHaveAccessibleDescription("fail-log.txt");
    await retry.click();
    await expect(form.locator(".hfile-input + .herror")).toBeEmpty();
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(row.locator(".hfile-list-error")).toHaveCount(0);
    await expect(row.locator(".hfile-list-detail")).toBeVisible();
    await expect(row).toHaveAttribute("data-status", "done");
    await button.click();
    await expect(title).toBeFocused();
  });

  test("removing a file mid-upload stops it, and sending doesn't wait for it", async ({ page }) => {
    const elements = await parts(page, "contact-form-support-request");
    const { form, title, button } = elements;
    await fillSupportRequest(elements);
    await form.locator(".hfile-input-control").setInputFiles(text("log.txt"));
    await expect(form.locator(".hfile-list-item")).toHaveAttribute("data-status", "uploading");
    await form.getByRole("button", { name: "Remove log.txt" }).click();
    await button.click();
    await expect(title).toBeFocused();
  });

  test("the order form's message for an order it can't find goes under the order number, the email's left alone", async ({ page }) => {
    const elements = await parts(page, "contact-form-order-help");
    const { form } = elements;
    const order = form.getByLabel("Order number");
    await fillOrderHelp(elements, "9999");
    await expectFieldMessage(elements, order, "We can't find order 9999. Check the number in your order confirmation.");
    expect(await errorOf(form.getByLabel("Email"))).toBe("");
    await expect(form.getByLabel("Email")).not.toHaveAttribute("aria-invalid");
  });

  test("the order form's photos reach the action: one it can't open gets a message under the photos", async ({ page }) => {
    const elements = await parts(page, "contact-form-order-help");
    const { form, thanks, button } = elements;
    const input = form.locator(".hfile-input-control");
    await fillOrderHelp(elements);
    await input.setInputFiles([png(), { ...png("photo.heic"), mimeType: "image/heic" }]);
    await expect(form.locator(".hfile-list-item")).toHaveCount(2);
    await button.click();
    await expect(form.locator(".hfile-input + .herror")).toHaveText("photo.heic isn't a photo we can open. Send a JPEG, PNG, or WebP.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toBeFocused();
    await expect(thanks).toBeHidden();
  });

  test("each form's controls are named, so it can be sent without its script", async ({ page }) => {
    const named = {
      "contact-form-default": ["name", "email", "message"],
      "contact-form-sales-inquiry": ["email", "name", "phone", "country", "website", "message"],
      "contact-form-support-request": ["email", "topic", "subject", "message", "attachments"],
      "contact-form-order-help": ["order", "email", "problem", "photos", "message"],
    };
    for (const [id, names] of Object.entries(named)) {
      const { form } = await parts(page, id);
      const controls = form.locator("input, textarea, select");
      expect(await controls.evaluateAll((all) => all.map((control) => control.getAttribute("name") ?? "")), id).toEqual(
        id === "contact-form-sales-inquiry" ? ["email", "name", "phone", "country", "", "website", "message"] : names,
      );
      // The sales form's unnamed one is its country search, which only filters,
      // after the country's own <select>, which sends it.
      await expect(form.locator("input:not([name])")).toHaveCount(id === "contact-form-sales-inquiry" ? 1 : 0);
      if (id === "contact-form-sales-inquiry") await expect(form.locator("input:not([name])")).toHaveClass("hlistbox-search-input");
      for (const file of await form.locator('input[type="file"]').all()) await expect(file).toHaveAttribute("multiple", "");
    }
  });

  test("before its script runs, an HTML form posts, with files as multipart, and React holds its form, so nothing typed goes in the address", async ({ page }) => {
    const forms = page.locator(".play-demo form");
    await expect(forms).toHaveCount(4);
    const withFiles = page.locator(".play-demo form:has(input[type=file])");
    await expect(withFiles).toHaveCount(2);
    for (const form of await forms.all()) {
      if (inReact(page)) {
        await expect(form).toHaveAttribute("action", /^javascript:/);
        await expect(form).not.toHaveAttribute("method");
      } else await expect(form).toHaveAttribute("method", "post");
    }
    if (!inReact(page)) for (const form of await withFiles.all()) await expect(form).toHaveAttribute("enctype", "multipart/form-data");
  });

  test("with nothing to say, the error above the button takes no room", async ({ page }) => {
    const { form, failure, button } = await parts(page);
    const [fields, submit] = await boxes(form.locator(".hcontact-form-fields"), button);
    expect(submit!.y - (fields!.y + fields!.height)).toBeCloseTo(26, 0);
    await expect(failure).toBeEmpty();
  });

  test("under reduced motion, a failed send doesn't shake the card", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { card, form, button } = await parts(page);
    await button.click();
    await expect.poll(() => errorOf(form.getByLabel("Name"))).toBe("Enter your name.");
    expect(await shakesOf(card)).toBe(0);
  });

  test("the sales form's country is a Select with a search, of countries by name, sent by their code", async ({ page }) => {
    const { container, form } = await parts(page, "contact-form-sales-inquiry");
    const country = container.getByRole("combobox", { name: "Country" });
    const list = container.locator(".hlistbox");
    const shown = list.locator(".hoption:not([hidden])");
    await expect(country).toHaveText("Choose a country");
    await country.click();
    await expect(shown).toHaveCount(243);
    await expect(shown.first()).toHaveText("Afghanistan");
    await container.locator(".hlistbox-search-input").fill("germ");
    await expect(shown).toHaveCount(1);
    await shown.first().click();
    await expect(country).toHaveText("Germany");
    await expect(form.locator('select[name="country"]')).toHaveValue("DE");
  });

  test("the sales form needs only the email and name, but checks a phone number or website that's typed", async ({ page }) => {
    const { form, title, button } = await parts(page, "contact-form-sales-inquiry");
    const email = form.getByLabel("Company email");
    const name = form.getByLabel("Full name");
    const phone = form.getByLabel("Phone number");
    const website = form.getByLabel("Company website");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter your company email address.");
    expect(await errorOf(name)).toBe("Enter your full name.");
    expect(await errorOf(phone)).toBe("");
    expect(await errorOf(website)).toBe("");
    await email.fill("sam@example.com");
    await name.fill("Sam Lee");
    await phone.fill("call me");
    await website.fill("our site");
    await button.click();
    await expect.poll(() => errorOf(phone)).toBe("Enter a phone number, such as +1 415 555 2671.");
    expect(await errorOf(website)).toBe("Enter a web address, such as example.com.");
    await expect(phone).toBeFocused();
    await phone.fill("+1 415 555 2671");
    await website.fill("example.com");
    await button.click();
    await expect(title).toHaveText("Inquiry received");
    await expect(title).toBeFocused();
  });

  test("the sales form's website is an http or https address to a host with a dot, typed with its scheme or without, and nothing else", async ({ page }) => {
    const { form, button } = await parts(page, "contact-form-sales-inquiry");
    const website = form.getByLabel("Company website");
    const email = form.getByLabel("Company email");
    // The email stays empty, so the form never sends, and each try shows
    // only what the checks make of the website. They've run once the first
    // field in error, the email, has focus.
    await form.getByLabel("Full name").fill("Sam Lee");
    const tried = async (address: string) => {
      await website.fill(address);
      await expect(website).toBeFocused();
      await button.click();
      await expect(email).toBeFocused();
      return errorOf(website);
    };
    for (const address of ["example.com", "www.example.com/about", "https://example.com", "http://example.com:8080/a?b#c"]) {
      expect(await tried(address), address).toBe("");
    }
    for (const address of [
      "javascript:alert(document.domain).com",
      "mailto:sam@example.com",
      "ftp://example.com",
      "sam:secret@example.com",
      "localhost",
      "exa mple.com",
    ]) {
      expect(await tried(address), address).toBe("Enter a web address, such as example.com.");
    }
  });

  test("the sales form marks what's optional, counts its message to 300, and links to the privacy policy", async ({ page }) => {
    const { form } = await parts(page, "contact-form-sales-inquiry");
    await expect(form.locator(".hfield-optional")).toHaveCount(4);
    await expect(form.locator(".htextarea-counter")).toHaveText("0/300");
    await expect(form.getByLabel("Message")).toHaveAttribute("maxlength", "300");
    await expect(form.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/privacy");
  });

  test("a support request's topic is required: first in error, its Select takes focus, and choosing one takes the error away", async ({ page }) => {
    const { container, form, button } = await parts(page, "contact-form-support-request");
    const topic = container.getByRole("combobox", { name: "Topic" });
    await form.getByLabel("Email").fill("sam@example.com");
    await button.click();
    await expect.poll(() => errorOf(topic)).toBe("Choose a topic.");
    expect(await errorOf(form.getByLabel("Subject"))).toBe("Enter a subject.");
    await expect(topic).toHaveAttribute("aria-invalid", "true");
    await expect(topic).toBeFocused();
    await topic.click();
    await container.locator('.hoption:has-text("Billing")').click();
    await expect(topic).toHaveText("Billing");
    await expect.poll(() => errorOf(topic)).toBe("");
    await expect(topic).not.toHaveAttribute("aria-invalid");
  });

  test("attachments show in a File List that takes no room while empty, up to five", async ({ page }) => {
    const { form } = await parts(page, "contact-form-support-request");
    const input = form.locator(".hfile-input-control");
    const list = form.locator(".hfile-list");
    const rows = list.locator(".hfile-list-item");
    await expect(list).toBeHidden();
    await input.setInputFiles(["one", "two", "three", "four", "five", "six"].map((name) => text(`${name}.txt`)));
    await expect(rows).toHaveCount(5);
    await expect(list).toBeVisible();
    await expect(form.locator(".hfile-input + .herror")).toHaveText("Add up to 5 files.");
    await expect(rows.first().locator(".hfile-list-name")).toHaveText("one.txt");
  });

  test("removing the last attachment moves focus back to the File Input", async ({ page }) => {
    const { form } = await parts(page, "contact-form-support-request");
    const input = form.locator(".hfile-input-control");
    const rows = form.locator(".hfile-list-item");
    await input.setInputFiles(text("log.txt"));
    await expect(rows).toHaveCount(1);
    await form.getByRole("button", { name: "Remove log.txt" }).click();
    await expect(input).toBeFocused();
    await expect(rows).toHaveCount(0);
    await expect(form.locator(".hfile-list")).toBeHidden();
  });

  test("an order's problem is a Select: unanswered, it's invalid and takes focus, and choosing one takes the error away", async ({ page }) => {
    const { container, form, button } = await parts(page, "contact-form-order-help");
    const problem = container.getByRole("combobox", { name: "What's wrong?" });
    await expect(problem).toHaveText("Choose what's wrong");
    await form.getByLabel("Order number").fill("1042");
    await form.getByLabel("Email").fill("sam@example.com");
    await button.click();
    await expect.poll(() => errorOf(problem)).toBe("Choose what's wrong with your order.");
    await expect(problem).toHaveAttribute("aria-invalid", "true");
    await expect(problem).toBeFocused();
    await problem.click();
    await container.locator('.hoption:has-text("An item is missing")').click();
    await expect(problem).toHaveText("An item is missing");
    await expect.poll(() => errorOf(problem)).toBe("");
    await expect(problem).not.toHaveAttribute("aria-invalid");
  });

  test("a strip to drop files on is as wide as the fields around it", async ({ page }) => {
    for (const id of ["contact-form-support-request", "contact-form-order-help"]) {
      const { form } = await parts(page, id);
      const [strip, fields] = await boxes(form.locator('.hfile-input[data-variant="strip"]'), form.locator(".hcontact-form-fields"));
      expect(strip!.x).toBeCloseTo(fields!.x, 0);
      expect(strip!.width).toBeCloseTo(fields!.width, 0);
    }
  });

  test("every form's message starts four lines tall", async ({ page }) => {
    for (const id of ["contact-form-default", "contact-form-sales-inquiry", "contact-form-support-request", "contact-form-order-help"]) {
      const { form } = await parts(page, id);
      const message = form.getByLabel("Message");
      await expect(message).toHaveCSS("min-height", "94px");
      const [box] = await boxes(message);
      expect(box!.height).toBeCloseTo(94, 0);
    }
  });

  test("each text field's placeholder is an example of what to type, not its label", async ({ page }) => {
    const placeholders = {
      "contact-form-default": {
        Name: "Sam Lee",
        Email: "name@example.com",
        Message: "Tell us what you need, and anything that would help us answer.",
      },
      "contact-form-sales-inquiry": {
        "Company email": "name@company.com",
        "Full name": "Sam Lee",
        "Phone number": "+1 415 555 2671",
        "Company website": "https://example.com",
        Message: "Tell us about your team, and what you're looking for.",
      },
      "contact-form-support-request": {
        Email: "name@example.com",
        Subject: "I can't sign in on my phone",
        Message: "Tell us what happened, what you expected, and the steps that led to it.",
      },
      "contact-form-order-help": {
        "Order number": "1042",
        Email: "name@example.com",
        Message: "Tell us anything else that would help us put it right.",
      },
    };
    for (const [id, fields] of Object.entries(placeholders)) {
      const { form } = await parts(page, id);
      const typed = form.locator("input.hinput, textarea.htextarea");
      await expect(typed).toHaveCount(Object.keys(fields).length);
      for (const [label, placeholder] of Object.entries(fields)) {
        const field = form.getByLabel(label, { exact: true });
        await expect(field).toHaveAttribute("placeholder", placeholder);
        await expect(field).toHaveAccessibleName(label);
      }
    }
  });

  test("an order's photos take only pictures, shown as thumbnails", async ({ page }) => {
    const { form } = await parts(page, "contact-form-order-help");
    const rows = form.locator(".hfile-list-item");
    await form.locator(".hfile-input-control").setInputFiles([png(), text("notes.txt")]);
    await expect(rows).toHaveCount(1);
    await expect(form.locator(".hfile-list")).toHaveAttribute("data-layout", "grid");
    await expect(rows.first().locator("img")).toHaveAttribute("src", /^blob:/);
    await expect(form.locator(".hfile-input + .herror")).toHaveText("notes.txt isn't a picture.");
  });

  test("sent, an order's thank-you names the order and the email, from the answer", async ({ page }) => {
    const elements = await parts(page, "contact-form-order-help");
    const { thanks, title, button } = elements;
    await fillOrderHelp(elements);
    await button.click();
    await expect(title).toBeFocused();
    await expect(thanks.locator("strong")).toHaveText(["1042", "sam@example.com"]);
  });

  test("the contact options are raised Cards side by side, their links lined up at the bottom", async ({ page }) => {
    const container = await example(page, "contact-form-contact-options");
    const cards = container.locator(".hcontact-options-item");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) await expect(card).toHaveAttribute("data-variant", "raised");
    const sales = container.getByRole("link", { name: "Contact sales" });
    const support = container.getByRole("link", { name: "Email support" });
    const help = container.getByRole("link", { name: "Visit the help center" });
    await expect(sales).toHaveAttribute("href", "/contact/sales");
    await expect(support).toHaveAttribute("href", "mailto:support@example.com");
    await expect(help).toHaveAttribute("href", "/help");
    const [first, second, third, a, b, c] = await boxes(cards.nth(0), cards.nth(1), cards.nth(2), sales, support, help);
    expect(second!.y).toBeCloseTo(first!.y, 0);
    expect(third!.y).toBeCloseTo(first!.y, 0);
    expect(b!.y).toBeCloseTo(a!.y, 0);
    expect(c!.y).toBeCloseTo(a!.y, 0);
    expect(first!.y + first!.height - (a!.y + a!.height)).toBeCloseTo(27, 0);
  });

  test("the support address is a link in its sentence, not underlined, in the link's color and semibold", async ({ page }) => {
    const container = await example(page, "contact-form-contact-options");
    const description = container.locator(".hcontact-options-item").nth(1).locator(".hcard-description");
    const address = description.getByRole("link", { name: "support@example.com" });
    await expect(address).toHaveAttribute("href", "mailto:support@example.com");
    await expect(address).toHaveCSS("font-weight", "600");
    await expect(description).toHaveCSS("font-weight", "400");
    await expect(address).toHaveCSS("text-decoration-line", "none");
    await expect(address).toHaveCSS("color", await colorOf(page, "var(--harmo-link-color-text)"));
    await expect(description).toHaveText(
      "For help with your account, billing, or anything else, write to support@example.com.",
    );
  });
});
