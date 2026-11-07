import {
  Avatar,
  Button,
  Card,
  Drawer,
  DrawerClose,
  Field,
  Input,
  Link,
  Status,
  TextArea,
} from "@harmo-ui/react";
import { useEffect, useState } from "react";

export const examples = {
  Default: () => (
    <Drawer
      id="reply-drawer"
      label="New quick reply"
      closeLabel="Close"
      closedby="closerequest"
      trigger={<Button>New quick reply</Button>}
      form={{ method: "dialog" }}
      footer={
        <>
          <DrawerClose>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
          <Button type="submit">Save</Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <Field label="Shortcut">
          <Input id="reply-shortcut" name="shortcut" type="text" autoFocus />
        </Field>
        <Field label="Message">
          <TextArea id="reply-message" name="message" />
        </Field>
      </div>
    </Drawer>
  ),

  "With an aside": () => (
    <Drawer
      id="template-drawer"
      label="Edit template"
      description="Changes apply to the next campaign that uses it."
      closeLabel="Close"
      closedby="closerequest"
      trigger={<Button>Edit template</Button>}
      form={{ method: "dialog" }}
      footer={
        <>
          <DrawerClose>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
          <Button type="submit">Save template</Button>
        </>
      }
      aside={
        <>
          <p>How it looks to a customer:</p>
          <Card variant="raised">
            <p>
              Hi Sam, your order #1042 is on its way. Track it with the link in
              your confirmation email.
            </p>
          </Card>
        </>
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <Field label="Name">
          <Input
            id="template-name"
            name="template-name"
            type="text"
            defaultValue="Order shipped"
          />
        </Field>
        <Field label="Message">
          <TextArea
            id="template-body"
            name="template-body"
            defaultValue="Hi Sam, your order #1042 is on its way. Track it with the link in your confirmation email."
          />
        </Field>
      </div>
    </Drawer>
  ),

  "Opened from a link": () => {
    const named = () =>
      new URLSearchParams(location.search).get("dialog") === "contact-drawer";
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
          href="?dialog=contact-drawer"
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
            url.searchParams.set("dialog", "contact-drawer");
            history.pushState({ dialog: true }, "", url);
            setOpen(true);
          }}
        >
          Sam Rivera
        </Link>
        <Drawer
          id="contact-drawer"
          label="Sam Rivera"
          description="Added on 12 March, from WhatsApp."
          closeLabel="Close"
          closedby="closerequest"
          form={{ method: "dialog" }}
          footer={
            <>
              <DrawerClose>
                <Button variant="secondary">Cancel</Button>
              </DrawerClose>
              <Button type="submit">Save</Button>
            </>
          }
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
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar alt="Sam Rivera">SR</Avatar>
              <Status status="success">Subscribed</Status>
            </div>
            <Field label="Name">
              <Input id="contact-name" name="name" type="text" defaultValue="Sam Rivera" />
            </Field>
            <Field label="Phone">
              <Input id="contact-phone" name="phone" type="tel" defaultValue="+44 7700 900123" />
            </Field>
            <Field label="Email">
              <Input id="contact-email" name="email" type="email" defaultValue="sam@example.com" />
            </Field>
          </div>
        </Drawer>
      </>
    );
  },
};
