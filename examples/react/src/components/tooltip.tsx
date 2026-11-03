import { Button, Tooltip } from "@harmo-ui/react";
import { CloseIcon, MoreIcon, PlusIcon } from "../app-icons.tsx";

export const examples = {
  "Describing a control": () => (
    <>
      <Tooltip description="Download the current view as a CSV file">
        <Button variant="secondary">Export</Button>
      </Tooltip>
      <Tooltip description="Hide resolved tickets from the inbox">
        <Button variant="secondary">Archive</Button>
      </Tooltip>
    </>
  ),

  "Naming an icon button": () => (
    <>
      <Tooltip label="Close">
        <Button variant="tertiary">
          <CloseIcon className="hicon" />
        </Button>
      </Tooltip>
      <Tooltip label="More actions">
        <Button variant="secondary">
          <MoreIcon className="hicon" />
        </Button>
      </Tooltip>
      <Tooltip label="Add contact">
        <Button>
          <PlusIcon className="hicon" />
        </Button>
      </Tooltip>
    </>
  ),

  "Explaining an unavailable action": () => (
    <Tooltip description="You don't have permission to analyze campaigns.">
      <Button aria-disabled="true">Analyze</Button>
    </Tooltip>
  ),

  Sides: () => (
    <>
      <Tooltip description="Above the button" side="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <Tooltip description="Below the button">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip description="To the left" side="left">
        <Button variant="secondary">Left</Button>
      </Tooltip>
      <Tooltip description="To the right" side="right">
        <Button variant="secondary">Right</Button>
      </Tooltip>
    </>
  ),

  Hint: () => (
    <Tooltip
      variant="hint"
      description="Customer satisfaction: the share of rated conversations scored 4 or 5 out of 5 in the selected period."
    >
      <Button variant="tertiary">What is CSAT?</Button>
    </Tooltip>
  ),

  "Inside a clipping container": () => (
    <Tooltip description="Fixed positioning escapes the clipping container.">
      <Button variant="secondary">Hover me</Button>
    </Tooltip>
  ),
};
