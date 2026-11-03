import {
  Button,
  ExpandChevron,
  Listbox,
  Option,
  OptionGroup,
  Popup,
} from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Single: () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Period
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox aria-label="Period" defaultValue="30">
        <Option value="7">Last 7 days</Option>
        <Option value="30">Last 30 days</Option>
        <Option value="90">Last 90 days</Option>
        <Option value="year">This year</Option>
      </Listbox>
    </Popup>
  ),

  "Single, grouped": () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Channel
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox aria-label="Channel" defaultValue="whatsapp">
        <Option value="all">All channels</Option>
        <OptionGroup label="Messaging">
          <Option value="whatsapp">WhatsApp</Option>
          <Option value="telegram">Telegram</Option>
          <Option value="viber">Viber</Option>
        </OptionGroup>
        <OptionGroup label="Email">
          <Option value="gmail">Gmail</Option>
          <Option value="outlook">Outlook</Option>
        </OptionGroup>
      </Listbox>
    </Popup>
  ),

  "Single, with search": () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Assignee
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox
        aria-label="Assignee"
        searchLabel="Search agents"
        emptyMessage="No agents found"
        defaultValue="jane"
      >
        <Option value="none">Unassigned</Option>
        <Option value="jane">Jane Smith</Option>
        <Option value="omar">Omar Haddad</Option>
        <Option value="li">Li Wei</Option>
        <Option value="ana">Ana Souza</Option>
      </Listbox>
    </Popup>
  ),

  "Single, grouped, with search": () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Inbox
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox
        aria-label="Inbox"
        searchLabel="Search inboxes"
        emptyMessage="No inboxes found"
        defaultValue="all"
      >
        <Option value="all">All inboxes</Option>
        <OptionGroup label="Messaging">
          <Option value="whatsapp">WhatsApp</Option>
          <Option value="telegram">Telegram</Option>
        </OptionGroup>
        <OptionGroup label="Email">
          <Option value="gmail">Gmail</Option>
          <Option value="outlook">Outlook</Option>
        </OptionGroup>
      </Listbox>
    </Popup>
  ),

  Multiple: () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Status
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox aria-label="Status" multiple defaultValue={["delivered", "read"]}>
        <Option value="delivered">Delivered</Option>
        <Option value="read">Read</Option>
        <Option value="failed">Failed</Option>
        <Option value="pending">Pending</Option>
      </Listbox>
    </Popup>
  ),

  "Multiple, grouped": () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Tags
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox aria-label="Tags" multiple defaultValue={["refund", "feature"]}>
        <OptionGroup label="Billing">
          <Option value="refund">Refund</Option>
          <Option value="invoice">Invoice</Option>
        </OptionGroup>
        <OptionGroup label="Support">
          <Option value="bug">Bug report</Option>
          <Option value="feature">Feature request</Option>
          <Option value="onboarding">Onboarding</Option>
        </OptionGroup>
      </Listbox>
    </Popup>
  ),

  "Multiple, with a footer": () => {
    const [languages, setLanguages] = useState(["en", "es"]);

    return (
      <Popup
        trigger={
          <Button variant="secondary" aria-haspopup="listbox">
            Language
            <ExpandChevron />
          </Button>
        }
      >
        <Listbox
          aria-label="Language"
          multiple
          value={languages}
          onValueChange={setLanguages}
          footer={
            <Button variant="tertiary" onClick={() => setLanguages([])}>
              Clear filters
            </Button>
          }
        >
          <Option value="en">English</Option>
          <Option value="es">Spanish</Option>
          <Option value="ar">Arabic</Option>
          <Option value="de">German</Option>
        </Listbox>
      </Popup>
    );
  },

  "Disabled options": () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Source
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox aria-label="Source" defaultValue="whatsapp">
        <Option value="whatsapp">WhatsApp</Option>
        <Option value="instagram">Instagram</Option>
        <Option value="viber" disabled badge="Soon">
          Viber
        </Option>
        <Option value="sms" disabled>
          SMS
        </Option>
      </Listbox>
    </Popup>
  ),

  "Long options": () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Sender number
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox aria-label="Sender number" defaultValue="support">
        <Option value="support">+49 30 1234567 · Support</Option>
        <Option value="dach">
          +41 44 7654321 · Customer support for Germany, Austria, Switzerland,
          Liechtenstein, and Luxembourg
        </Option>
        <Option value="sales">+44 20 7946 0000 · Sales</Option>
      </Listbox>
    </Popup>
  ),
};
