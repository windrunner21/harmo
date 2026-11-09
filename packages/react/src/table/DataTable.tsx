"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { Checkbox } from "../Checkbox.tsx";
import { renders } from "../children.ts";
import { useLinkComponent } from "../HarmoProvider.tsx";
import { Option } from "../listbox/Option.tsx";
import { Select } from "../Select.tsx";
import { withClass } from "../withClass.ts";
import type { RowSelection } from "./useRowSelection.ts";

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  primary?: boolean;
  emphasis?: boolean;
  truncate?: boolean;
}

type Naming =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-label"?: undefined; "aria-labelledby": string };

type Selecting<Row> =
  | { selection?: undefined; selectAllLabel?: undefined; selectRowLabel?: undefined }
  | { selection: RowSelection; selectAllLabel: string; selectRowLabel: (row: Row) => string };

type Identity<Row> = Row extends { id: string | number }
  ? { getRowId?: (row: Row) => string }
  : { getRowId: (row: Row) => string };

type DataTableOptions<Row> = Omit<
  ComponentPropsWithRef<"div">,
  "aria-label" | "aria-labelledby" | "children"
> &
  Naming &
  Selecting<Row> & {
    columns: DataTableColumn<Row>[];
    rows: Row[];
    hiddenColumns?: string[];
    rowHref?: (row: Row) => string;
    onRowClick?: (row: Row) => void;
    empty?: ReactNode;
    footer?: ReactNode;
    stickyFooter?: boolean;
  };

export type DataTableProps<Row> = DataTableOptions<Row> & Identity<Row>;

const idOf = (row: object) => String((row as { id?: unknown }).id);

export const DataTable = <Row extends object>(tableProps: DataTableProps<Row>) => {
  const {
    columns,
    rows,
    getRowId = idOf,
    hiddenColumns,
    selection,
    selectAllLabel,
    selectRowLabel,
    rowHref,
    onRowClick,
    empty,
    footer,
    stickyFooter = true,
    className,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    ...props
  } = tableProps as unknown as DataTableOptions<Row> & { getRowId?: (row: Row) => string };
  const Anchor = useLinkComponent();
  const selectAll = useRef<HTMLInputElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const count = selection?.count ?? 0;
  const lastCount = useRef(count);

  useLayoutEffect(() => {
    const area = scroll.current;
    if (!area) return;
    const read = () => setOverflows(area.scrollWidth > area.clientWidth);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(area);
    if (area.firstElementChild) observer.observe(area.firstElementChild);
    return () => observer.disconnect();
  }, [rows.length > 0]);

  useLayoutEffect(() => {
    const was = lastCount.current;
    lastCount.current = count;
    const box = selectAll.current;
    if (!box || was === 0 || count > 0) return;
    if (box.ownerDocument.activeElement === box.ownerDocument.body) box.focus();
  }, [count]);

  const shown = columns.filter((column) => !hiddenColumns?.includes(column.id));
  const primary = shown.find((column) => column.primary) ?? shown[0];
  const ids = rows.map(getRowId);
  const allSelected = selection?.isAllSelected(ids) ?? false;
  const someSelected = !allSelected && ids.some((id) => selection?.isSelected(id));
  const root = {
    ...props,
    className: withClass("htable-container", className),
    "data-footer": stickyFooter ? undefined : "static",
  };

  if (rows.length === 0 && renders(empty)) return <div {...root}>{empty}</div>;

  const content = (column: DataTableColumn<Row>, row: Row) => {
    const value = column.cell(row);
    if (!column.truncate) return value;
    return (
      <span className="htable-truncate" title={typeof value === "string" ? value : undefined}>
        {value}
      </span>
    );
  };

  const named = (row: Row, inner: ReactNode) => {
    if (rowHref) {
      return (
        <Anchor className="htable-row-link" href={rowHref(row)} onClick={() => onRowClick?.(row)}>
          {inner}
        </Anchor>
      );
    }
    if (onRowClick) {
      return (
        <button type="button" className="htable-row-link" onClick={() => onRowClick(row)}>
          {inner}
        </button>
      );
    }
    return inner;
  };

  return (
    <div {...root}>
      <div
        ref={scroll}
        className="htable-scroll"
        {...(overflows && {
          tabIndex: 0,
          role: "region",
          "aria-label": label,
          "aria-labelledby": labelledBy,
        })}
      >
        <table className="htable" aria-label={label} aria-labelledby={labelledBy}>
          <thead>
            <tr>
              {selection && (
                <th scope="col" className="htable-select">
                  <Checkbox
                    ref={selectAll}
                    aria-label={selectAllLabel}
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => selection.toggleAll(ids)}
                  />
                </th>
              )}
              {shown.map((column) => (
                <th key={column.id} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const id = ids[index]!;
              return (
                <tr key={id}>
                  {selection && (
                    <td className="htable-select">
                      <Checkbox
                        aria-label={selectRowLabel(row)}
                        checked={selection.isSelected(id)}
                        onChange={() => selection.toggle(id)}
                      />
                    </td>
                  )}
                  {shown.map((column) =>
                    column === primary ? (
                      <th key={column.id} scope="row">
                        {named(row, content(column, row))}
                      </th>
                    ) : (
                      <td key={column.id} data-emphasis={column.emphasis ? "" : undefined}>
                        {content(column, row)}
                      </td>
                    ),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && footer}
    </div>
  );
};

type RowsPerPage =
  | {
      rowsPerPageLabel?: undefined;
      rowsPerPage?: undefined;
      rowsPerPageOptions?: undefined;
      onRowsPerPageChange?: undefined;
    }
  | {
      rowsPerPageLabel: ReactNode;
      rowsPerPage: string;
      rowsPerPageOptions: string[];
      onRowsPerPageChange: (value: string) => void;
    };

export type DataTableFooterProps = ComponentPropsWithRef<"div"> &
  RowsPerPage & {
    summary: ReactNode;
    status?: ReactNode;
  };

export const DataTableFooter = ({
  summary,
  status,
  rowsPerPageLabel,
  rowsPerPage,
  rowsPerPageOptions,
  onRowsPerPageChange,
  className,
  children,
  ...props
}: DataTableFooterProps) => {
  const labelId = useId();

  return (
    <div {...props} className={withClass("htable-footer", className)}>
      <p className="htable-footer-summary">{summary}</p>
      <div className="htable-footer-controls">
        {rowsPerPageOptions && (
          <div className="htable-footer-rows">
            <span className="htable-footer-label" id={labelId}>
              {rowsPerPageLabel}
            </span>
            <Select aria-labelledby={labelId} value={rowsPerPage} onValueChange={onRowsPerPageChange}>
              {rowsPerPageOptions.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </div>
        )}
        {renders(status) && (
          <p className="htable-footer-status" role="status">
            {status}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};
