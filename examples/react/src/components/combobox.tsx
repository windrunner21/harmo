import { Button, Combobox, Field, Option, OptionGroup } from "@harmo-ui/react";
import { useEffect, useState } from "react";

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

  "Searching as you type": () => {
    // Stands in for a search on your server.
    const agents = [
      { value: "sam", name: "Sam Rivera" },
      { value: "ana", name: "Ana Lopez" },
      { value: "lee", name: "Lee Chen" },
      { value: "priya", name: "Priya Shah" },
    ];
    const [text, setText] = useState("");
    const [results, setResults] = useState<typeof agents>([]);
    useEffect(() => {
      const wanted = text.trim().toLowerCase();
      const timer = setTimeout(
        () => setResults(wanted ? agents.filter((agent) => agent.name.toLowerCase().includes(wanted)) : []),
        300,
      );
      return () => clearTimeout(timer);
    }, [text]);

    return (
      <Combobox
        label="Find an agent"
        name="find-agent"
        placeholder="Search agents"
        filter={false}
        onInputChange={setText}
      >
        {results.map((agent) => (
          <Option key={agent.value} value={agent.value}>
            {agent.name}
          </Option>
        ))}
      </Combobox>
    );
  },

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

  Disabled: () => (
    <Combobox label="Assigned to" name="assigned" defaultValue="sam" disabled>
      <Option value="sam">Sam Rivera</Option>
      <Option value="ana">Ana Lopez</Option>
    </Combobox>
  ),

  "In a form": () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Combobox label="Owner" name="form-owner" defaultValue="sam">
        <Option value="sam">Sam Rivera</Option>
        <Option value="ana">Ana Lopez</Option>
      </Combobox>
      <Combobox label="Reply to" freeText name="form-reply-to" defaultValue="sam@example.com">
        <Option value="sam">sam@example.com</Option>
        <Option value="ana">ana@example.com</Option>
      </Combobox>
      <Field label="Watchers" control="combobox">
        <Combobox
          multiple
          name="form-watchers"
          defaultValue={["ana"]}
          removeLabel={(label) => `Remove ${label}`}
          moreLabel={(count) => `${count} more`}
        >
          <Option value="sam">Sam Rivera</Option>
          <Option value="ana">Ana Lopez</Option>
        </Combobox>
        <input type="hidden" name="form-record" value="42" />
      </Field>
      <Button variant="secondary" type="reset" style={{ alignSelf: "flex-start" }}>
        Reset
      </Button>
    </form>
  ),
};
