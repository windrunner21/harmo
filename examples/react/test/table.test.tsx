import { describe, expect, test } from "bun:test";
import {
  DataTable,
  DataTableFooter,
  HarmoProvider,
  useColumnVisibility,
  useRowSelection,
  type DataTableColumn,
  type RowSelection,
} from "@harmo-ui/react";
import { useState, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/table.md says about what it renders, and what its hooks
// hold.
interface Row {
  id: string;
  name: string;
  note: string;
}

const rows: Row[] = [{ id: "a", name: "Alpha", note: "First" }];
const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", cell: (row) => row.name },
  { id: "note", header: "Note", cell: (row) => row.note },
];

const selection = (selected: string[]): RowSelection => ({
  selectedIds: new Set(selected),
  count: selected.length,
  toggle: () => {},
  toggleAll: () => {},
  clear: () => {},
  isSelected: (id) => selected.includes(id),
  isAllSelected: (ids) => ids.length > 0 && ids.every((id) => selected.includes(id)),
});

const named = [{ id: "name", header: "Name", cell: (row: { name: string }) => row.name }];

describe("DataTable", () => {
  test("rows without an id need getRowId", () => {
    // @ts-expect-error Two rows would otherwise share the id "undefined".
    renderToStaticMarkup(<DataTable aria-label="T" columns={named} rows={[{ name: "A" }]} />);
    const markup = renderToStaticMarkup(
      <DataTable aria-label="T" columns={named} rows={[{ name: "A" }]} getRowId={(row) => row.name} />,
    );
    expect(markup).toContain(">A<");
  });

  test("the first column names its row, and its header cells have a scope", () => {
    const markup = renderToStaticMarkup(<DataTable aria-label="Things" columns={columns} rows={rows} />);
    expect(markup).toContain('<table class="htable" aria-label="Things">');
    expect(markup).toContain('<th scope="col">Name</th>');
    expect(markup).toContain('<th scope="row">Alpha</th><td>First</td>');
  });

  test("primary moves that, and hiddenColumns leaves a column out", () => {
    const moved = columns.map((column) => ({ ...column, primary: column.id === "note" }));
    expect(renderToStaticMarkup(<DataTable aria-label="T" columns={moved} rows={rows} />)).toContain(
      '<td>Alpha</td><th scope="row">First</th>',
    );
    const markup = renderToStaticMarkup(
      <DataTable aria-label="T" columns={columns} rows={rows} hiddenColumns={["note"]} />,
    );
    expect(markup).not.toContain("First");
    expect(markup).not.toContain("Note");
  });

  test("emphasis marks a column's cells, and not its header", () => {
    const marked = columns.map((column) => ({ ...column, emphasis: column.id === "note" }));
    const markup = renderToStaticMarkup(<DataTable aria-label="T" columns={marked} rows={rows} />);
    expect(markup).toContain('<td data-emphasis="">First</td>');
    expect(markup).toContain('<th scope="col">Note</th>');
    expect(markup).toContain('<th scope="row">Alpha</th>');
  });

  test("the column that names the row can be emphasized too", () => {
    const marked = columns.map((column) => ({ ...column, emphasis: column.id === "name" }));
    expect(renderToStaticMarkup(<DataTable aria-label="T" columns={marked} rows={rows} />)).toContain(
      '<th scope="row" data-emphasis="">Alpha</th><td>First</td>',
    );
  });

  test("rowHref makes a link in the named cell, and onRowClick a button", () => {
    expect(
      renderToStaticMarkup(<DataTable aria-label="T" columns={columns} rows={rows} rowHref={(row) => `/${row.id}`} />),
    ).toContain('<th scope="row"><a class="htable-row-link" href="/a">Alpha</a></th>');
    expect(
      renderToStaticMarkup(<DataTable aria-label="T" columns={columns} rows={rows} onRowClick={() => {}} />),
    ).toContain('<th scope="row"><button type="button" class="htable-row-link">Alpha</button></th>');
  });

  test("with rowHref, onRowClick runs on a plain click, and not on one that opens a new tab", () => {
    const clicked: string[] = [];
    let press: (event: Partial<MouseEvent>) => void = () => {};
    const Link = ({ onClick, ...props }: ComponentProps<"a">) => {
      press = onClick as unknown as typeof press;
      return <a {...props} />;
    };
    renderToStaticMarkup(
      <HarmoProvider linkComponent={Link}>
        <DataTable
          aria-label="T"
          columns={columns}
          rows={rows}
          rowHref={(row) => `/${row.id}`}
          onRowClick={(row) => clicked.push(row.id)}
        />
      </HarmoProvider>,
    );
    const plain = { metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
    for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) press({ ...plain, [key]: true });
    expect(clicked).toEqual([]);
    press(plain);
    expect(clicked).toEqual(["a"]);
  });

  test("selection adds a named checkbox to each row and the header, which says some are ticked", () => {
    const table = (selected: string[]) =>
      renderToStaticMarkup(
        <DataTable
          aria-label="T"
          columns={columns}
          rows={[...rows, { id: "b", name: "Beta", note: "Second" }]}
          selection={selection(selected)}
          selectAllLabel="All"
          selectRowLabel={(row) => `Select ${row.name}`}
        />,
      );
    const markup = table(["a"]);
    expect(markup).toContain('aria-label="All"');
    expect(markup).toContain('aria-label="Select Alpha"');
    expect(markup).toMatch(/aria-label="Select Alpha"[^>]*checked/);
    expect(markup).not.toMatch(/aria-label="Select Beta"[^>]*checked/);
    expect(markup).not.toMatch(/aria-label="All"[^>]*checked/);
    expect(table(["a", "b"])).toMatch(/aria-label="All"[^>]*checked/);
  });

  test("empty stands in for the table, and no rows means no footer", () => {
    const markup = renderToStaticMarkup(
      <DataTable aria-label="T" columns={columns} rows={[]} empty={<b>None</b>} footer={<i>Foot</i>} />,
    );
    expect(markup).toBe('<div class="htable-container"><b>None</b></div>');
    const bare = renderToStaticMarkup(<DataTable aria-label="T" columns={columns} rows={[]} footer={<i>Foot</i>} />);
    expect(bare).toContain("<table");
    expect(bare).not.toContain("Foot");
  });

  test("stickyFooter turns off through an attribute, and truncate keeps text as a title", () => {
    expect(
      renderToStaticMarkup(<DataTable aria-label="T" columns={columns} rows={rows} stickyFooter={false} />),
    ).toContain('data-footer="static"');
    const long = [{ ...columns[1]!, truncate: true }, columns[0]!];
    expect(renderToStaticMarkup(<DataTable aria-label="T" columns={long} rows={rows} />)).toContain(
      '<span class="htable-truncate" title="First">First</span>',
    );
  });
});

