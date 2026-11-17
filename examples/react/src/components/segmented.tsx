import { Segmented, SegmentedOption } from "@harmo-ui/react";
import { AnalyticsIcon, MessagesIcon, TicketsIcon } from "../app-icons.tsx";

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

  Small: () => (
    <>
      <Segmented aria-label="Chart range" name="chart-range" defaultValue="day" size="small">
        <SegmentedOption value="day">Day</SegmentedOption>
        <SegmentedOption value="week">Week</SegmentedOption>
        <SegmentedOption value="month">Month</SegmentedOption>
      </Segmented>
      <Segmented aria-label="Show" name="inbox-view" defaultValue="messages" size="small">
        <SegmentedOption value="messages" aria-label="Messages">
          <MessagesIcon className="hicon" />
        </SegmentedOption>
        <SegmentedOption value="tickets" aria-label="Tickets">
          <TicketsIcon className="hicon" />
        </SegmentedOption>
        <SegmentedOption value="analytics" aria-label="Analytics">
          <AnalyticsIcon className="hicon" />
        </SegmentedOption>
      </Segmented>
    </>
  ),
};
