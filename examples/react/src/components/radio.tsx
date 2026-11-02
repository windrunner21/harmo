import { Field, Radio, RadioGroup } from "@harmo/react";

export const examples = {
  Group: () => (
    <RadioGroup label="Export format" name="export-format" defaultValue="csv">
      <Field orientation="horizontal" label="CSV">
        <Radio value="csv" />
      </Field>
      <Field orientation="horizontal" label="Excel workbook">
        <Radio value="xlsx" />
      </Field>
      <Field orientation="horizontal" label="PDF report">
        <Radio value="pdf" />
      </Field>
    </RadioGroup>
  ),

  "With descriptions": () => (
    <RadioGroup label="Delivery" name="delivery" defaultValue="now">
      <Field
        orientation="horizontal"
        label="Send now"
        description="Starts delivering as soon as you publish."
      >
        <Radio value="now" />
      </Field>
      <Field
        orientation="horizontal"
        label="Schedule"
        description="Pick a date and time in your account's time zone."
      >
        <Radio value="scheduled" />
      </Field>
    </RadioGroup>
  ),

  Disabled: () => (
    <>
      <RadioGroup
        label="Template category"
        name="category"
        defaultValue="marketing"
      >
        <Field orientation="horizontal" label="Marketing">
          <Radio value="marketing" />
        </Field>
        <Field orientation="horizontal" label="Utility">
          <Radio value="utility" />
        </Field>
        <Field orientation="horizontal" label="Authentication">
          <Radio value="authentication" disabled />
        </Field>
      </RadioGroup>
      <RadioGroup
        label="Data region, set by your administrator"
        name="region"
        defaultValue="eu"
        disabled
      >
        <Field orientation="horizontal" label="European Union">
          <Radio value="eu" />
        </Field>
        <Field orientation="horizontal" label="United States">
          <Radio value="us" />
        </Field>
      </RadioGroup>
    </>
  ),

  Required: () => (
    <RadioGroup
      label="Why are you closing your account?"
      name="reason"
      required
    >
      <Field orientation="horizontal" label="It costs too much">
        <Radio value="cost" />
      </Field>
      <Field orientation="horizontal" label="It's missing features I need">
        <Radio value="features" />
      </Field>
      <Field orientation="horizontal" label="Something else">
        <Radio value="other" />
      </Field>
    </RadioGroup>
  ),
};
