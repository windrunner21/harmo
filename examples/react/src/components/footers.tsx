import { LanguagePicker } from "@harmo-ui/react";
import type { CSSProperties, ReactNode } from "react";
import { InstagramIcon, LinkedInIcon, XIcon, YouTubeIcon } from "../app-icons.tsx";
import { NewsletterFooter } from "../patterns/footers/NewsletterFooter.tsx";
import { SimpleFooter } from "../patterns/footers/SimpleFooter.tsx";
import { SiteFooter, type SiteFooterProps } from "../patterns/footers/SiteFooter.tsx";

// Example only: the foot of a page standing in for your site's, its logo,
// and its text, laid out with inline styles.
const frame: CSSProperties = {
  overflow: "hidden",
  background: "var(--harmo-color-background)",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "var(--harmo-border-radius)",
};
const phone: CSSProperties = { ...frame, inlineSize: "100%", maxInlineSize: "24rem", marginInline: "auto" };
const body: CSSProperties = {
  maxInlineSize: "75rem",
  margin: "0 auto",
  padding: "var(--harmo-space-md) var(--harmo-space-sm)",
  fontSize: "var(--harmo-font-size-sm)",
  lineHeight: "1.5rem",
  color: "var(--harmo-color-text-secondary)",
};
const mark: CSSProperties = {
  inlineSize: "1.25rem",
  blockSize: "1.25rem",
  background: "var(--harmo-color-primary-fill)",
  borderRadius: "0.375rem",
};

const Page = ({ children, style = frame }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={style}>
    <p style={{ ...body, margin: "0 auto" }}>
      Order by 8 PM for delivery tomorrow, in a window you choose, or pick it up from your nearest store.
    </p>
    {children}
  </div>
);

const logo = (
  <>
    <span style={mark} aria-hidden="true" />
    Speedwagon
  </>
);

const external = { target: "_blank", rel: "noreferrer" };

const groups: SiteFooterProps["groups"] = [
  {
    label: "Shop",
    links: [
      { label: "This week's offers", href: "#offers" },
      { label: "Delivery", href: "#delivery" },
      { label: "Gift cards", href: "#gift-cards" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Contact us", href: "#contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
      { label: "Cookies", href: "#cookies" },
    ],
  },
  {
    label: "Social",
    links: [
      { label: "Instagram", href: "https://instagram.com", icon: <InstagramIcon className="hicon" />, ...external },
      { label: "YouTube", href: "https://youtube.com", icon: <YouTubeIcon className="hicon" />, ...external },
      { label: "LinkedIn", href: "https://linkedin.com", icon: <LinkedInIcon className="hicon" />, ...external },
      { label: "X", href: "https://x.com", icon: <XIcon className="hicon" />, ...external },
    ],
  },
];

const language = (
  <LanguagePicker
    aria-label="Region and language"
    side="top"
    defaultValue="en-GB"
    languages={[
      {
        label: "France",
        icon: <img src="images/flags/fr.svg" alt="" />,
        languages: [
          { value: "fr-FR", label: "Français" },
          { value: "en-FR", label: "English" },
        ],
      },
      {
        label: "Germany",
        icon: <img src="images/flags/de.svg" alt="" />,
        languages: [
          { value: "de-DE", label: "Deutsch" },
          { value: "en-DE", label: "English" },
        ],
      },
      {
        label: "Spain",
        icon: <img src="images/flags/es.svg" alt="" />,
        languages: [
          { value: "es-ES", label: "Español" },
          { value: "en-ES", label: "English" },
        ],
      },
      {
        label: "United Kingdom",
        icon: <img src="images/flags/gb.svg" alt="" />,
        languages: [{ value: "en-GB", label: "English" }],
      },
      {
        label: "United States",
        icon: <img src="images/flags/us.svg" alt="" />,
        languages: [
          { value: "en-US", label: "English" },
          { value: "es-US", label: "Español" },
        ],
      },
    ]}
  />
);

export const examples = {
  "Site footer": () => (
    <Page>
      <SiteFooter
        logo={logo}
        homeHref="#top"
        description="Fresh produce from farms within a day's drive, delivered the morning after it's picked."
        language={language}
        groups={groups}
        copyright="© 2026 Speedwagon Ltd."
        address="1 Joestar Lane, Morioh"
      />
    </Page>
  ),

  "Site footer on a phone": () => (
    <Page style={phone}>
      <SiteFooter
        logo={logo}
        homeHref="#top"
        language={language}
        groups={groups}
        copyright="© 2026 Speedwagon Ltd."
        address="1 Joestar Lane, Morioh"
      />
    </Page>
  ),

  "Newsletter footer": () => (
    <Page>
      <NewsletterFooter
        logo={logo}
        homeHref="#top"
        title="Fresh picks, every Friday"
        description="What's in season, and a recipe for it. No more than once a week."
        // Your app's call to your mailing list, here pretended: a moment
        // later, taken@example.com is already on it, and any other address
        // is added.
        onSubscribe={(email) =>
          new Promise((resolve) =>
            setTimeout(() => resolve(email === "taken@example.com" ? "That address is already subscribed." : undefined), 800),
          )
        }
        groups={groups.slice(0, 2)}
        copyright="© 2026 Speedwagon Ltd."
        links={[
          { label: "Privacy", href: "#privacy" },
          { label: "Terms", href: "#terms" },
        ]}
      />
    </Page>
  ),

  "Simple footer": () => (
    <Page>
      <SimpleFooter
        copyright="© 2026 Speedwagon Ltd."
        links={[
          { label: "Privacy", href: "#privacy" },
          { label: "Terms", href: "#terms" },
          { label: "Help", href: "#help" },
        ]}
      />
    </Page>
  ),
};
