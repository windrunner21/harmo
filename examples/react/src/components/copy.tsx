import { Button, CopyButton, CopyField, ShareButton, Tooltip } from "@harmo-ui/react";
import { FacebookIcon, LinkedInIcon, XIcon } from "../app-icons.tsx";

export const examples = {
  "Copy a link": () => (
    <CopyButton
      value="https://example.com/blog/first-response-time"
      label="Copy link"
      copiedLabel="Copied"
    />
  ),

  "With its text": () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <code>npm install @harmo-ui/css</code>
      <CopyButton value="npm install @harmo-ui/css" label="Copy" copiedLabel="Copied" showLabel />
    </div>
  ),

  "In a field": () => (
    <CopyField
      id="account-id"
      label="Account ID"
      description="Support asks for it when you write to them."
      value="acc_7Hq2vX9pLm4"
      copyLabel="Copy account ID"
      copiedLabel="Copied"
    />
  ),

  Share: () => {
    const url = "https://example.com/blog/first-response-time";
    const text = "First response time, explained";
    const link = encodeURIComponent(url);

    return (
      <div style={{ display: "flex", gap: 4 }}>
        <Tooltip label="Share on X">
          <Button
            variant="tertiary"
            href={`https://x.com/intent/post?url=${link}&text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <XIcon className="hicon" />
          </Button>
        </Tooltip>
        <Tooltip label="Share on LinkedIn">
          <Button
            variant="tertiary"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkedInIcon className="hicon" />
          </Button>
        </Tooltip>
        <Tooltip label="Share on Facebook">
          <Button
            variant="tertiary"
            href={`https://www.facebook.com/sharer/sharer.php?u=${link}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon className="hicon" />
          </Button>
        </Tooltip>
        <ShareButton url={url} title={text} label="Share" copiedLabel="Link copied" />
      </div>
    );
  },

  "Right to left": () => (
    <CopyField
      id="account-id-ar"
      label="معرّف الحساب"
      value="acc_7Hq2vX9pLm4"
      copyLabel="نسخ معرّف الحساب"
      copiedLabel="تم النسخ"
    />
  ),
};
