import { Option, Select } from "@harmo-ui/react";
import { useEffect, useState } from "react";
import { accents, applyAccent } from "../../accents.ts";

export const AccentPicker = () => {
  const [accent, setAccent] = useState("purple");

  useEffect(() => {
    setAccent(document.documentElement.dataset.harmoAccent ?? "purple");
  }, []);

  return (
    <div className="play-accent">
      <Select
        label="Accent"
        value={accent}
        onValueChange={(value) => {
          const next = String(value);
          setAccent(next);
          applyAccent(next);
        }}
      >
        {accents.map(({ value, label }) => (
          <Option key={value} value={value}>
            <span className="play-accent-dot" data-harmo-accent={value} aria-hidden="true" />
            {label}
          </Option>
        ))}
      </Select>
    </div>
  );
};
