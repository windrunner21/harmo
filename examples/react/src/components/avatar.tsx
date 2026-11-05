import type { CSSProperties } from "react";
import { Avatar } from "@harmo-ui/react";
import { UserIcon } from "../app-icons.tsx";

export const examples = {
  "Image, icon, or initials": () => (
    <>
      <Avatar src="images/imran.webp" alt="Imran Hajiyev" />
      <Avatar alt="Imran Hajiyev">
        <UserIcon />
      </Avatar>
      <Avatar alt="Imran Hajiyev">IH</Avatar>
    </>
  ),

  Sizes: () => (
    <>
      <Avatar alt="Imran Hajiyev" style={{ "--harmo-avatar-size": "4rem" } as CSSProperties}>
        IH
      </Avatar>
      <Avatar alt="Imran Hajiyev" style={{ "--harmo-avatar-size": "4rem" } as CSSProperties}>
        <UserIcon />
      </Avatar>
      <Avatar alt="Imran Hajiyev">IH</Avatar>
      <Avatar alt="Imran Hajiyev" style={{ "--harmo-avatar-size": "1.5rem" } as CSSProperties}>
        IH
      </Avatar>
    </>
  ),

  "Next to a name": () => (
    <>
      <Avatar src="images/imran.webp" alt="" />
      <span>Imran Hajiyev</span>
    </>
  ),
};
