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
      <Avatar alt="Imran Hajiyev" style={{ "--harmo-avatar-size": "4rem" }}>
        IH
      </Avatar>
      <Avatar alt="Imran Hajiyev" style={{ "--harmo-avatar-size": "4rem" }}>
        <UserIcon />
      </Avatar>
      <Avatar alt="Imran Hajiyev">IH</Avatar>
      <Avatar alt="Imran Hajiyev" style={{ "--harmo-avatar-size": "1.5rem" }}>
        IH
      </Avatar>
    </>
  ),

  "Next to a name": () => (
    <>
      <Avatar src="images/imran.webp" alt="" />
      <span>Imran Hajiyev</span>
      <Avatar alt="">SR</Avatar>
      <span>Sam Rivera</span>
    </>
  ),
};
