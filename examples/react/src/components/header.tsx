import { Button, Header, NavigationMenu, NavigationMenuLink } from "@harmo-ui/react";
import type { CSSProperties, ReactNode } from "react";

// Example only: a page that scrolls, standing in for yours, with a logo and
// text of its own, laid out with inline styles.
const page: CSSProperties = {
  blockSize: "22rem",
  overflowY: "auto",
  background: "var(--harmo-color-background)",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "var(--harmo-border-radius)",
};
const mark: CSSProperties = {
  inlineSize: "1.25rem",
  blockSize: "1.25rem",
  background: "var(--harmo-color-primary-fill)",
  borderRadius: "0.375rem",
};
const body: CSSProperties = {
  display: "grid",
  gap: "var(--harmo-space-sm)",
  maxInlineSize: "75rem",
  margin: "0 auto",
  padding: "var(--harmo-space-md) var(--harmo-space-sm)",
  fontSize: "var(--harmo-font-size-sm)",
  lineHeight: "1.5rem",
  color: "var(--harmo-color-text-secondary)",
};
const hero: CSSProperties = {
  display: "grid",
  alignContent: "end",
  minBlockSize: "14rem",
  marginBlockStart: "-3.375rem",
  padding: "5rem var(--harmo-space-sm) var(--harmo-space-md)",
  background: "linear-gradient(160deg, var(--harmo-color-primary-tint), var(--harmo-color-background-secondary))",
};
const heading: CSSProperties = { margin: 0, fontSize: "var(--harmo-font-size-lg)", lineHeight: 1.4, color: "var(--harmo-color-text)" };

const paragraphs = [
  "Fresh produce from farms within a day's drive, delivered the morning after it's picked.",
  "Order by 8 PM for delivery tomorrow, in a window you choose, or pick it up from your nearest store.",
  "Every box is packed in paper and card, and we take the last one back when we bring the next.",
  "Members save 10% on every order, and get first pick of the season's harvest.",
  "Not what you hoped for? Tell us, and we'll refund it or send a new one, no questions asked.",
  "Our stores are open every day from 7 AM to 10 PM, and on holidays until 6 PM.",
  "This week: the first asparagus from the valley, and new potatoes, small enough to cook whole.",
  "Bread is baked overnight in our own kitchen, and on the shelves by 7, with rye on Saturdays.",
  "Ask in store for the cheese of the month; this month's is a soft goat's cheese from the hills.",
  "Gift cards come in any amount, sent by email the moment you buy one, or printed at the till.",
  "Bring your own containers to the deli counter, and we'll fill them, and take 5% off.",
  "Questions? Write to us, or call between 8 AM and 8 PM, and a person will answer.",
];

const brand = (
  <a href="#top">
    <span style={mark} aria-hidden="true" />
    Speedwagon
  </a>
);

const Page = ({ children, top }: { children: ReactNode; top?: ReactNode }) => (
  <div style={page}>
    {children}
    {top}
    <div style={body}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} style={{ margin: 0 }}>
          {paragraph}
        </p>
      ))}
    </div>
  </div>
);

const navigation = (
  <NavigationMenu aria-label="Main">
    <NavigationMenuLink href="#shop">Shop</NavigationMenuLink>
    <NavigationMenuLink href="#recipes">Recipes</NavigationMenuLink>
    <NavigationMenuLink href="#stores">Stores</NavigationMenuLink>
  </NavigationMenu>
);

const order = <Button href="#order">Order now</Button>;

export const examples = {
  Default: () => (
    <Page>
      <Header brand={brand} actions={order}>
        {navigation}
      </Header>
    </Page>
  ),

  "Hides as you scroll down": () => (
    <Page>
      <Header scroll="hide" brand={brand} actions={order}>
        {navigation}
      </Header>
    </Page>
  ),

  "Scrolls away": () => (
    <Page>
      <Header scroll="away" brand={brand} actions={order}>
        {navigation}
      </Header>
    </Page>
  ),

  "Clear over a hero": () => (
    <Page
      top={
        <div style={hero}>
          <h2 style={heading}>The season's first strawberries</h2>
        </div>
      }
    >
      <Header transparent brand={brand} actions={order}>
        {navigation}
      </Header>
    </Page>
  ),
};
