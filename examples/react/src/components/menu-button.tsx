import { MenuButton } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => {
    const [open, setOpen] = useState(false);

    return <MenuButton aria-label="Menu" open={open} onOpenChange={setOpen} />;
  },
};
