import type { CSSProperties } from "react";
import { Button, Spinner } from "@harmo-ui/react";

export const examples = {
  Sizes: () => (
    <>
      <Spinner size="small">Loading</Spinner>
      <Spinner>Loading</Spinner>
      <Spinner size="large">Loading</Spinner>
    </>
  ),

  Delayed: () => <Spinner delay>Loading</Spinner>,

  "Inside a button": () => <Button loading>Saving changes</Button>,

  "Custom size and color": () => (
    <>
      <Spinner
        style={
          { "--hspinner-size": "3.5rem", "--hspinner-stroke": "4px" } as CSSProperties
        }
      >
        Loading
      </Spinner>
      <Spinner style={{ color: "var(--harmo-green)" }}>Loading</Spinner>
    </>
  ),
};
