import { Breadcrumb, Link } from "@harmo-ui/react";

export const examples = {
  Trail: () => (
    <Breadcrumb aria-label="Breadcrumb">
      <Link href="/settings">Settings</Link>
      <Link href="/settings/users">Users</Link>
      Jane Smith
    </Breadcrumb>
  ),

  "Right to left": () => (
    <Breadcrumb aria-label="Breadcrumb">
      <Link href="/settings">الإعدادات</Link>
      <Link href="/settings/users">المستخدمون</Link>
      جين سميث
    </Breadcrumb>
  ),

  "Long trail": () => (
    <Breadcrumb aria-label="Breadcrumb">
      <Link href="/settings">Settings</Link>
      <Link href="/settings/channels">Channels</Link>
      <Link href="/settings/channels/whatsapp">WhatsApp</Link>
      Order shipped notification template
    </Breadcrumb>
  ),
};
