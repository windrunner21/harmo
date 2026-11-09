import { Button, Checkbox, Field, SelectionBar, FilterChip, Filters, Toolbar, Tooltip } from "@harmo-ui/react";
import { useRef, useState } from "react";

export const examples = {
  Default: () => (
    <SelectionBar label="3 selected" deselectLabel="Deselect" onDeselect={() => {}}>
      <Button variant="secondary" size="small">
        Assign
      </Button>
      <Button variant="secondary" size="small" destructive>
        Delete
      </Button>
    </SelectionBar>
  ),

  "In a toolbar": () => {
    const tasks = ["Write the brief", "Review the designs", "Ship the release"];
    const [selected, setSelected] = useState<string[]>([]);
    const first = useRef<HTMLInputElement>(null);

    return (
      <div data-example-selection="" style={{ display: "grid", gap: 16, inlineSize: "100%" }}>
        <Toolbar
          controls={
            selected.length > 0 ? (
              <SelectionBar
                label={`${selected.length} selected`}
                deselectLabel="Deselect"
                onDeselect={() => {
                  setSelected([]);
                  first.current?.focus();
                }}
              >
                <Button variant="secondary" size="small">
                  Assign
                </Button>
              </SelectionBar>
            ) : (
              <Button variant="secondary" size="small">
                Export
              </Button>
            )
          }
        >
          <Filters aria-label="Filter tasks" resetLabel="Reset filters">
            <FilterChip label="Status" />
          </Filters>
        </Toolbar>
        <div style={{ display: "grid", gap: 8 }}>
          {tasks.map((task, index) => (
            <Field key={task} orientation="horizontal" label={task}>
              <Checkbox
                ref={index === 0 ? first : undefined}
                checked={selected.includes(task)}
                onChange={(event) =>
                  setSelected((was) =>
                    event.target.checked ? [...was, task] : was.filter((each) => each !== task),
                  )
                }
              />
            </Field>
          ))}
        </div>
      </div>
    );
  },

  "An action that's blocked": () => (
    <SelectionBar label="2 selected" deselectLabel="Deselect" onDeselect={() => {}}>
      <Button variant="secondary" size="small">
        Assign
      </Button>
      <Tooltip description="Only a project's owner can delete its tasks.">
        <Button variant="secondary" size="small" destructive aria-disabled="true">
          Delete
        </Button>
      </Tooltip>
    </SelectionBar>
  ),

  "Right to left": () => (
    <SelectionBar label="٣ محددة" deselectLabel="إلغاء التحديد" onDeselect={() => {}}>
      <Button variant="secondary" size="small">
        تعيين
      </Button>
    </SelectionBar>
  ),
};
