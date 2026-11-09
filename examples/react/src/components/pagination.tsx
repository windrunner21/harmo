import { Option, Pagination, Select } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  "Previous and Next": () => {
    // Your router knows the page you're on; here a click only moves it.
    const [page, setPage] = useState(2);

    return (
      <Pagination
        aria-label="Pages"
        page={page}
        pageCount={12}
        href={(page) => `?page=${page}`}
        onPageChange={setPage}
        previousLabel="Previous"
        nextLabel="Next"
      />
    );
  },

  Numbered: () => {
    const [page, setPage] = useState(5);

    return (
      <Pagination
        aria-label="Pages"
        page={page}
        pageCount={12}
        href={(page) => `?page=${page}`}
        onPageChange={setPage}
        numbered
        pageLabel={(page) => `Page ${page}`}
        previousLabel="Previous"
        nextLabel="Next"
      />
    );
  },

  "On the first page": () => {
    const [page, setPage] = useState(1);

    return (
      <Pagination
        aria-label="Pages"
        page={page}
        pageCount={5}
        href={(page) => `?page=${page}`}
        onPageChange={setPage}
        numbered
        pageLabel={(page) => `Page ${page}`}
        previousLabel="Previous"
        nextLabel="Next"
      />
    );
  },

  "Right to left": () => {
    const [page, setPage] = useState(5);

    return (
      <Pagination
        aria-label="الصفحات"
        page={page}
        pageCount={12}
        href={(page) => `?page=${page}`}
        onPageChange={setPage}
        numbered
        pageLabel={(page) => `الصفحة ${page}`}
        previousLabel="السابق"
        nextLabel="التالي"
      />
    );
  },

  "In a table footer": () => {
    const total = 115;
    const [rows, setRows] = useState("10");
    const [page, setPage] = useState(2);
    const pageCount = Math.ceil(total / Number(rows));
    const from = (page - 1) * Number(rows) + 1;
    const to = Math.min(page * Number(rows), total);

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          inlineSize: "100%",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--harmo-font-size-sm)",
            color: "var(--harmo-color-text-secondary)",
          }}
        >
          {`${from}–${to} of ${total} results`}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="hlabel" id="rows-label">
              Rows per page
            </span>
            <Select
              aria-labelledby="rows-label"
              style={{ inlineSize: "auto" }}
              value={rows}
              onValueChange={(value) => {
                setRows(value);
                setPage(1);
              }}
            >
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
            </Select>
          </div>
          <p role="status" style={{ margin: 0, fontSize: "var(--harmo-font-size-sm)" }}>
            {`Page ${page} of ${pageCount}`}
          </p>
          <Pagination
            aria-label="Pages"
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            previousLabel="Previous"
            nextLabel="Next"
          />
        </div>
      </div>
    );
  },
};
