import {
  Button,
  Dialog,
  DialogClose,
  Field,
  Input,
  Kbd,
  Link,
  Option,
  Select,
} from "@harmo-ui/react";
import { useEffect, useState } from "react";

export const examples = {
  Default: () => (
    <Dialog
      id="invite-dialog"
      label="Invite people"
      closeLabel="Close"
      description="They get an email with a link to join this workspace."
      trigger={<Button>Invite people</Button>}
      form={{ method: "dialog" }}
      footer={
        <>
          <DialogClose>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit">Send invite</Button>
        </>
      }
    >
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" autoFocus />
      </Field>
    </Dialog>
  ),

  "Closing only on purpose": () => (
    <Dialog
      id="team-dialog"
      label="New team"
      closeLabel="Close"
      description="Teams share an inbox and the conversations assigned to it."
      closedby="closerequest"
      trigger={<Button>New team</Button>}
      form={{ method: "dialog" }}
      footer={
        <>
          <DialogClose>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit">Create team</Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <Field label="Name">
          <Input id="team-name" name="name" type="text" autoFocus />
        </Field>
        <Select label="Visibility" name="visibility" defaultValue="everyone">
          <Option value="everyone">Everyone in the workspace</Option>
          <Option value="members">Its members only</Option>
        </Select>
      </div>
    </Dialog>
  ),

  "Long content": () => (
    <Dialog
      id="terms-dialog"
      label="Terms of service"
      closeLabel="Close"
      trigger={<Button variant="secondary">Read the terms</Button>}
      bodyProps={{ tabIndex: 0 }}
      footer={
        <>
          <DialogClose>
            <Button variant="secondary">Decline</Button>
          </DialogClose>
          <DialogClose>
            <Button>Accept</Button>
          </DialogClose>
        </>
      }
    >
      <p>
        These terms cover your use of the workspace, the messages you send
        through it, and the data it keeps about your contacts.
      </p>
      <p>
        You&apos;re responsible for the content of your campaigns and for having
        your contacts&apos; consent to message them on each channel you use.
      </p>
      <p>
        Messages you send are kept for as long as your plan allows, then
        deleted. Exports you download are yours to keep and protect.
      </p>
      <p>
        We may change these terms. When we do, we&apos;ll tell the
        workspace&apos;s owners by email at least 30 days before the change
        applies.
      </p>
      <p>
        Either side can end the agreement at any time. When it ends, your
        workspace stays readable for 30 days, so you can export what you need.
      </p>
      <p>
        Your plan&apos;s price is billed in advance, each month or each year.
        Unused time isn&apos;t refunded, except where the law requires it.
      </p>
      <p>
        These terms are governed by the law of the country where your workspace
        was created, unless your contract says otherwise.
      </p>
      <p>
        Questions about these terms go to the address on your invoice, and
        we&apos;ll answer within five working days.
      </p>
    </Dialog>
  ),

  "Opened from a link": () => {
    const named = () =>
      new URLSearchParams(location.search).get("dialog") === "shortcuts-dialog";
    const [open, setOpen] = useState(false);

    useEffect(() => {
      const sync = () => setOpen(named());
      sync();
      addEventListener("popstate", sync);
      return () => removeEventListener("popstate", sync);
    }, []);

    return (
      <>
        <Link
          href="?dialog=shortcuts-dialog"
          onClick={(event) => {
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            const url = new URL(location.href);
            url.searchParams.set("dialog", "shortcuts-dialog");
            history.pushState({ dialog: true }, "", url);
            setOpen(true);
          }}
        >
          Keyboard shortcuts
        </Link>
        <Dialog
          id="shortcuts-dialog"
          label="Keyboard shortcuts"
          closeLabel="Close"
          open={open}
          onOpenChange={(next) => {
            if (next || !named()) return;
            if (history.state?.dialog) history.back();
            else {
              const url = new URL(location.href);
              url.searchParams.delete("dialog");
              history.replaceState(null, "", url);
              setOpen(false);
            }
          }}
        >
          <p>
            <Kbd>⌘K</Kbd> Search
          </p>
          <p>
            <Kbd>N</Kbd> New conversation
          </p>
          <p>
            <Kbd>Esc</Kbd> Close this dialog
          </p>
        </Dialog>
      </>
    );
  },
};
