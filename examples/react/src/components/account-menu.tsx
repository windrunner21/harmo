import {
  AccountMenu,
  Avatar,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
} from "@harmo-ui/react";
import { BusinessIcon, SettingsIcon, SignOutIcon, UserIcon } from "../app-icons.tsx";

export const examples = {
  Default: () => (
    <div style={{ inlineSize: "15rem" }}>
      <AccountMenu name="Imran Hajiyev" description="Speedwagon" avatar={<Avatar src="images/imran.webp" alt="" />}>
        <DropdownMenuItem href="#settings" icon={<SettingsIcon className="hicon" />}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup label="Switch account">
          <DropdownMenuItem href="#joestar-group" icon={<BusinessIcon className="hicon" />}>
            Joestar Group
          </DropdownMenuItem>
          <DropdownMenuItem href="#stardust-travel" icon={<BusinessIcon className="hicon" />}>
            Stardust Travel
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem href="#profile" icon={<UserIcon className="hicon" />}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem href="#sign-out" icon={<SignOutIcon className="hicon" />}>
          Sign out
        </DropdownMenuItem>
      </AccountMenu>
    </div>
  ),

  Initials: () => (
    <div style={{ inlineSize: "15rem" }}>
      <AccountMenu
        name="Robert Edward O. Speedwagon"
        description="robert.speedwagon@speedwagon-foundation.example"
        avatar={
          <Avatar alt="">
            RS
          </Avatar>
        }
      >
        <DropdownMenuItem href="#settings" icon={<SettingsIcon className="hicon" />}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem href="#sign-out" icon={<SignOutIcon className="hicon" />}>
          Sign out
        </DropdownMenuItem>
      </AccountMenu>
    </div>
  ),

  Profile: () => (
    <div style={{ inlineSize: "15rem" }}>
      <AccountMenu name="Imran Hajiyev" description="Speedwagon" avatar={<Avatar src="images/imran.webp" alt="" />} profile>
        <DropdownMenuItem href="#settings" icon={<SettingsIcon className="hicon" />}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem href="#profile" icon={<UserIcon className="hicon" />}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem href="#sign-out" icon={<SignOutIcon className="hicon" />}>
          Sign out
        </DropdownMenuItem>
      </AccountMenu>
    </div>
  ),

  "Many accounts": () => (
    <div style={{ inlineSize: "15rem" }}>
      <AccountMenu
        name="Imran Hajiyev"
        description="Speedwagon"
        avatar={<Avatar src="images/imran.webp" alt="" />}
      >
        <DropdownMenuItem href="#settings" icon={<SettingsIcon className="hicon" />}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub label="Other accounts" icon={<BusinessIcon className="hicon" />}>
          <DropdownMenuItem href="#joestar-group" icon={<BusinessIcon className="hicon" />}>
            Joestar Group
          </DropdownMenuItem>
          <DropdownMenuItem href="#stardust-travel" icon={<BusinessIcon className="hicon" />}>
            Stardust Travel
          </DropdownMenuItem>
          <DropdownMenuItem href="#passione-logistics" icon={<BusinessIcon className="hicon" />}>
            Passione Logistics
          </DropdownMenuItem>
          <DropdownMenuItem href="#speedwagon-foundation" icon={<BusinessIcon className="hicon" />}>
            Speedwagon Foundation
          </DropdownMenuItem>
          <DropdownMenuItem href="#morioh-grand-hotel" icon={<BusinessIcon className="hicon" />}>
            Morioh Grand Hotel
          </DropdownMenuItem>
          <DropdownMenuItem href="#kame-yu-department-store" icon={<BusinessIcon className="hicon" />}>
            Kame Yu Department Store
          </DropdownMenuItem>
          <DropdownMenuItem href="#trattoria-trussardi" icon={<BusinessIcon className="hicon" />}>
            Trattoria Trussardi
          </DropdownMenuItem>
          <DropdownMenuItem href="#libeccio-ristorante" icon={<BusinessIcon className="hicon" />}>
            Libeccio Ristorante
          </DropdownMenuItem>
          <DropdownMenuItem href="#green-dolphin-supply" icon={<BusinessIcon className="hicon" />}>
            Green Dolphin Supply
          </DropdownMenuItem>
          <DropdownMenuItem href="#steel-ball-run-events" icon={<BusinessIcon className="hicon" />}>
            Steel Ball Run Events
          </DropdownMenuItem>
          <DropdownMenuItem href="#bucciarati-tailors" icon={<BusinessIcon className="hicon" />}>
            Bucciarati Tailors
          </DropdownMenuItem>
          <DropdownMenuItem href="#sandman-couriers" icon={<BusinessIcon className="hicon" />}>
            Sandman Couriers
          </DropdownMenuItem>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem href="#profile" icon={<UserIcon className="hicon" />}>
          Imran Hajiyev
        </DropdownMenuItem>
        <DropdownMenuItem href="#sign-out" icon={<SignOutIcon className="hicon" />}>
          Sign out
        </DropdownMenuItem>
      </AccountMenu>
    </div>
  ),
};
