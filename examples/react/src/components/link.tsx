import { Chevron, ChevronToArrow, Link } from "@harmo/react";

export const examples = {
  Standalone: () => (
    <>
      <Link href="/settings">Settings</Link>
      <Link href="/campaigns">All campaigns</Link>
      <Link href="/help">Help center</Link>
    </>
  ),

  "In running text": () => (
    <p>
      Contacts who unsubscribe stop receiving campaigns. Read the{" "}
      <Link underlined href="/help/unsubscribes">
        unsubscribe policy
      </Link>{" "}
      for the details.
    </p>
  ),

  Visited: () => (
    <>
      <Link visited href="/help/getting-started">
        Getting started
      </Link>
      <Link visited href="/release-notes">
        Release notes
      </Link>
    </>
  ),

  "With an icon": () => (
    <>
      <Link href="/settings">
        Settings
        <Chevron />
      </Link>
      <Link href="/reports">
        All reports
        <ChevronToArrow />
      </Link>
    </>
  ),

  "Right to left": () => (
    <>
      <Link href="/settings">الإعدادات</Link>
      <Link href="/reports">
        كل التقارير
        <ChevronToArrow />
      </Link>
    </>
  ),

  "Long text": () => (
    <Link href="/help/automations">
      Set up your first automated campaign
      <ChevronToArrow />
    </Link>
  ),
};
