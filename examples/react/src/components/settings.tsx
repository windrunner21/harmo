import {
  Button,
  Checkbox,
  Option,
  Select,
  Setting,
  Settings,
  Switch,
} from "@harmo-ui/react";

export const examples = {
  Switches: () => (
    <Settings>
      <Setting
        label="Recap emails"
        description="Send account recap emails to the recipients below. Operational emails go to each member's sign-in email."
      >
        <Switch />
      </Setting>
      <Setting
        label="Web push availability"
        description="Controls whether web push can be enabled for this account. Members choose their push events in communication preferences."
      >
        <Switch defaultChecked />
      </Setting>
      <Setting
        label="Inbox translation"
        description="Managed by your administrator."
      >
        <Switch defaultChecked disabled />
      </Setting>
    </Settings>
  ),

  "Other controls": () => (
    <Settings>
      <Setting
        label="Daily digest"
        description="A summary of unanswered conversations, sent at 9:00."
      >
        <Checkbox defaultChecked />
      </Setting>
      <Setting
        label="Default language"
        description="Used for new templates and automated replies."
        placement="below"
      >
        <Select defaultValue="en">
          <Option value="en">English</Option>
          <Option value="es">Spanish</Option>
          <Option value="ar">Arabic</Option>
        </Select>
      </Setting>
      <Setting
        label="Export conversations"
        description="Download every conversation from the last 90 days as a CSV file."
      >
        <Button variant="secondary">Export</Button>
      </Setting>
    </Settings>
  ),

  "Narrow container": () => (
    <Settings>
      <Setting
        label="Automatic away status"
        description="Set members as away after 15 minutes without activity, and back once they reply."
      >
        <Switch defaultChecked />
      </Setting>
    </Settings>
  ),
};
