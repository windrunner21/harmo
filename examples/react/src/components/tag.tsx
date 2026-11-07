import { Tag, TagRemove } from "@harmo-ui/react";
import { useState } from "react";

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

  "With a remove button": () => {
    const [tags, setTags] = useState(["Billing", "Onboarding", "Partner"]);
    return tags.map((tag) => (
      <Tag key={tag}>
        {tag}
        <TagRemove
          aria-label={`Remove ${tag}`}
          onClick={(event) => {
            const own = event.currentTarget.closest(".htag");
            if (document.activeElement === event.currentTarget) {
              const next =
                own?.nextElementSibling?.querySelector<HTMLElement>(".htag-remove") ??
                own?.previousElementSibling?.querySelector<HTMLElement>(".htag-remove");
              next?.focus();
            }
            setTags(tags.filter((other) => other !== tag));
          }}
        />
      </Tag>
    ));
  },

  "Long text": () => (
    <>
      <Tag>campaign-reports@example.com</Tag>
      <Tag color="var(--harmo-cyan)">Enterprise onboarding</Tag>
    </>
  ),
};
