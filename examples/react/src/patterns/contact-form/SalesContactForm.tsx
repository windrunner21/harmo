"use client";

import { Button, Field, Input, Link, Option, Select, TextArea } from "@harmo-ui/react";
import type { ReactNode } from "react";
import { emailError, textOf, type FormAction, type FormMessages } from "../form-action/formAction.ts";
import { useContactForm } from "./useContactForm.ts";

type SalesContactField = "email" | "name" | "phone" | "country" | "website" | "message";

export type SalesContactFormMessages = FormMessages<SalesContactField, SalesContactField>;

export type SalesContactFormResult = SalesContactFormMessages | { step: "sent" } | string | undefined;

export interface SalesContactFormProps {
  action: FormAction<SalesContactFormResult>;
  privacyHref: string;
  sentIcon?: ReactNode;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const regions = `
  AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM
  BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX
  CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF
  GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR
  IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU
  LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA
  NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY
  QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY
  SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI
  VN VU WF WS YE YT ZA ZM ZW
`;

const regionName = new Intl.DisplayNames(["en"], { type: "region" });

const countries = regions
  .trim()
  .split(/\s+/)
  .map((code) => ({ code, name: regionName.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

const aPhoneNumber = /^\+?[\d\s().-]+$/;

const isWebsite = (text: string) => {
  if (/\s/.test(text)) return false;
  try {
    const url = new URL(/^[a-z][a-z\d+-]*:/i.test(text) ? text : `https://${text}`);
    return /^https?:$/.test(url.protocol) && url.hostname.includes(".") && !url.username && !url.password;
  } catch {
    return false;
  }
};

export const SalesContactForm = ({ action, privacyHref, sentIcon, titleAs: Title = "h2" }: SalesContactFormProps) => {
  const { errors, failure, pending, sent, thanks, frame, form, forget, refill } = useContactForm({
    action,
    fields: ["email", "name", "phone", "website"],
    check: (data) => {
      const phone = textOf(data, "phone");
      const website = textOf(data, "website");
      return {
        email: emailError(textOf(data, "email"), "Enter your company email address."),
        name: textOf(data, "name") ? undefined : "Enter your full name.",
        phone:
          !phone || (aPhoneNumber.test(phone) && phone.replace(/\D/g, "").length >= 7)
            ? undefined
            : "Enter a phone number, such as +1 415 555 2671.",
        website: !website || isWebsite(website) ? undefined : "Enter a web address, such as example.com.",
      };
    },
  });

  return (
    <div className="hcard hcontact-form" data-variant="raised" {...frame}>
      <form className="hcontact-form-form" noValidate hidden={sent !== null} {...form}>
        <Title className="hcontact-form-title">Contact sales</Title>
        <div className="hcontact-form-fields">
          <div className="hcontact-form-row">
            <Field label="Company email" error={errors.email ?? ""}>
              <Input
                key={refill.key}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                defaultValue={refill.values.email}
                onChange={() => forget("email")}
              />
            </Field>
            <Field label="Full name" error={errors.name ?? ""}>
              <Input
                key={refill.key}
                name="name"
                autoComplete="name"
                placeholder="Sam Lee"
                defaultValue={refill.values.name}
                onChange={() => forget("name")}
              />
            </Field>
          </div>
          <div className="hcontact-form-row">
            <Field label="Phone number" optional="Optional" error={errors.phone ?? ""}>
              <Input
                key={refill.key}
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 415 555 2671"
                defaultValue={refill.values.phone}
                onChange={() => forget("phone")}
              />
            </Field>
            <Select
              key={refill.key}
              label="Country"
              optional="Optional"
              name="country"
              placeholder="Choose a country"
              searchLabel="Search countries"
              emptyMessage="No countries found"
              defaultValue={refill.values.country}
            >
              {countries.map(({ code, name }) => (
                <Option key={code} value={code}>
                  {name}
                </Option>
              ))}
            </Select>
          </div>
          <Field label="Company website" optional="Optional" error={errors.website ?? ""}>
            <Input
              key={refill.key}
              name="website"
              type="url"
              autoComplete="url"
              placeholder="https://example.com"
              defaultValue={refill.values.website}
              onChange={() => forget("website")}
            />
          </Field>
          <Field label="Message" optional="Optional">
            <TextArea
              key={refill.key}
              className="hcontact-form-message"
              name="message"
              maxLength={300}
              placeholder="Tell us about your team, and what you're looking for."
              defaultValue={refill.values.message}
            />
          </Field>
        </div>
        <div className="hcontact-form-submit">
          <p className="herror" aria-live="polite">
            {failure}
          </p>
          <Button type="submit" loading={pending}>
            Send inquiry
          </Button>
        </div>
        <p className="hcontact-form-footer">
          We use your details only to answer your inquiry. Read our{" "}
          <Link underlined href={privacyHref}>
            privacy policy
          </Link>
          .
        </p>
      </form>
      <div className="hempty-state" hidden={sent === null}>
        {sentIcon && (
          <div className="hempty-state-icon" aria-hidden="true">
            {sentIcon}
          </div>
        )}
        <Title className="hempty-state-title" ref={thanks} tabIndex={-1}>
          Inquiry received
        </Title>
        <p className="hempty-state-description">
          We've received your inquiry and will get back to you within one business day.
        </p>
      </div>
    </div>
  );
};
