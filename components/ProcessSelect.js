"use client";

import Select from "react-select";

export default function ProcessSelect({ value, onChange, options }) {
  return (
    <Select
      value={
        value ? { label: value, value: value } : null
      }
      onChange={(selected) => onChange(selected.value)}
      options={options}
      placeholder="Search Process..."
      className="text-sm"
    />
  );
}
