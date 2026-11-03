import { Button, Chevron, Link } from "@harmo-ui/react";
import { ChevronIcon } from "../app-icons.tsx";

export const examples = {
  "Static chevron": () => (
    <>
      <Link href="/settings">
        Settings
        <Chevron />
      </Link>
      <Link href="/settings">
        Settings
        <ChevronIcon className="hicon" />
      </Link>
    </>
  ),

  "Following the text": () => (
    <>
      <Link href="/settings" style={{ fontSize: "0.875rem" }}>
        Settings
        <Chevron />
      </Link>
      <Link href="/settings">
        Settings
        <Chevron />
      </Link>
      <Link href="/settings" style={{ fontSize: "1.25rem" }}>
        Settings
        <Chevron />
      </Link>
    </>
  ),

  Direction: () => (
    <>
      <Button variant="tertiary" aria-label="Previous month">
        <Chevron direction="back" />
      </Button>
      <Button variant="tertiary" aria-label="Next month">
        <Chevron />
      </Button>
    </>
  ),

  "Right to left": () => (
    <>
      <Link href="/settings">
        الإعدادات
        <Chevron />
      </Link>
      <Button variant="tertiary" aria-label="الشهر السابق">
        <Chevron direction="back" />
      </Button>
      <Button variant="tertiary" aria-label="الشهر التالي">
        <Chevron />
      </Button>
    </>
  ),
};
