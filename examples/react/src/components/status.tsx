import { Status, Tag } from "@harmo/react";

export const examples = {
  Statuses: () => (
    <>
      <Status status="success">Active</Status>
      <Status status="warning">Pending review</Status>
      <Status status="info">Scheduled</Status>
      <Status status="error">Failed</Status>
      <Status>Draft</Status>
    </>
  ),

  Bordered: () => (
    <>
      <Status status="success" variant="bordered">
        Active
      </Status>
      <Status status="warning" variant="bordered">
        Pending review
      </Status>
      <Status status="info" variant="bordered">
        Scheduled
      </Status>
      <Status status="error" variant="bordered">
        Failed
      </Status>
      <Status variant="bordered">Draft</Status>
    </>
  ),

  "Next to a tag": () => (
    <>
      <Tag color="var(--harmo-green)">Billing</Tag>
      <Status status="success" variant="bordered">
        Active
      </Status>
      <Tag>Default</Tag>
      <Status status="success">Active</Status>
    </>
  ),
};
