import { Field, Radio, RadioGroup } from "@harmo-ui/react";

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

  Cards: () => (
    <RadioGroup label="Plan" name="plan" defaultValue="team">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(13rem, 100%), 1fr))",
          gap: "var(--harmo-space-xs)",
        }}
      >
        <Field
          orientation="horizontal"
          variant="card"
          label="Starter"
          description="For one person, with up to 3 projects."
        >
          <Radio value="starter" />
        </Field>
        <Field
          orientation="horizontal"
          variant="card"
          label="Team"
          description="For up to 20 people, with shared projects."
        >
          <Radio value="team" />
        </Field>
        <Field
          orientation="horizontal"
          variant="card"
          label="Business"
          description="For a whole company, with single sign-on."
        >
          <Radio value="business" />
        </Field>
      </div>
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
