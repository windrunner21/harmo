import { Button, Field, FileInput } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <Field label="Attachment">
      <FileInput
        name="attachment"
        chooseLabel="Choose file"
        removeLabel="Remove attachment"
      />
    </Field>
  ),
  "Limited to a type and size": () => (
    <Field label="Task list" description="A CSV file, up to 1 MB.">
      <FileInput
        name="task-list"
        accept=".csv"
        chooseLabel="Choose file"
        removeLabel="Remove task list"
        validate={(file) => {
          if (!file.name.toLowerCase().endsWith(".csv")) {
            return "Use a CSV file.";
          }
          if (file.size > 1024 * 1024) return "Use a file of 1 MB or less.";
          return null;
        }}
      />
    </Field>
  ),
  "Compact drop area": () => (
    <Field label="Attachment">
      <FileInput
        name="attachment-strip"
        variant="strip"
        dropLabel="or drop it here"
        chooseLabel="Choose file"
        removeLabel="Remove attachment"
      />
    </Field>
  ),
  "Large drop area": () => (
    <Field label="Task list">
      <FileInput
        name="task-list-area"
        variant="area"
        heading="Upload a task list"
        dropLabel="Drag it here, or choose it below."
        hint="A CSV file, up to 1 MB."
        accept=".csv"
        chooseLabel="Choose file"
        removeLabel="Remove task list"
        validate={(file) => {
          if (!file.name.toLowerCase().endsWith(".csv")) {
            return "Use a CSV file.";
          }
          if (file.size > 1024 * 1024) return "Use a file of 1 MB or less.";
          return null;
        }}
      />
    </Field>
  ),
  Avatar: () => (
    <FileInput
      name="avatar"
      variant="avatar"
      accept="image/*"
      chooseLabel="Upload picture"
      changeLabel="Change picture"
      hint="PNG or JPG"
      removeLabel="Remove picture"
      validate={(file) =>
        file.type.startsWith("image/") ? null : "Use an image."
      }
    />
  ),
  "Avatar with a picture": () => (
    <FileInput
      name="avatar-set"
      variant="avatar"
      accept="image/*"
      defaultPreview="images/imran.webp"
      chooseLabel="Upload picture"
      changeLabel="Change picture"
      hint="PNG or JPG"
      removeLabel="Remove picture"
    />
  ),
  "With a file already attached": () => (
    <Field label="Project brief">
      <FileInput
        name="brief"
        defaultFileName="project-brief.pdf"
        chooseLabel="Choose file"
        removeLabel="Remove project brief"
      />
    </Field>
  ),
  "Long file name": () => (
    <Field label="Notes">
      <FileInput
        name="notes"
        defaultFileName="quarterly-planning-notes-for-the-whole-team-with-every-appendix-and-every-draft.pdf"
        chooseLabel="Choose file"
        removeLabel="Remove notes"
      />
    </Field>
  ),
  Disabled: () => (
    <>
      <Field label="Cover image">
        <FileInput
          name="cover"
          disabled
          chooseLabel="Choose file"
          removeLabel="Remove cover image"
        />
      </Field>
      <Field label="Contract">
        <FileInput
          name="contract"
          disabled
          defaultFileName="contract.pdf"
          chooseLabel="Choose file"
          removeLabel="Remove contract"
        />
      </Field>
      <Field label="Terms">
        <FileInput
          name="terms"
          variant="strip"
          dropLabel="or drop it here"
          disabled
          chooseLabel="Choose file"
          removeLabel="Remove terms"
        />
      </Field>
    </>
  ),
  "In a form": () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Timeline">
        <FileInput
          name="timeline"
          defaultFileName="timeline.pdf"
          chooseLabel="Choose file"
          removeLabel="Remove timeline"
        />
      </Field>
      <Button
        variant="secondary"
        type="reset"
        style={{ alignSelf: "flex-start" }}
      >
        Reset
      </Button>
    </form>
  ),
};
