import { Button, DropZone, FileList, type FileListItem } from "@harmo-ui/react";
import { useRef, useState } from "react";
import { UploadIcon } from "../app-icons.tsx";

const kilobytes = new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte", maximumFractionDigits: 0 });

export const examples = {
  Default: () => {
    const [files, setFiles] = useState<FileListItem[]>([{ id: "brief", name: "project-brief.pdf", detail: "412 kB" }]);
    const picker = useRef<HTMLInputElement>(null);
    const add = (added: File[]) =>
      setFiles((held) => [
        ...held,
        ...added.map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          detail: kilobytes.format(file.size / 1000),
        })),
      ]);

    return (
      <DropZone
        label="Drop files to share them"
        icon={<UploadIcon className="hicon" />}
        onFiles={add}
        style={{
          display: "grid",
          gap: "var(--harmo-space-xs)",
          inlineSize: "100%",
          padding: "var(--harmo-space-sm)",
          borderRadius: "var(--harmo-border-radius)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--harmo-space-xs)" }}>
          <p style={{ flex: 1, margin: 0, fontSize: "var(--harmo-font-size-sm)", color: "var(--harmo-color-text-secondary)" }}>
            Drop files anywhere here to share them with your team.
          </p>
          <Button variant="secondary" size="small" onClick={() => picker.current?.click()}>
            Add files
          </Button>
        </div>
        <input
          ref={picker}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            add([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        <FileList
          aria-label="Shared files"
          files={files}
          removeLabel={(file) => `Remove ${file.name}`}
          onRemove={(file) => setFiles((held) => held.filter((other) => other.id !== file.id))}
        />
      </DropZone>
    );
  },
};
