import { Button, ExpandChevron } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  "Collapsed and expanded": () => (
    <>
      <Button variant="tertiary" aria-expanded={false}>
        Filters
        <ExpandChevron />
      </Button>
      <Button variant="tertiary" aria-expanded>
        Filters
        <ExpandChevron />
      </Button>
    </>
  ),

  Toggling: () => {
    const [expanded, setExpanded] = useState(false);

    return (
      <Button
        variant="secondary"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        More options
        <ExpandChevron />
      </Button>
    );
  },
};
