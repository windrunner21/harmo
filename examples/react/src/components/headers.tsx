import { Avatar, CommandMenu, Link, Option, OptionGroup } from "@harmo-ui/react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AnalyticsIcon, BookIcon, CalendarIcon, CampaignsIcon, GlobeIcon, HomeIcon, TeamIcon, TicketsIcon, UserIcon } from "../app-icons.tsx";
import { AppHeader, type AppNotification } from "../patterns/headers/AppHeader.tsx";
import { SimpleHeader } from "../patterns/headers/SimpleHeader.tsx";
import { SiteHeader, type SiteHeaderProps } from "../patterns/headers/SiteHeader.tsx";

// Example only: pages that scroll, standing in for your site, app, and
// sign-in page, each with a logo and text of its own, laid out with inline
// styles.
const page: CSSProperties = {
  blockSize: "24rem",
  overflowY: "auto",
  background: "var(--harmo-color-background)",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "var(--harmo-border-radius)",
};
// A phone's screen, its menu as tall as what's under the header.
const phone = {
  ...page,
  blockSize: "34rem",
  inlineSize: "100%",
  maxInlineSize: "24rem",
  marginInline: "auto",
  "--hsite-header-menu-height": "calc(34rem - 3.375rem)",
} as CSSProperties;
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

const text = [
  "Fresh produce from farms within a day's drive, delivered the morning after it's picked.",
  "Order by 8 PM for delivery tomorrow, in a window you choose, or pick it up from your nearest store.",
  "Every box is packed in paper and card, and we take the last one back when we bring the next.",
  "Members save 10% on every order, and get first pick of the season's harvest.",
  "Not what you hoped for? Tell us, and we'll refund it or send a new one, no questions asked.",
  "Our stores are open every day from 7 AM to 10 PM, and on holidays until 6 PM.",
  "This week: the first asparagus from the valley, and new potatoes, small enough to cook whole.",
  "Bread is baked overnight in our own kitchen, and on the shelves by 7, with rye on Saturdays.",
  "Gift cards come in any amount, sent by email the moment you buy one, or printed at the till.",
  "Questions? Write to us, or call between 8 AM and 8 PM, and a person will answer.",
];

const Body = () => (
  <div style={body}>
    {text.map((line) => (
      <p key={line} style={{ margin: 0 }}>
        {line}
      </p>
    ))}
  </div>
);

const logo = (
  <>
    <span style={mark} aria-hidden="true" />
    Speedwagon
  </>
);

const menu: SiteHeaderProps["menu"] = [
  {
    label: "Shop",
    links: [
      { label: "This week's offers", description: "What's in season, for less", href: "#offers", icon: <CampaignsIcon className="hicon" /> },
      { label: "Delivery", description: "To your door, in a window you choose", href: "#delivery", icon: <HomeIcon className="hicon" /> },
      { label: "Gift cards", description: "Any amount, sent by email", href: "#gift-cards", icon: <TicketsIcon className="hicon" /> },
    ],
  },
  {
    label: "Recipes",
    links: [
      { label: "This week's menu", description: "Seven dinners, planned for you", href: "#this-week", icon: <CalendarIcon className="hicon" /> },
      { label: "For a crowd", description: "Dishes that feed eight or more", href: "#for-a-crowd", icon: <TeamIcon className="hicon" /> },
      { label: "From our kitchen", description: "Stories and tips from our cooks", href: "#kitchen", icon: <BookIcon className="hicon" /> },
      { label: "By cuisine", description: "Dishes from around the world", href: "#cuisines", icon: <GlobeIcon className="hicon" /> },
    ],
  },
  { label: "Stores", href: "#stores" },
];

// A bigger site's menu, long enough on a phone to scroll.
const longMenu: SiteHeaderProps["menu"] = [
  ...menu,
  { label: "About", href: "#about" },
  { label: "Careers", href: "#careers" },
  { label: "Press", href: "#press" },
  { label: "Help", href: "#help" },
];

const siteActions: SiteHeaderProps["actions"] = [
  { label: "Sign in", href: "#sign-in" },
  { label: "Order now", href: "#order", primary: true },
];

const Page = ({ children, style = page, top }: { children: ReactNode; style?: CSSProperties; top?: ReactNode }) => (
  <div style={style}>
    {children}
    {top}
    <Body />
  </div>
);

const firstNotifications: AppNotification[] = [
  {
    id: "mention",
    title: "Imran mentioned you on order #4821",
    detail: "\"Can you check the delivery window?\"",
    time: "2 minutes ago",
    href: "#order-4821",
    unread: true,
    avatar: <Avatar src="images/imran.webp" alt="" />,
  },
  {
    id: "assigned",
    title: "Ana Lopez assigned you a ticket",
    detail: "Mug arrived cracked",
    time: "1 hour ago",
    href: "#ticket-1042",
    unread: true,
    avatar: <Avatar alt="">AL</Avatar>,
  },
  {
    id: "report",
    title: "Last week's report is ready",
    time: "Yesterday",
    href: "#reports",
    avatar: (
      <Avatar alt="">
        <AnalyticsIcon className="hicon" />
      </Avatar>
    ),
  },
];

export const examples = {
  "Site header": () => (
    <Page
      top={
        <div style={hero}>
          <h2 style={heading}>The season's first strawberries</h2>
        </div>
      }
    >
      <SiteHeader logo={logo} homeHref="#top" menu={menu} actions={siteActions} scroll="hide" transparent />
    </Page>
  ),

  "Site header on a phone": () => (
    <Page style={phone}>
      <SiteHeader logo={logo} homeHref="#top" menu={longMenu} actions={siteActions} scroll="hide" />
    </Page>
  ),

  "App header": () => {
    const [notifications, setNotifications] = useState(firstNotifications);

    return (
      <Page>
        <AppHeader
          search={
            <CommandMenu
              label="Search"
              placeholder="Search"
              shortcut={{ keys: "/", label: "/" }}
              emptyMessage="No results"
            >
              <OptionGroup label="Go to">
                <Option value="#orders">Orders</Option>
                <Option value="#customers">Customers</Option>
                <Option value="#settings">Settings</Option>
              </OptionGroup>
              <OptionGroup label="Recent">
                <Option value="#order-4821" description="Delivery tomorrow, 8 to 10 AM">
                  Order #4821
                </Option>
                <Option value="#customer-ana" description="ana@example.com">
                  Ana Lopez
                </Option>
              </OptionGroup>
            </CommandMenu>
          }
          helpHref="#help"
          settingsHref="#settings"
          notifications={notifications}
          onMarkAllRead={() => setNotifications((all) => all.map((notification) => ({ ...notification, unread: false })))}
          create={[
            { label: "Order", href: "#new-order", icon: <TicketsIcon className="hicon" /> },
            { label: "Customer", href: "#new-customer", icon: <UserIcon className="hicon" /> },
            { label: "Campaign", href: "#new-campaign", icon: <CampaignsIcon className="hicon" /> },
          ]}
        />
      </Page>
    );
  },

  "Simple header": () => (
    <Page>
      <SimpleHeader logo={logo} homeHref="#top" action={<Link href="#help">Need help?</Link>} />
    </Page>
  ),
};
