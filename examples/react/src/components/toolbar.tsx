import { Button, FilterChip, Filters, Toolbar } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <Toolbar
      controls={
        <>
          <Button variant="secondary" size="small">
            Columns
          </Button>
          <Button variant="secondary" size="small">
            Board view
          </Button>
        </>
      }
    >
      <Filters aria-label="Filter tasks" resetLabel="Reset filters">
        <FilterChip label="Status" />
        <FilterChip label="Assignee" />
      </Filters>
    </Toolbar>
  ),

  "Controls only": () => (
    <Toolbar
      controls={
        <Button variant="secondary" size="small">
          Export
        </Button>
      }
    />
  ),

  "Right to left": () => (
    <Toolbar
      controls={
        <Button variant="secondary" size="small">
          تصدير
        </Button>
      }
    >
      <Filters aria-label="تصفية المهام" resetLabel="إعادة التعيين">
        <FilterChip label="الحالة" />
        <FilterChip label="الأولوية" />
      </Filters>
    </Toolbar>
  ),
};
