import { describe, expect, test } from "bun:test";
import { DataTable, DataTableFooter, type DataTableColumn, type RowSelection } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/table.md says about what it renders.
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
  });

  test("rowHref makes a link in the named cell, and onRowClick a button", () => {
    expect(
      renderToStaticMarkup(<DataTable aria-label="T" columns={columns} rows={rows} rowHref={(row) => `/${row.id}`} />),
    ).toContain('<th scope="row"><a class="htable-row-link" href="/a">Alpha</a></th>');
    expect(
      renderToStaticMarkup(<DataTable aria-label="T" columns={columns} rows={rows} onRowClick={() => {}} />),
    ).toContain('<th scope="row"><button type="button" class="htable-row-link">Alpha</button></th>');
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
