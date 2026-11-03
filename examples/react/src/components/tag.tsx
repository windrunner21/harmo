import { Tag } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <>
      <Tag>Default</Tag>
      <Tag>Test run</Tag>
      <Tag>jane@example.com</Tag>
    </>
  ),

  "With a color": () => (
    <>
      <Tag color="var(--harmo-amber)">Billing</Tag>
      <Tag color="var(--harmo-cyan)">Onboarding</Tag>
      <Tag color="#d0488f">Partner</Tag>
    </>
  ),

  Accent: () => <Tag variant="accent">Unread</Tag>,

  "Long text": () => (
    <>
      <Tag>campaign-reports@example.com</Tag>
      <Tag color="var(--harmo-cyan)">Enterprise onboarding</Tag>
    </>
  ),
};
