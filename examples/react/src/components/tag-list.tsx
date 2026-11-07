import { Tag, TagList } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <TagList moreLabel={(count) => `${count} more`}>
      <Tag color="var(--harmo-amber)">Billing</Tag>
      <Tag color="var(--harmo-cyan)">Onboarding</Tag>
      <Tag>Refund</Tag>
      <Tag>Partner</Tag>
      <Tag>Urgent</Tag>
    </TagList>
  ),

  Narrow: () => (
    <TagList moreLabel={(count) => `${count} more`}>
      <Tag>campaign-reports@example.com</Tag>
      <Tag>sam@example.com</Tag>
    </TagList>
  ),
};
