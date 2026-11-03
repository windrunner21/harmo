import {
  Tab,
  TabLink,
  TabList,
  TabNav,
  TabPanel,
  Tabs,
} from "@harmo/react";
import { useState } from "react";

export const examples = {
  Tabs: () => {
    const [current, setCurrent] = useState("/analytics/tickets");
    const links = [
      ["/analytics/tickets", "Tickets"],
      ["/analytics/campaigns", "Campaigns"],
      ["/analytics/ai-agents", "AI agents"],
      ["/analytics/satisfaction", "Customer satisfaction"],
    ];

    return (
      <TabNav aria-label="Analytics">
        {links.map(([href, text]) => (
          <TabLink
            key={href}
            href={href}
            current={href === current}
            onClick={() => setCurrent(href)}
          >
            {text}
          </TabLink>
        ))}
      </TabNav>
    );
  },

  "Switching panels": () => (
    <Tabs defaultValue="all">
      <TabList aria-label="Quick replies">
        <Tab value="all">All</Tab>
        <Tab value="private">Private</Tab>
        <Tab value="team">Team</Tab>
        <Tab value="account">Account</Tab>
      </TabList>
      <TabPanel value="all">Every quick reply you can use.</TabPanel>
      <TabPanel value="private">Replies only you can see.</TabPanel>
      <TabPanel value="team">Replies shared with your team.</TabPanel>
      <TabPanel value="account">
        Replies everyone in the account can use.
      </TabPanel>
    </Tabs>
  ),

  "Many tabs": () => {
    const [current, setCurrent] = useState("/settings/billing");
    const links = [
      ["/settings/account", "Account details"],
      ["/settings/hours", "Business hours"],
      ["/settings/messaging", "Messaging"],
      ["/settings/notifications", "Notifications"],
      ["/settings/team", "Team members"],
      ["/settings/billing", "Billing"],
      ["/settings/integrations", "Integrations"],
      ["/settings/developers", "Developers"],
    ];

    return (
      <TabNav aria-label="Settings">
        {links.map(([href, text]) => (
          <TabLink
            key={href}
            href={href}
            current={href === current}
            onClick={() => setCurrent(href)}
          >
            {text}
          </TabLink>
        ))}
      </TabNav>
    );
  },

  "Without the script": () => (
    <TabNav aria-label="Settings">
      <TabLink href="/settings/account" current>
        Account details
      </TabLink>
      <TabLink href="/settings/hours">Business hours</TabLink>
      <TabLink href="/settings/messaging">Messaging</TabLink>
    </TabNav>
  ),

  "Right to left": () => {
    const [current, setCurrent] = useState("/analytics/tickets");
    const links = [
      ["/analytics/tickets", "التذاكر"],
      ["/analytics/campaigns", "الحملات"],
      ["/analytics/ai-agents", "وكلاء الذكاء الاصطناعي"],
      ["/analytics/satisfaction", "رضا العملاء"],
    ];

    return (
      <TabNav aria-label="التحليلات">
        {links.map(([href, text]) => (
          <TabLink
            key={href}
            href={href}
            current={href === current}
            onClick={() => setCurrent(href)}
          >
            {text}
          </TabLink>
        ))}
      </TabNav>
    );
  },
};
