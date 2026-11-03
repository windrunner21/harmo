import { useId, useRef, useState } from "react";
import {
  Button,
  Field,
  FilterChip,
  Input,
  Option,
  Popup,
} from "@harmo-ui/react";

export const examples = {
  "Nothing chosen": () => (
    <FilterChip
      label="Status"
      multiple
      clearLabel="Clear filters"
      formatCount={(count) => `${count} selected`}
    >
      <Option value="delivered">Delivered</Option>
      <Option value="read">Read</Option>
      <Option value="failed">Failed</Option>
      <Option value="pending">Pending</Option>
    </FilterChip>
  ),

  "One value": () => (
    <FilterChip label="Channel" defaultValue="whatsapp">
      <Option value="whatsapp">WhatsApp</Option>
      <Option value="telegram">Telegram</Option>
      <Option value="email">Email</Option>
    </FilterChip>
  ),

  "Two values": () => (
    <FilterChip
      label="Priority"
      multiple
      defaultValue={["high", "urgent"]}
      clearLabel="Clear filters"
      formatCount={(count) => `${count} selected`}
    >
      <Option value="low">Low</Option>
      <Option value="medium">Medium</Option>
      <Option value="high">High</Option>
      <Option value="urgent">Urgent</Option>
    </FilterChip>
  ),

  "More than two": () => (
    <FilterChip
      label="Tags"
      multiple
      defaultValue={["refund", "invoice", "bug"]}
      clearLabel="Clear filters"
      formatCount={(count) => `${count} selected`}
    >
      <Option value="refund">Refund</Option>
      <Option value="invoice">Invoice</Option>
      <Option value="bug">Bug report</Option>
      <Option value="feature">Feature request</Option>
    </FilterChip>
  ),

  "Text filter": () => {
    const id = useId();
    const popup = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const [text, setText] = useState("");
    const apply = () => {
      setText(input.current?.value.trim() ?? "");
      popup.current?.hidePopover();
    };

    return (
      <Popup
        ref={popup}
        id={id}
        trigger={
          <FilterChip label="Name contains" values={text ? [text] : undefined} />
        }
      >
        <div style={{ display: "grid", gap: 16, padding: 12 }}>
          <Field label="Name contains">
            <Input
              ref={input}
              name="name"
              type="text"
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                apply();
              }}
            />
          </Field>
          <Button
            popoverTarget={id}
            popoverTargetAction="hide"
            onClick={apply}
          >
            Apply
          </Button>
        </div>
      </Popup>
    );
  },

  Disabled: () => <FilterChip label="Assignee" disabled />,
};
