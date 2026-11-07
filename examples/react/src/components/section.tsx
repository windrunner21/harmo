import {
  Banner,
  Button,
  Field,
  Input,
  Section,
  Setting,
  Settings,
  Switch,
} from "@harmo-ui/react";
import { InfoIcon } from "../app-icons.tsx";

export const examples = {
  Default: () => (
    <Section label="Notifications" description="What reaches your inbox and your phone.">
      <Settings>
        <Setting
          label="New conversations"
          description="An email when a customer starts a conversation."
        >
          <Switch defaultChecked />
        </Setting>
        <Setting
          label="Mentions"
          description="A push notification when a teammate mentions you."
        >
          <Switch />
        </Setting>
      </Settings>
    </Section>
  ),

  "With actions": () => (
    <Section
      label="Chat widget"
      description="How the widget greets people on your site."
      actions={
        <>
          <Button variant="secondary">Preview</Button>
          <Button>Save changes</Button>
        </>
      }
    >
      <Field label="Greeting">
        <Input
          id="widget-greeting"
          name="greeting"
          type="text"
          defaultValue="Hi! How can we help?"
        />
      </Field>
      <Field label="Button text">
        <Input id="widget-button" name="button" type="text" defaultValue="Chat with us" />
      </Field>
    </Section>
  ),

  "In a narrow space": () => (
    <Section
      label="Team members"
      description="12 people can sign in to this workspace."
      actions={<Button>Invite people</Button>}
    >
      <Banner icon={<InfoIcon />}>2 invitations haven&apos;t been accepted yet.</Banner>
    </Section>
  ),
};
