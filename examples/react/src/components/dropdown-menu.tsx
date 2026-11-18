import {
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  ExpandChevron,
} from "@harmo-ui/react";
import { useState } from "react";
import {
  CampaignsIcon,
  CopyIcon,
  EditIcon,
  MoreIcon,
  PlusIcon,
  ShareIcon,
  TicketsIcon,
  TrashIcon,
  UserIcon,
} from "../app-icons.tsx";

export const examples = {
  Actions: () => {
    const [chosen, setChosen] = useState<string | null>(null);

    return (
      <>
        <DropdownMenu
          trigger={
            <Button variant="secondary">
              Actions
              <ExpandChevron />
            </Button>
          }
        >
          <DropdownMenuItem icon={<EditIcon className="hicon" />} onClick={() => setChosen("Edit")}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem icon={<CopyIcon className="hicon" />} onClick={() => setChosen("Duplicate")}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem icon={<ShareIcon className="hicon" />} onClick={() => setChosen("Share")}>
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem icon={<TrashIcon className="hicon" />} destructive onClick={() => setChosen("Delete")}>
            Delete
          </DropdownMenuItem>
        </DropdownMenu>
        <p hidden={chosen === null}>{chosen !== null && `Chose ${chosen}`}</p>
      </>
    );
  },

  "With a submenu": () => {
    const [chosen, setChosen] = useState<string | null>(null);

    return (
      <>
        <DropdownMenu
          trigger={
            <Button variant="secondary">
              Ticket
              <ExpandChevron />
            </Button>
          }
        >
          <DropdownMenuItem icon={<EditIcon className="hicon" />} onClick={() => setChosen("Edit")}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSub label="Share" icon={<ShareIcon className="hicon" />}>
            <DropdownMenuItem onClick={() => setChosen("Email")}>Email</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setChosen("Message")}>Message</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setChosen("Copy link")}>Copy link</DropdownMenuItem>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem icon={<TrashIcon className="hicon" />} destructive onClick={() => setChosen("Delete")}>
            Delete
          </DropdownMenuItem>
        </DropdownMenu>
        <p hidden={chosen === null}>{chosen !== null && `Chose ${chosen}`}</p>
      </>
    );
  },

  "Aligned to its end": () => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <DropdownMenu
        align="end"
        trigger={
          <Button shape="circle" size="xsmall" aria-label="Create">
            <PlusIcon className="hicon" />
          </Button>
        }
      >
        <DropdownMenuItem href="#new-order" icon={<TicketsIcon className="hicon" />}>
          Order
        </DropdownMenuItem>
        <DropdownMenuItem href="#new-customer" icon={<UserIcon className="hicon" />}>
          Customer
        </DropdownMenuItem>
        <DropdownMenuItem href="#new-campaign" icon={<CampaignsIcon className="hicon" />}>
          Campaign
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  ),

  Groups: () => (
    <DropdownMenu
      trigger={
        <Button variant="tertiary" aria-label="More">
          <MoreIcon className="hicon" />
        </Button>
      }
    >
      <DropdownMenuGroup label="Workspace">
        <DropdownMenuItem href="#settings">Settings</DropdownMenuItem>
        <DropdownMenuItem href="#members">Members</DropdownMenuItem>
        <DropdownMenuItem href="#billing">Billing</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup label="Account">
        <DropdownMenuItem href="#profile">Profile</DropdownMenuItem>
        <DropdownMenuItem href="#sign-out">Sign out</DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenu>
  ),
};