describe("DataTableFooter", () => {
  test("the summary, and only what it's given", () => {
    const markup = renderToStaticMarkup(<DataTableFooter summary="1–2 of 2" />);
    expect(markup).toBe(
      '<div class="htable-footer"><p class="htable-footer-summary">1–2 of 2</p><div class="htable-footer-controls"></div></div>',
    );
  });

  test("the page is a status, and rows per page a labelled Select", () => {
    const markup = renderToStaticMarkup(
      <DataTableFooter
        summary="1–10 of 20"
        status="Page 1 of 2"
        rowsPerPageLabel="Rows"
        rowsPerPage="10"
        rowsPerPageOptions={["10", "20"]}
        onRowsPerPageChange={() => {}}
      />,
    );
    expect(markup).toContain('<p class="htable-footer-status" role="status">Page 1 of 2</p>');
    const id = /<span class="htable-footer-label" id="([^"]+)">Rows<\/span>/.exec(markup)![1];
    expect(markup).toContain(`aria-labelledby="${id}"`);
  });
});

// Renders a hook on the server, where a component can update its own state as
// it renders: React renders it again at once. Each step gets what one render
// returned and changes something, and the next render returns the result.
const steps = <Value,>(use: () => Value, ...changes: ((value: Value) => void)[]) => {
  const seen: Value[] = [];
  const Harness = () => {
    const value = use();
    seen.push(value);
    changes[seen.length - 1]?.(value);
    return null;
  };
  renderToStaticMarkup(<Harness />);
  return seen;
};

