import { Button, Card, ChevronToArrow, Setting, Settings } from "@harmo-ui/react";
import { useState } from "react";
import { CloseIcon, MoreIcon, PlusIcon, TrashIcon } from "../app-icons.tsx";

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

  Destructive: () => (
    <Card variant="raised">
      <Settings>
        <Setting
          label="Clear the import history"
          description="Removes the list of past contact imports. The contacts stay."
        >
          <Button variant="tertiary" destructive>
            Clear history
          </Button>
        </Setting>
        <Setting
          label="Remove every member"
          description="Everyone but you loses access. Their conversations stay."
        >
          <Button variant="secondary" destructive>
            Remove members
          </Button>
        </Setting>
        <Setting
          label="Delete this workspace"
          description="Deletes its conversations, contacts, and campaigns. This can't be undone."
        >
          <Button destructive>Delete workspace</Button>
        </Setting>
      </Settings>
    </Card>
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

  "Hold to confirm": () => {
    const [deleting, setDeleting] = useState(false);
    const [sending, setSending] = useState(false);
    const work = (set: (on: boolean) => void) => () => {
      set(true);
      setTimeout(() => set(false), 1500);
    };
    return (
      <Settings>
        <Setting
          label="Delete the Spring sale campaign"
          description="Its 3 scheduled runs are canceled, and its reports are deleted."
        >
          <Button
            variant="secondary"
            size="small"
            destructive
            loading={deleting}
            onHold={work(setDeleting)}
          >
            <TrashIcon className="hicon" />
            {deleting ? "Deleting" : "Hold to delete"}
          </Button>
        </Setting>
        <Setting
          label="Send the Spring sale campaign"
          description="To 1,240 recipients, now. A sent message can't be called back."
        >
          <Button loading={sending} onHold={work(setSending)}>
            {sending ? "Sending" : "Hold to send"}
          </Button>
        </Setting>
      </Settings>
    );
  },
};
