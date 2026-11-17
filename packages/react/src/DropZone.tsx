"use client";

import { useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { useFileDrop } from "./useFileDrop.ts";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export interface DropZoneProps extends ComponentPropsWithRef<"div"> {
  label: ReactNode;
  onFiles: (files: File[]) => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export const DropZone = ({ label, onFiles, icon, disabled = false, className, children, ref, ...props }: DropZoneProps) => {
  const zone = useRef<HTMLDivElement>(null);
  const merged = useMergedRef(zone, ref);
  const dragging = useFileDrop(zone, !disabled, onFiles);

  return (
    <div
      {...props}
      ref={merged}
      className={withClass("hdrop-zone", className)}
      data-dragging={dragging === "over" ? "" : undefined}
    >
      {children}
      <div className="hdrop-zone-overlay" aria-hidden="true">
        {icon}
        <p className="hdrop-zone-label">{label}</p>
      </div>
    </div>
  );
};
