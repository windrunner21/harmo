import { Button, ChevronToArrow } from "@harmo/react";
import { useState } from "react";
import { CloseIcon, MoreIcon, PlusIcon } from "../app-icons.tsx";

export const examples = {
  Variants: () => (
    <>
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="tertiary">Show details</Button>
    </>
  ),

  Small: () => (
    <>
      <Button size="small">Save changes</Button>
      <Button variant="secondary" size="small">
        Cancel
      </Button>
      <Button variant="tertiary" size="small">
        Show details
      </Button>
    </>
  ),

  Disabled: () => (
    <>
      <Button disabled>Save changes</Button>
      <Button variant="secondary" disabled>
        Cancel
      </Button>
      <Button variant="tertiary" disabled>
        Show details
      </Button>
      <Button size="small" disabled>
        Save changes
      </Button>
      <Button aria-disabled="true">Publish</Button>
    </>
  ),

  Links: () => (
    <>
      <Button href="/campaigns/new">Create campaign</Button>
      <Button variant="secondary" href="/reports">
        View reports
      </Button>
      <Button variant="tertiary" href="/help">
        Read more
      </Button>
    </>
  ),

  "Icon only": () => (
    <>
      <Button variant="tertiary" aria-label="Close">
        <CloseIcon className="hicon" />
      </Button>
      <Button variant="secondary" aria-label="More actions">
        <MoreIcon className="hicon" />
      </Button>
      <Button aria-label="Add contact">
        <PlusIcon className="hicon" />
      </Button>
      <Button variant="secondary" size="small" aria-label="More actions">
        <MoreIcon className="hicon" />
      </Button>
      <Button aria-label="Add contact" disabled>
        <PlusIcon className="hicon" />
      </Button>
    </>
  ),

  "Side by side": () => (
    <>
      <Button variant="secondary">Export</Button>
      <Button variant="secondary" aria-label="More actions">
        <MoreIcon className="hicon" />
      </Button>
      <Button>Save changes</Button>
    </>
  ),

  "With an arrow": () => (
    <>
      <Button variant="secondary">
        <ChevronToArrow direction="back" />
        Go back
      </Button>
      <Button>
        Continue
        <ChevronToArrow />
      </Button>
      <Button variant="tertiary" href="/reports">
        All reports
        <ChevronToArrow />
      </Button>
    </>
  ),

  "Right to left": () => (
    <>
      <Button variant="secondary">
        <ChevronToArrow direction="back" />
        رجوع
      </Button>
      <Button>
        متابعة
        <ChevronToArrow />
      </Button>
    </>
  ),

  "Long labels": () => (
    <>
      <Button>Save changes and notify everyone</Button>
      <Button variant="secondary">Export every conversation</Button>
    </>
  ),

  Loading: () => {
    const [saving, setSaving] = useState(false);
    const save = () => {
      setSaving(true);
      setTimeout(() => setSaving(false), 2000);
    };

    return (
      <>
        <Button loading>Saving changes</Button>
        <Button variant="secondary" loading>
          Exporting
        </Button>
        <Button aria-label="Adding contact" loading>
          <PlusIcon className="hicon" />
        </Button>
        <Button loading={saving} onClick={save}>
          Save changes
        </Button>
      </>
    );
  },
};
