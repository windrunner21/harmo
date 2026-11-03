import type { CSSProperties } from "react";
import { Field, Switch } from "@harmo-ui/react";

export const examples = {
  "Off and on": () => (
    <>
      <Field orientation="horizontal" label="Set me as away">
        <Switch />
      </Field>
      <Field orientation="horizontal" label="Play a sound for new messages">
        <Switch defaultChecked />
      </Field>
    </>
  ),

  Disabled: () => (
    <>
      <Field orientation="horizontal" label="Translate incoming messages">
        <Switch disabled />
      </Field>
      <Field
        orientation="horizontal"
        label="Two-factor sign-in, required by your administrator"
      >
        <Switch defaultChecked disabled />
      </Field>
    </>
  ),

  "With a description": () => (
    <Field
      orientation="horizontal"
      label="Send read receipts"
      description="Customers see when you've read their messages."
    >
      <Switch defaultChecked />
    </Field>
  ),

  "Right to left": () => (
    <>
      <Field orientation="horizontal" label="تعيين حالتي كغائب">
        <Switch />
      </Field>
      <Field orientation="horizontal" label="تشغيل صوت للرسائل الجديدة">
        <Switch defaultChecked />
      </Field>
    </>
  ),

  "Custom size": () => (
    <Field orientation="horizontal" label="Compact conversation list">
      <Switch
        style={
          {
            "--harmo-switch-height": "20px",
            "--hswitch-width": "36px",
            "--hswitch-thumb": "16px",
          } as CSSProperties
        }
        defaultChecked
      />
    </Field>
  ),
};
