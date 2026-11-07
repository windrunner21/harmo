import {
  Button,
  Drawer,
  DrawerClose,
  Field,
  Input,
  toast,
  Toaster,
  type ToastPosition,
} from "@harmo-ui/react";
import { useSyncExternalStore } from "react";
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from "../app-icons.tsx";

// The Positions example's choice, for the Toaster in the Default example,
// which is a separate root on the playground page.
let position: ToastPosition = "bottom-center";
const listeners = new Set<() => void>();
const usePosition = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => position,
    () => "bottom-center" as const,
  );
const moveTo = (next: ToastPosition) => {
  position = next;
  for (const listener of listeners) listener();
};

const positions: [ToastPosition, string][] = [
  ["top-start", "Top start"],
  ["top-center", "Top center"],
  ["top-end", "Top end"],
  ["bottom-start", "Bottom start"],
  ["bottom-center", "Bottom center"],
  ["bottom-end", "Bottom end"],
];

const icons = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
};

export const examples = {
  Default: () => (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            status: "success",
            title: "Quick reply saved",
            description: "Type /ship in a chat to use it.",
          })
        }
      >
        Save quick reply
      </Button>
      <Toaster label="Notifications (F8)" icons={icons} position={usePosition()} />
    </>
  ),

  "Each status": () => (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            status: "success",
            title: "Contact added",
            description: "Sam Rivera, +44 7700 900123",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            status: "error",
            title: "Couldn't send the campaign",
            description: "WhatsApp rejected the template. Edit it and try again.",
          })
        }
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            status: "warning",
            title: "3 contacts weren't imported",
            description:
              "Their phone numbers have no country code, so they were skipped. The import report lists them.",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ status: "info", title: "Export started" })}
      >
        Info
      </Button>
    </>
  ),

  "A stack": () => (
    <Button
      variant="secondary"
      onClick={() => {
        toast({
          status: "success",
          title: "Contact added",
          description: "Sam Rivera, +44 7700 900123",
        });
        setTimeout(
          () =>
            toast({
              status: "warning",
              title: "2 contacts were already in the list",
              description: "We kept the existing ones and skipped the copies.",
            }),
          250,
        );
        setTimeout(() => toast({ status: "info", title: "Chat assigned to you" }), 500);
      }}
    >
      Send three
    </Button>
  ),

  "With an action": () => (
    <Button
      variant="secondary"
      onClick={() => {
        const id = toast({
          status: "success",
          title: "Conversation archived",
          description: "Sam Rivera · Order #1042",
          action: { label: "Undo", onClick: () => toast.dismiss(id) },
        });
      }}
    >
      Archive conversation
    </Button>
  ),

  "Kept open, then changed": () => (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            id: "connection",
            status: "error",
            title: "You're offline",
            description: "New messages will show when you reconnect.",
            duration: Infinity,
            action: {
              label: "Try again",
              onClick: () => toast.dismiss("connection"),
            },
          })
        }
      >
        Go offline
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            id: "connection",
            status: "success",
            title: "Back online",
            duration: 2000,
          })
        }
      >
        Reconnect
      </Button>
    </>
  ),

  Positions: () => (
    <>
      {positions.map(([value, label]) => (
        <Button
          key={value}
          variant="secondary"
          onClick={() => {
            moveTo(value);
            toast({ title: `Shown at the ${label.toLowerCase()}` });
          }}
        >
          {label}
        </Button>
      ))}
    </>
  ),

  "Over a drawer": () => (
    <Drawer
      id="toast-reply-drawer"
      label="New quick reply"
      closeLabel="Close"
      closedby="closerequest"
      trigger={<Button>New quick reply</Button>}
      form={{
        method: "dialog",
        onSubmit: (event) => {
          const shortcut = new FormData(event.currentTarget).get("shortcut");
          const value = String(shortcut ?? "").trim();
          if (value === "/ship") {
            event.preventDefault();
            toast({
              status: "error",
              title: "Couldn't save the quick reply",
              description: `The shortcut ${value} is already taken. Pick another one.`,
            });
            return;
          }
          toast({
            status: "success",
            title: "Quick reply saved",
            description: `Type ${value} in a chat to use it.`,
          });
        },
      }}
      footer={
        <>
          <DrawerClose>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
          <Button type="submit">Save</Button>
        </>
      }
    >
      <Field label="Shortcut">
        <Input
          id="toast-reply-shortcut"
          name="shortcut"
          type="text"
          defaultValue="/ship"
          autoFocus
        />
      </Field>
    </Drawer>
  ),
};
