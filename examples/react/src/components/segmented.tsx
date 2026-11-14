import { Segmented, SegmentedOption } from "@harmo-ui/react";

export const examples = {
  Options: () => (
    <Segmented label="Message header" name="header-type" defaultValue="none">
      <SegmentedOption value="none">No header</SegmentedOption>
      <SegmentedOption value="text">Text</SegmentedOption>
      <SegmentedOption value="media">Media</SegmentedOption>
      <SegmentedOption value="location">Location</SegmentedOption>
    </Segmented>
  ),

  "Disabled option": () => (
    <Segmented label="Assign to" name="assign" defaultValue="team">
      <SegmentedOption value="team">Team</SegmentedOption>
      <SegmentedOption value="agent">Agent</SegmentedOption>
      <SegmentedOption value="ai" disabled>
        AI agent
      </SegmentedOption>
    </Segmented>
  ),

  "Narrow container": () => (
    <Segmented
      label="Message header"
      name="header-type-narrow"
      defaultValue="none"
    >
      <SegmentedOption value="none">No header</SegmentedOption>
      <SegmentedOption value="text">Text</SegmentedOption>
      <SegmentedOption value="media">Media</SegmentedOption>
      <SegmentedOption value="location">Location</SegmentedOption>
    </Segmented>
  ),

  "Long label": () => (
    <Segmented label="Send" name="send" defaultValue="now">
      <SegmentedOption value="now">Now</SegmentedOption>
      <SegmentedOption value="later">Later</SegmentedOption>
      <SegmentedOption value="business-hours">
        At the start of the customer's next business day
      </SegmentedOption>
    </Segmented>
  ),

  "With a description": () => (
    <Segmented
      label="Reply tone"
      description="Used for suggested replies."
      name="reply-tone"
      defaultValue="friendly"
    >
      <SegmentedOption value="friendly">Friendly</SegmentedOption>
      <SegmentedOption value="neutral">Neutral</SegmentedOption>
      <SegmentedOption value="formal">Formal</SegmentedOption>
    </Segmented>
  ),
};
