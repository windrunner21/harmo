import {
  Button,
  DataTable,
  DataTableFooter,
  EmptyState,
  FilterChip,
  Filters,
  Listbox,
  Option,
  Pagination,
  Popup,
  SelectionBar,
  Toolbar,
  useColumnVisibility,
  useRowSelection,
} from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => (
    <DataTable
      aria-label="Tasks"
      columns={[
        { id: "task", header: "Task", cell: (row) => row.task },
        { id: "status", header: "Status", cell: (row) => row.status },
        { id: "due", header: "Due", cell: (row) => row.due },
      ]}
      rows={[
        { id: "brief", task: "Write the brief", status: "Active", due: "Nov 18" },
        { id: "designs", task: "Review the designs", status: "Blocked", due: "Nov 20" },
        { id: "release", task: "Ship the release", status: "Done", due: "Nov 9" },
      ]}
    />
  ),

  "A column that stands out": () => (
    <DataTable
      aria-label="Tasks"
      columns={[
        { id: "task", header: "Task", cell: (row) => row.task },
        { id: "owner", header: "Owner", emphasis: true, cell: (row) => row.owner },
        { id: "status", header: "Status", cell: (row) => row.status },
      ]}
      rows={[
        { id: "brief", task: "Write the brief", owner: "Ana", status: "Active" },
        { id: "designs", task: "Review the designs", owner: "Ben", status: "Blocked" },
      ]}
    />
  ),

  "Rows that link": () => (
    <DataTable
      aria-label="Tasks"
      rowHref={(row) => `?task=${row.id}`}
      columns={[
        { id: "task", header: "Task", cell: (row) => row.task },
        { id: "status", header: "Status", cell: (row) => row.status },
      ]}
      rows={[
        { id: "brief", task: "Write the brief", status: "Active" },
        { id: "designs", task: "Review the designs", status: "Blocked" },
      ]}
    />
  ),

  "Rows with an action": () => {
    const [opened, setOpened] = useState("Nothing opened yet");

    return (
      <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
        <DataTable
          aria-label="Tasks"
          onRowClick={(row) => setOpened(`Opened ${row.task}`)}
          columns={[
            { id: "task", header: "Task", cell: (row) => row.task },
            { id: "status", header: "Status", cell: (row) => row.status },
          ]}
          rows={[
            { id: "brief", task: "Write the brief", status: "Active" },
            { id: "designs", task: "Review the designs", status: "Blocked" },
          ]}
        />
        <p role="status">{opened}</p>
      </div>
    );
  },

  "Selecting rows": () => {
    const selection = useRowSelection();

    return (
      <div style={{ display: "grid", gap: 16, inlineSize: "100%" }}>
        <Toolbar
          controls={
            selection.count > 0 ? (
              <SelectionBar
                label={`${selection.count} selected`}
                deselectLabel="Deselect"
                onDeselect={selection.clear}
              >
                <Button variant="secondary" size="small">
                  Assign
                </Button>
              </SelectionBar>
            ) : (
              <Button variant="secondary" size="small">
                Export
              </Button>
            )
          }
        >
          <Filters aria-label="Filter tasks" resetLabel="Reset filters">
            <FilterChip label="Status" />
          </Filters>
        </Toolbar>
        <DataTable
          aria-label="Tasks"
          selection={selection}
          selectAllLabel="Select all tasks"
          selectRowLabel={(row) => `Select ${row.task}`}
          rowHref={(row) => `?task=${row.id}`}
          columns={[
            { id: "task", header: "Task", cell: (row) => row.task },
            { id: "status", header: "Status", cell: (row) => row.status },
          ]}
          rows={[
            { id: "brief", task: "Write the brief", status: "Active" },
            { id: "designs", task: "Review the designs", status: "Blocked" },
            { id: "release", task: "Ship the release", status: "Done" },
          ]}
        />
      </div>
    );
  },

  "Choosing columns": () => {
    const visibility = useColumnVisibility({
      columns: ["task", "status", "due"],
      pinned: ["task"],
      storageKey: "harmo-example-columns",
    });

    return (
      <div style={{ display: "grid", gap: 16, inlineSize: "100%" }}>
        <Toolbar
          controls={
            <Popup
              trigger={
                <Button variant="secondary" size="small">
                  Edit columns
                </Button>
              }
            >
              <Listbox
                aria-label="Columns"
                multiple
                value={visibility.visible.filter((id) => visibility.toggleable.includes(id))}
                onValueChange={visibility.setVisible}
              >
                <Option value="status">Status</Option>
                <Option value="due">Due</Option>
              </Listbox>
            </Popup>
          }
        />
        <DataTable
          aria-label="Tasks"
          hiddenColumns={visibility.hidden}
          columns={[
            { id: "task", header: "Task", cell: (row) => row.task },
            { id: "status", header: "Status", cell: (row) => row.status },
            { id: "due", header: "Due", cell: (row) => row.due },
          ]}
          rows={[
            { id: "brief", task: "Write the brief", status: "Active", due: "Nov 18" },
            { id: "designs", task: "Review the designs", status: "Blocked", due: "Nov 20" },
          ]}
        />
      </div>
    );
  },

  "In pages": () => {
    const total = 115;
    const statuses = ["Active", "Blocked", "Done"];
    const [rowsPerPage, setRowsPerPage] = useState("10");
    const [page, setPage] = useState(2);
    const size = Number(rowsPerPage);
    const pageCount = Math.ceil(total / size);
    const from = (page - 1) * size + 1;
    const to = Math.min(page * size, total);

    return (
      <DataTable
        aria-label="Tasks"
        columns={[
          { id: "task", header: "Task", cell: (row) => row.task },
          { id: "status", header: "Status", cell: (row) => row.status },
        ]}
        rows={Array.from({ length: to - from + 1 }, (_, index) => ({
          id: String(from + index),
          task: `Task ${from + index}`,
          status: statuses[(from + index) % 3],
        }))}
        footer={
          <DataTableFooter
            summary={`${from}–${to} of ${total} results`}
            status={`Page ${page} of ${pageCount}`}
            rowsPerPageLabel="Rows per page"
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={["10", "20", "50"]}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(1);
            }}
          >
            <Pagination
              aria-label="Pages"
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
              previousLabel="Previous"
              nextLabel="Next"
            />
          </DataTableFooter>
        }
      />
    );
  },

  "With nothing to show": () => (
    <DataTable
      aria-label="Tasks"
      columns={[{ id: "task", header: "Task", cell: (row: { id: string; task: string }) => row.task }]}
      rows={[]}
      empty={<EmptyState label="No tasks yet" size="small" variant="dashed" />}
    />
  ),

  "Long text": () => (
    <DataTable
      aria-label="Tasks"
      columns={[
        { id: "task", header: "Task", cell: (row) => row.task },
        { id: "notes", header: "Notes", truncate: true, cell: (row) => row.notes },
      ]}
      rows={[
        {
          id: "brief",
          task: "Write the brief",
          notes: "Cover the audience, the goals for the quarter, what's out of scope, and who signs it off before the review.",
        },
      ]}
    />
  ),

  "Right to left": () => (
    <DataTable
      aria-label="المهام"
      columns={[
        { id: "task", header: "المهمة", cell: (row) => row.task },
        { id: "status", header: "الحالة", cell: (row) => row.status },
      ]}
      rows={[
        { id: "brief", task: "كتابة الملخص", status: "نشطة" },
        { id: "release", task: "إطلاق الإصدار", status: "مكتملة" },
      ]}
    />
  ),
};
