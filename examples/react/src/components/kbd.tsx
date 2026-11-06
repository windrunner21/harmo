import { Button, Kbd } from "@harmo-ui/react";

export const examples = {
  "In text": () => (
    <p>
      Press <Kbd>Enter</Kbd> to choose an option, or <Kbd>Esc</Kbd> to close
      the list.
    </p>
  ),

  Shortcuts: () => (
    <>
      <p>
        <Kbd>⌘K</Kbd> Search
      </p>
      <p>
        <Kbd>↑</Kbd> <Kbd>↓</Kbd> Move through the results
      </p>
      <p>
        <Kbd>↵</Kbd> Open the result
      </p>
    </>
  ),

  "On a button": () => (
    <>
      <Button aria-keyshortcuts="N">
        Create <Kbd aria-hidden="true">N</Kbd>
      </Button>
      <Button variant="secondary" aria-keyshortcuts="E">
        Export <Kbd aria-hidden="true">E</Kbd>
      </Button>
    </>
  ),
};
