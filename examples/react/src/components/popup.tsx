import { useId, useRef, useState } from "react";
import {
  Button,
  ExpandChevron,
  Field,
  FilterChip,
  Input,
  Listbox,
  Option,
  Popup,
} from "@harmo-ui/react";

export const examples = {
  Panel: () => {
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
              name="contains"
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

  Placement: () => (
    <Popup
      trigger={
        <Button variant="secondary" aria-haspopup="listbox">
          Last 30 days
          <ExpandChevron />
        </Button>
      }
    >
      <Listbox aria-label="Period" defaultValue="30">
        <Option value="7">Last 7 days</Option>
        <Option value="30">Last 30 days</Option>
        <Option value="90">Last 90 days</Option>
      </Listbox>
    </Popup>
  ),
};
