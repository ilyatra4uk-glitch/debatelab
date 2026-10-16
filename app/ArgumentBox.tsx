"use client";

import { useState } from "react";

export function ArgumentBox({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [internalText, setInternalText] = useState("");
  const text = value ?? internalText;

  function updateText(nextText: string) {
    if (onChange) onChange(nextText);
    else setInternalText(nextText);
  }

  return (
    <div className="voice-box">
      <label className="debate-field">
        <span>{label}</span>
        <textarea
          onChange={(event) => updateText(event.target.value)}
          placeholder={placeholder}
          value={text}
        />
      </label>
      <button
        className="secondary-action"
        onClick={() => updateText("")}
        type="button"
      >
        Clear
      </button>
    </div>
  );
}