const ids = (selection: RowSelection) => [...selection.selectedIds];

describe("useRowSelection", () => {
  test("toggle adds a row and takes it away, and clear empties it", () => {
    const seen = steps(
      useRowSelection,
      (selection) => selection.toggle("a"),
      (selection) => selection.toggle("b"),
      (selection) => selection.toggle("a"),
      (selection) => selection.clear(),
    );
    expect(seen.map(ids)).toEqual([[], ["a"], ["a", "b"], ["b"], []]);
    expect(seen[2]!.count).toBe(2);
    expect(seen[2]!.isSelected("b")).toBe(true);
    expect(seen[3]!.isSelected("a")).toBe(false);
  });

  test("toggleAll selects just those rows, in place of rows chosen on another page, or none once all are", () => {
    const seen = steps(
      useRowSelection,
      (selection) => selection.toggle("x"),
      (selection) => selection.toggleAll(["a", "b"]),
      (selection) => selection.toggle("a"),
      (selection) => selection.toggleAll(["a", "b"]),
      (selection) => selection.toggleAll(["a", "b"]),
    );
    expect(seen.map(ids)).toEqual([[], ["x"], ["a", "b"], ["b"], ["a", "b"], []]);
    expect(seen[2]!.isAllSelected(["a", "b"])).toBe(true);
    expect(seen[3]!.isAllSelected(["a", "b"])).toBe(false);
    expect(seen[0]!.isAllSelected([])).toBe(false);
  });
});

describe("useColumnVisibility", () => {
  test("every column shows by default, a pinned one always, and only the others can be chosen", () => {
    const seen = steps(
      () => useColumnVisibility({ columns: ["task", "status", "due"], pinned: ["task"] }),
      (visibility) => visibility.setVisible([]),
    );
    expect(seen[0]!.visible).toEqual(["task", "status", "due"]);
    expect(seen[0]!.toggleable).toEqual(["status", "due"]);
    expect(seen[1]!.visible).toEqual(["task"]);
    expect(seen[1]!.hidden).toEqual(["status", "due"]);
  });

  test("defaultVisible sets what shows until a choice is made, and toggle changes one column", () => {
    const seen = steps(
      () => useColumnVisibility({ columns: ["task", "status", "due"], defaultVisible: ["task", "due"] }),
      (visibility) => visibility.toggle("status"),
      (visibility) => visibility.toggle("task"),
    );
    expect(seen.map((visibility) => visibility.visible)).toEqual([
      ["task", "due"],
      ["task", "status", "due"],
      ["status", "due"],
    ]);
  });

  test("a column that arrives follows the defaults until a choice is made, and stays hidden after one", () => {
    let arrive = () => {};
    const use = () => {
      const [columns, setColumns] = useState(["task", "status"]);
      arrive = () => setColumns([...columns, columns.length === 2 ? "due" : "owner"]);
      return useColumnVisibility({ columns });
    };
    const seen = steps(
      use,
      () => arrive(),
      (visibility) => visibility.setVisible(["task", "status", "due"]),
      () => arrive(),
    );
    expect(seen[1]!.visible).toEqual(["task", "status", "due"]);
    expect(seen[3]!.visible).toEqual(["task", "status", "due"]);
    expect(seen[3]!.hidden).toEqual(["owner"]);
  });

  test("what it returns stays the same from render to render while nothing changes", () => {
    let rerender = () => {};
    const use = () => {
      const [count, setCount] = useState(0);
      rerender = () => setCount(count + 1);
      return useColumnVisibility({ columns: ["task", "status"], pinned: ["task"] });
    };
    const [first, second] = steps(use, () => rerender());
    expect(second).toBe(first!);
  });
});
