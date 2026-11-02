import { Segmented, SegmentedOption } from "@harmo/react";

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
};
