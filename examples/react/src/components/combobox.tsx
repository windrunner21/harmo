import { Button, Combobox, Option, OptionGroup } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => (
    <Combobox
      label="Assign to"
      name="assignee"
      placeholder="Search agents"
      emptyMessage="No agents found"
    >
      <OptionGroup label="Support">
        <Option value="sam">Sam Rivera</Option>
        <Option value="ana">Ana Lopez</Option>
      </OptionGroup>
      <OptionGroup label="Sales">
        <Option value="lee">Lee Chen</Option>
        <Option value="priya" disabled badge="Away">
          Priya Shah
        </Option>
      </OptionGroup>
    </Combobox>
  ),

  "Free text": () => (
    <Combobox label="Send a copy to" freeText name="copy-to" placeholder="Email address">
      <Option value="sam" badge="Sam Rivera">
        sam@example.com
      </Option>
      <Option value="ana" badge="Ana Lopez">
        ana@example.com
      </Option>
      <Option value="billing" badge="Billing team">
        billing@example.com
      </Option>
    </Combobox>
  ),

  Several: () => (
    <Combobox
      label="Notify"
      multiple
      required
      name="notify"
      placeholder="Search agents"
      emptyMessage="No agents found"
      defaultValue={["ana"]}
      removeLabel={(label) => `Remove ${label}`}
      moreLabel={(count) => `${count} more`}
    >
      <OptionGroup label="Support">
        <Option value="sam">Sam Rivera</Option>
        <Option value="ana">Ana Lopez</Option>
      </OptionGroup>
      <OptionGroup label="Sales">
        <Option value="lee">Lee Chen</Option>
        <Option value="priya" disabled badge="Away">
          Priya Shah
        </Option>
      </OptionGroup>
    </Combobox>
  ),

  "Several, with free text": () => (
    <Combobox
      label="Send to"
      multiple
      freeText
      name="send-to"
      placeholder="Email addresses"
      defaultValue={["ana@example.com", "sam@example.com", "lee@partner.org", "kim@partner.org"]}
      removeLabel={(label) => `Remove ${label}`}
      moreLabel={(count) => `${count} more`}
    >
      <Option value="sam@example.com">Sam Rivera</Option>
      <Option value="ana@example.com">Ana Lopez</Option>
      <Option value="billing@example.com">Billing team</Option>
    </Combobox>
  ),

  "Picked by the app": () => {
    const [owner, setOwner] = useState<string | null>(null);
    return (
      <>
        <Combobox
          label="Owner"
          name="owner"
          placeholder="Search agents"
          value={owner}
          onValueChange={setOwner}
        >
          <Option value="sam">Sam Rivera</Option>
          <Option value="ana">Ana Lopez</Option>
          <Option value="lee">Lee Chen</Option>
        </Combobox>
        <Button variant="secondary" onClick={() => setOwner("sam")}>
          Assign to me
        </Button>
      </>
    );
  },
};
