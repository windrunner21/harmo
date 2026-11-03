import type { CSSProperties } from "react";
import { Avatar } from "@harmo-ui/react";
import { UserIcon } from "../app-icons.tsx";

export const examples = {
  "Image, icon, or initials": () => (
    <>
      <Avatar src="images/jane.svg" alt="Jane Smith" />
      <Avatar alt="Jane Smith">
        <UserIcon />
      </Avatar>
      <Avatar alt="Jane Smith">JS</Avatar>
    </>
  ),

  Sizes: () => (
    <>
      <Avatar alt="Jane Smith" style={{ "--harmo-avatar-size": "4rem" } as CSSProperties}>
        JS
      </Avatar>
      <Avatar alt="Jane Smith" style={{ "--harmo-avatar-size": "4rem" } as CSSProperties}>
        <UserIcon />
      </Avatar>
      <Avatar alt="Jane Smith">JS</Avatar>
      <Avatar alt="Jane Smith" style={{ "--harmo-avatar-size": "1.5rem" } as CSSProperties}>
        JS
      </Avatar>
    </>
  ),

  "Next to a name": () => (
    <>
      <Avatar src="images/jane.svg" alt="" />
      <span>Jane Smith</span>
    </>
  ),
};
