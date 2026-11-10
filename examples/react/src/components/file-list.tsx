import {
  Button,
  DataTable,
  FileInput,
  FileList,
  Section,
  Tag,
  type FileListItem,
} from "@harmo-ui/react";
import { useEffect, useState } from "react";

export const examples = {
  Default: () => {
    const [files, setFiles] = useState<FileListItem[]>([
      { id: "brief", name: "project-brief.pdf", detail: "412 kB" },
      { id: "timeline", name: "timeline.xlsx", detail: "86 kB" },
      { id: "notes", name: "kickoff-notes.docx", detail: "38 kB" },
    ]);

    return (
      <FileList
        aria-label="Attachments"
        files={files}
        removeLabel={(file) => `Remove ${file.name}`}
        onRemove={(file) => setFiles((all) => all.filter((other) => other.id !== file.id))}
      />
    );
  },

  "Upload progress": () => {
    const [files, setFiles] = useState<FileListItem[]>([
      { id: "done", name: "project-brief.pdf", detail: "412 kB", progress: 100 },
      { id: "sending", name: "timeline.xlsx", detail: "86 kB", progress: 40 },
      { id: "failed", name: "kickoff-notes.docx", error: "That didn't upload. Check your connection." },
    ]);

    return (
      <FileList
        aria-label="Uploads"
        files={files}
        removeLabel={(file) => `Remove ${file.name}`}
        onRemove={(file) => setFiles((all) => all.filter((other) => other.id !== file.id))}
        retryLabel="Try again"
        onRetry={(file) =>
          setFiles((all) =>
            all.map((other) =>
              other.id === file.id ? { ...other, error: undefined, detail: "38 kB", progress: 100 } : other,
            ),
          )
        }
      />
    );
  },

  "Long file names": () => (
    <FileList
      aria-label="Attachments"
      files={[
        {
          id: "long",
          name: "quarterly-planning-notes-for-the-whole-team-with-every-appendix-and-every-draft.pdf",
          detail: "1.2 MB",
        },
      ]}
    />
  ),

  "A grid of thumbnails": () => {
    const [files, setFiles] = useState<FileListItem[]>([
      { id: "dusk", name: "dusk.svg", detail: "1 kB", preview: "images/dusk.svg" },
      { id: "forest", name: "forest.svg", detail: "1 kB", preview: "images/forest.svg" },
      { id: "dune", name: "dune.svg", detail: "1 kB", preview: "images/dune.svg" },
    ]);

    return (
      <FileList
        aria-label="Images"
        layout="grid"
        files={files}
        removeLabel={(file) => `Remove ${file.name}`}
        onRemove={(file) => setFiles((all) => all.filter((other) => other.id !== file.id))}
      />
    );
  },

  "Compact drop area": () => {
    const [files, setFiles] = useState<FileListItem[]>([]);
    const size = new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte", maximumFractionDigits: 0 });

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <FileInput
          aria-label="Attachments"
          name="attachments"
          multiple
          variant="strip"
          dropLabel="or drop up to 3 files here"
          chooseLabel="Add files"
          validate={(_, accepted) => (files.length + accepted >= 3 ? "Add up to 3 files." : null)}
          onFilesAdd={(added) =>
            setFiles((all) => [
              ...all,
              ...added.map((file, index) => ({
                id: `${file.name}-${Date.now()}-${index}`,
                name: file.name,
                detail: size.format(file.size / 1000),
              })),
            ])
          }
        />
        <FileList
          aria-label="Attachments"
          files={files}
          removeLabel={(file) => `Remove ${file.name}`}
          onRemove={(file) => setFiles((all) => all.filter((other) => other.id !== file.id))}
        />
      </div>
    );
  },

  "Uploading as files arrive": () => {
    const [files, setFiles] = useState<FileListItem[]>([
      { id: "brief", name: "project-brief.pdf", detail: "412 kB", progress: 100 },
      { id: "timeline", name: "timeline.xlsx", detail: "86 kB", progress: 100 },
    ]);
    const size = new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte", maximumFractionDigits: 0 });

    useEffect(() => {
      const timer = setInterval(() => {
        setFiles((all) =>
          all.some((file) => (file.progress ?? 100) < 100)
            ? all.map((file) => ({ ...file, progress: Math.min(100, (file.progress ?? 100) + 20) }))
            : all,
        );
      }, 300);
      return () => clearInterval(timer);
    }, []);

    return (
      <div style={{ display: "grid", gap: 26, inlineSize: "100%" }}>
        <FileInput
          aria-label="Files to upload"
          name="uploads"
          multiple
          variant="area"
          heading="Upload your files"
          dropLabel="Drag them here, or choose them below."
          hint="Any type, up to 10 MB each."
          chooseLabel="Choose files"
          validate={(file) => (file.size > 10_000_000 ? `${file.name} is over 10 MB.` : null)}
          onFilesAdd={(added) => {
            setFiles((all) => [
              ...all,
              ...added.map((file, index) => ({
                id: `${file.name}-${Date.now()}-${index}`,
                name: file.name,
                detail: size.format(file.size / 1000),
                progress: 0,
              })),
            ]);
          }}
        />
        <Section
          label="Uploads"
          labelAs="h3"
          actions={
            <Button variant="secondary" size="small" onClick={() => setFiles([])}>
              Clear all
            </Button>
          }
        >
          <FileList
            aria-label="Uploads"
            files={files}
            removeLabel={(file) => `Remove ${file.name}`}
            onRemove={(file) => setFiles((all) => all.filter((other) => other.id !== file.id))}
          />
        </Section>
      </div>
    );
  },

  Gallery: () => {
    const [files, setFiles] = useState<FileListItem[]>([
      { id: "dusk", name: "dusk.svg", detail: "1 kB", preview: "images/dusk.svg" },
      { id: "forest", name: "forest.svg", detail: "1 kB", preview: "images/forest.svg" },
      { id: "dune", name: "dune.svg", detail: "1 kB", preview: "images/dune.svg" },
    ]);
    const size = new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte", maximumFractionDigits: 0 });
    const release = (url?: string) => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };

    return (
      <div style={{ display: "grid", gap: 26, inlineSize: "100%" }}>
        <FileInput
          aria-label="Images to add"
          name="gallery"
          multiple
          variant="area"
          accept="image/*"
          heading="Add images to the gallery"
          dropLabel="Drag them here, or choose them below."
          hint="PNG or JPG."
          chooseLabel="Choose images"
          validate={(file) => (file.type.startsWith("image/") ? null : `${file.name} isn't an image.`)}
          onFilesAdd={(added) =>
            setFiles((all) => [
              ...all,
              ...added.map((file, index) => ({
                id: `${file.name}-${Date.now()}-${index}`,
                name: file.name,
                detail: size.format(file.size / 1000),
                preview: URL.createObjectURL(file),
              })),
            ])
          }
        />
        <Section
          label={`Gallery (${files.length})`}
          labelAs="h3"
          actions={
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                files.forEach((file) => release(file.preview));
                setFiles([]);
              }}
            >
              Clear all
            </Button>
          }
        >
          <FileList
            aria-label="Gallery"
            layout="grid"
            files={files}
            removeLabel={(file) => `Remove ${file.name}`}
            onRemove={(file) => {
              release(file.preview);
              setFiles((all) => all.filter((other) => other.id !== file.id));
            }}
          />
        </Section>
      </div>
    );
  },

  Table: () => {
    const [rows, setRows] = useState([
      { id: "brief", name: "project-brief.pdf", type: "PDF", size: "412 kB", url: "#project-brief" },
      { id: "timeline", name: "timeline.xlsx", type: "Sheet", size: "86 kB", url: "#timeline" },
    ]);
    const size = new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte", maximumFractionDigits: 0 });
    const release = (url: string) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    };

    return (
      <div style={{ display: "grid", gap: 26, inlineSize: "100%" }}>
        <FileInput
          aria-label="Files to add"
          name="table-files"
          multiple
          variant="area"
          heading="Add files"
          dropLabel="Drag them here, or choose them below."
          chooseLabel="Choose files"
          onFilesAdd={(added) =>
            setRows((all) => [
              ...all,
              ...added.map((file, index) => ({
                id: `${file.name}-${Date.now()}-${index}`,
                name: file.name,
                type: file.name.split(".").pop()?.toUpperCase() ?? "File",
                size: size.format(file.size / 1000),
                url: URL.createObjectURL(file),
              })),
            ])
          }
        />
        <Section
          label={`Files (${rows.length})`}
          labelAs="h3"
          actions={
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                rows.forEach((row) => release(row.url));
                setRows([]);
              }}
            >
              Remove all
            </Button>
          }
        >
          <DataTable
            aria-label="Files"
            rows={rows}
            columns={[
              { id: "name", header: "Name", emphasis: true, truncate: true, cell: (row) => row.name },
              { id: "type", header: "Type", cell: (row) => <Tag>{row.type}</Tag> },
              { id: "size", header: "Size", cell: (row) => row.size },
              {
                id: "actions",
                header: "Actions",
                cell: (row) => (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button href={row.url} download={row.name} variant="tertiary" aria-label={`Download ${row.name}`}>
                      <svg className="hicon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M12 3.75V15.25M12 15.25L7.75 11M12 15.25L16.25 11" />
                        <path d="M4.25 16.75V18.75C4.25 19.58 4.92 20.25 5.75 20.25H18.25C19.08 20.25 19.75 19.58 19.75 18.75V16.75" />
                      </svg>
                    </Button>
                    <Button
                      variant="tertiary"
                      aria-label={`Remove ${row.name}`}
                      onClick={() => {
                        release(row.url);
                        setRows((all) => all.filter((other) => other.id !== row.id));
                      }}
                    >
                      <svg className="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
                        <path d="M18.1183 18.5318L6.80463 7.21814" />
                        <path d="M18.1183 7.21814L6.80463 18.5318" />
                      </svg>
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Section>
      </div>
    );
  },
};
