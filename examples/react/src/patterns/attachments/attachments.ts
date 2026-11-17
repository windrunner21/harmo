import type { FileListItem } from "@harmo-ui/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface UploadReport {
  progress: (percent: number) => void;
  signal: AbortSignal;
}

// Sends one file to your storage, and gives back the key it's stored under,
// which the form then sends in the file's place.
export type Upload = (file: File, report: UploadReport) => Promise<string>;

export interface Attachment extends FileListItem {
  file: File;
  key?: string;
}

export const kilobytes = new Intl.NumberFormat("en", {
  style: "unit",
  unit: "kilobyte",
  maximumFractionDigits: 0,
});

export const didntUpload = "That didn't upload. Check your connection.";
export const notUploaded = "Some files didn't upload. Try them again, or remove them.";

// Puts a file at an address your server signed for it, such as a presigned
// S3 or R2 URL, reporting how far it has got, which fetch can't.
export const putFile = (url: string, file: File, { progress, signal }: UploadReport, headers: Record<string, string> = {}) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    if (file.type) request.setRequestHeader("Content-Type", file.type);
    for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) progress((event.loaded / event.total) * 100);
    });
    request.addEventListener("load", () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`The upload failed, with ${request.status}.`)),
    );
    request.addEventListener("error", () => reject(new Error("The upload failed.")));
    request.addEventListener("abort", () => reject(signal.reason));
    signal.addEventListener("abort", () => request.abort(), { once: true });
    request.send(file);
  });

// A picture still loading is released once it has loaded, as one released
// mid-load fails to show.
const releasePicture = (url: string) => {
  const loading = [...document.images].find((image) => image.src === url && !image.complete);
  if (!loading) return URL.revokeObjectURL(url);
  for (const type of ["load", "error"]) {
    loading.addEventListener(type, () => URL.revokeObjectURL(url), { once: true });
  }
};

const subscribe = () => () => {};

// The files a form or a chat's composer holds, for its File List. Given
// `upload`, each one is uploaded as it's added, and what's sent is the keys
// they're stored under; without it, the files themselves. Uploads need the
// page's script, so `shown` is false until it runs.
export const useAttachments = ({ upload, preview = false }: { upload?: Upload; preview?: boolean }) => {
  const [items, setItems] = useState<Attachment[]>([]);
  const latest = useRef<Attachment[]>([]);
  const made = useRef(0);
  const running = useRef(new Map<string, { controller: AbortController; done: Promise<void> }>());
  const scripted = useSyncExternalStore(subscribe, () => true, () => false);

  const change = (update: (all: Attachment[]) => Attachment[]) => {
    latest.current = update(latest.current);
    setItems(latest.current);
  };

  const patch = (id: string, fields: Partial<Attachment>) =>
    change((all) => all.map((item) => (item.id === id ? { ...item, ...fields } : item)));

  const start = (item: Attachment) => {
    if (!upload) return;
    running.current.get(item.id)?.controller.abort();
    const controller = new AbortController();
    let settled = false;
    const live = () => !settled && !controller.signal.aborted;
    patch(item.id, { progress: 0, error: undefined, key: undefined });
    const report = {
      progress: (percent: number) => {
        if (live() && Number.isFinite(percent)) patch(item.id, { progress: Math.min(99, Math.max(0, percent)) });
      },
      signal: controller.signal,
    };
    const done = Promise.resolve()
      .then(() => upload(item.file, report))
      .then(
        (key) => {
          if (live()) patch(item.id, { key, progress: 100 });
          settled = true;
        },
        () => {
          if (live()) patch(item.id, { progress: undefined, error: didntUpload });
          settled = true;
        },
      )
      .finally(() => {
        if (running.current.get(item.id)?.controller === controller) running.current.delete(item.id);
      });
    running.current.set(item.id, { controller, done });
  };

  useEffect(
    () => () => {
      for (const { controller } of running.current.values()) controller.abort();
      running.current.clear();
      for (const item of latest.current) if (item.preview) URL.revokeObjectURL(item.preview);
    },
    [],
  );

  const add = (files: File[]) => {
    const added: Attachment[] = files.map((file) => ({
      id: String((made.current += 1)),
      name: file.name,
      detail: kilobytes.format(file.size / 1000),
      file,
      ...(preview && file.type.startsWith("image/") && { preview: URL.createObjectURL(file) }),
    }));
    change((all) => [...all, ...added]);
    for (const item of added) start(item);
  };

  const remove = (item: FileListItem) => {
    running.current.get(item.id)?.controller.abort();
    running.current.delete(item.id);
    change((all) => all.filter((other) => other.id !== item.id));
    if (item.preview) releasePicture(item.preview);
  };

  const retry = (item: FileListItem) => {
    const held = latest.current.find((other) => other.id === item.id);
    if (held) start(held);
  };

  // Waits for the uploads still running, those started meanwhile too; then
  // says if any didn't upload.
  const settle = async () => {
    while (running.current.size > 0) await Promise.all([...running.current.values()].map(({ done }) => done));
    return latest.current.some((item) => item.error) ? notUploaded : undefined;
  };

  const entries = () => latest.current.map((item) => (upload ? (item.key ?? "") : item.file));

  // Hands over the files, emptying the list, once they're sent; their
  // pictures stay, for what they were sent with, such as a chat's message.
  const take = () => {
    const taken = latest.current;
    change(() => []);
    return taken;
  };

  return { items, add, remove, retry, take, settle: upload ? settle : undefined, entries, shown: !upload || scripted };
};
