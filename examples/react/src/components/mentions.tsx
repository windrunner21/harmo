import { Field, Mentions, Option } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <Field label="Internal note">
      <Mentions listLabel="People" placeholder="Type @ to mention someone">
        <Option value="sam" description="@sam">
          Sam Rivera
        </Option>
        <Option value="ana" description="@ana">
          Ana Lopez
        </Option>
        <Option value="maya" description="@maya">
          Maya Chen
        </Option>
      </Mentions>
    </Field>
  ),

  "One line": () => (
    <Field label="Task">
      <Mentions singleLine listLabel="People" placeholder="Type @ to assign someone">
        <Option value="sam" description="@sam">
          Sam Rivera
        </Option>
        <Option value="ana" description="@ana">
          Ana Lopez
        </Option>
        <Option value="maya" description="@maya">
          Maya Chen
        </Option>
      </Mentions>
    </Field>
  ),

  Commands: () => (
    <Field label="Message">
      <Mentions listLabel="Commands" trigger="/" atStart side="top" placeholder="Type / for a command">
        <Option value="summarize" description="Summarize this ticket">
          /summarize
        </Option>
        <Option value="draft" description="Draft a reply">
          /draft
        </Option>
        <Option value="translate" description="Translate the customer's message">
          /translate
        </Option>
      </Mentions>
    </Field>
  ),
};
