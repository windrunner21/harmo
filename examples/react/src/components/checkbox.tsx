import type { CSSProperties } from "react";
import { Checkbox, CheckboxGroup, Field } from "@harmo/react";

export const examples = {
  States: () => (
    <>
      <Field orientation="horizontal" label="Email me updates">
        <Checkbox name="email-updates" />
      </Field>
      <Field orientation="horizontal" label="Send a weekly summary">
        <Checkbox name="weekly-summary" defaultChecked />
      </Field>
      <Field orientation="horizontal" label="Select all reports">
        <Checkbox name="all-reports" indeterminate />
      </Field>
    </>
  ),

  Disabled: () => (
    <>
      <Field orientation="horizontal" label="Updates unavailable">
        <Checkbox disabled />
      </Field>
      <Field
        orientation="horizontal"
        label="Summary enabled by your administrator"
      >
        <Checkbox defaultChecked disabled />
      </Field>
      <Field
        orientation="horizontal"
        label="Some reports shared by your administrator"
      >
        <Checkbox disabled indeterminate />
      </Field>
    </>
  ),

  "Custom size": () => (
    <>
      <Field orientation="horizontal" label="Send a weekly summary">
        <Checkbox name="large-summary" style={{ "--harmo-checkbox-size": "24px" } as CSSProperties} defaultChecked />
      </Field>
      <Field orientation="horizontal" label="Select all reports">
        <Checkbox name="large-reports" style={{ "--harmo-checkbox-size": "24px" } as CSSProperties} indeterminate />
      </Field>
    </>
  ),

  "With a description": () => (
    <Field
      orientation="horizontal"
      label="Email me about activity across my teams"
      description="A weekly summary. You can change this at any time."
    >
      <Checkbox name="activity-updates" />
    </Field>
  ),

  Group: () => (
    <CheckboxGroup
      label="Notify me about"
      name="notify"
      defaultValue={["messages", "mentions"]}
    >
      <Field orientation="horizontal" label="New messages">
        <Checkbox value="messages" />
      </Field>
      <Field orientation="horizontal" label="Mentions">
        <Checkbox value="mentions" />
      </Field>
      <Field orientation="horizontal" label="Failed campaigns">
        <Checkbox value="failures" />
      </Field>
    </CheckboxGroup>
  ),

  "Long label": () => (
    <Field
      orientation="horizontal"
      label="Send me detailed updates about changes to reports and activity across every team in my account"
    >
      <Checkbox name="detailed-updates" />
    </Field>
  ),
};
