import { Button, ChevronToArrow, Link } from "@harmo/react";

export const examples = {
  "Forward and back": () => (
    <>
      <Button variant="secondary">
        <ChevronToArrow direction="back" />
        Go back
      </Button>
      <Button>
        Continue
        <ChevronToArrow />
      </Button>
    </>
  ),

  "In a link": () => (
    <Link href="/blog/automations">
      Read the story
      <ChevronToArrow />
    </Link>
  ),

  "Right to left": () => (
    <>
      <Button variant="secondary">
        <ChevronToArrow direction="back" />
        رجوع
      </Button>
      <Button>
        متابعة
        <ChevronToArrow />
      </Button>
    </>
  ),

  "Without animation": () => (
    <Button disabled>
      Continue
      <ChevronToArrow />
    </Button>
  ),
};
