import { DateFilter, FilterChip, Filters, Option } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => (
    <Filters
      aria-label="Filter tasks"
      visibleCount={2}
      moreLabel="More filters"
      resetLabel="Reset filters"
    >
      <FilterChip label="Status">
        <Option value="active">Active</Option>
        <Option value="blocked">Blocked</Option>
        <Option value="done">Done</Option>
      </FilterChip>
      <FilterChip label="Assignee">
        <Option value="ana">Ana</Option>
        <Option value="ben">Ben</Option>
        <Option value="chloe">Chloe</Option>
      </FilterChip>
      <DateFilter
        label="Due date"
        locale="en-US"
        today="2026-11-09"
        labels={{
          conditions: {
            last: "is in the last",
            equal: "is equal to",
            between: "is between",
            after: "is after",
            before: "is before",
          },
          units: { minutes: "minutes", hours: "hours", days: "days", weeks: "weeks", months: "months" },
          condition: "Condition",
          amount: "How many",
          unit: "Unit",
          date: "Date",
          startDate: "Start date",
          endDate: "End date",
          and: "and",
          datePlaceholder: "mm/dd/yyyy",
          calendar: "Choose a date",
          previousMonth: "Previous month",
          nextMonth: "Next month",
          apply: "Apply",
          clear: "Clear",
        }}
      />
      <FilterChip
        label="Priority"
        multiple
        clearLabel="Clear filters"
        formatCount={(count) => `${count} selected`}
      >
        <Option value="high">High</Option>
        <Option value="medium">Medium</Option>
        <Option value="low">Low</Option>
      </FilterChip>
      <FilterChip label="Project">
        <Option value="website">Website</Option>
        <Option value="mobile">Mobile app</Option>
      </FilterChip>
    </Filters>
  ),

  "With filters in force": () => {
    // Your app or its router holds these.
    const [status, setStatus] = useState<string | null>("active");
    const [priority, setPriority] = useState(["high"]);

    return (
      <Filters
        aria-label="Filter tasks"
        visibleCount={1}
        moreLabel="More filters"
        resetLabel="Reset filters"
        onReset={() => {
          setStatus(null);
          setPriority([]);
        }}
      >
        <FilterChip label="Status" value={status} onValueChange={setStatus}>
          <Option value="active">Active</Option>
          <Option value="done">Done</Option>
        </FilterChip>
        <FilterChip
          label="Priority"
          multiple
          value={priority}
          onValueChange={setPriority}
          clearLabel="Clear filters"
          formatCount={(count) => `${count} selected`}
        >
          <Option value="high">High</Option>
          <Option value="low">Low</Option>
        </FilterChip>
      </Filters>
    );
  },

  "Right to left": () => (
    <Filters
      aria-label="تصفية المهام"
      visibleCount={1}
      moreLabel="مرشحات أخرى"
      resetLabel="إعادة التعيين"
    >
      <FilterChip label="الحالة">
        <Option value="active">نشطة</Option>
        <Option value="done">مكتملة</Option>
      </FilterChip>
      <FilterChip label="الأولوية">
        <Option value="high">عالية</Option>
        <Option value="low">منخفضة</Option>
      </FilterChip>
    </Filters>
  ),
};
