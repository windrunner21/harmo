import { Tag, TagList } from "@harmo-ui/react";

const others = (count: number) =>
  count === 1 ? "one other" : `${count} others`;

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

  "Count in words": () => (
    <TagList moreLabel={others} formatCount={others}>
      <Tag>Ana Lopez</Tag>
      <Tag>Sam Rivera</Tag>
      <Tag>lee@partner.org</Tag>
      <Tag>kim@partner.org</Tag>
    </TagList>
  ),

  "Right to left": () => (
    <TagList
      moreLabel={(count) => `${count.toLocaleString("ar")} أخرى`}
      formatCount={(count) => `+${count.toLocaleString("ar")}`}
    >
      <Tag color="var(--harmo-amber)">الفواتير</Tag>
      <Tag>استرداد</Tag>
      <Tag>شريك</Tag>
      <Tag>عاجل</Tag>
    </TagList>
  ),
};
