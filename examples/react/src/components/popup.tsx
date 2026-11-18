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
        <div style={{ display: "grid", gap: "var(--harmo-space-sm)", padding: "var(--harmo-space-xs)" }}>
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

  "Aligned to its end": () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--harmo-space-sm)" }}>
      <span style={{ color: "var(--harmo-color-text-secondary)", fontSize: "var(--harmo-font-size-sm)" }}>12 orders</span>
      <Popup
        align="end"
        trigger={
          <Button variant="secondary" aria-haspopup="listbox">
            Newest first
            <ExpandChevron />
          </Button>
        }
      >
        <Listbox aria-label="Sort by" defaultValue="newest">
          <Option value="newest">Newest first</Option>
          <Option value="oldest">Oldest first</Option>
          <Option value="total">Largest total</Option>
          <Option value="customer">Customer, A to Z</Option>
        </Listbox>
      </Popup>
    </div>
  ),
};
