import { useState, type ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const CLEAR_VALUE = "__digipm_clear_selection__";

/** Form-compatible shadcn selection, including an optional clear action. */
export function SelectField({
  value,
  defaultValue = "",
  onValueChange,
  name,
  required,
  disabled,
  emptyLabel,
  children,
  ...triggerProps
}: Omit<
  ComponentProps<typeof SelectTrigger>,
  "value" | "defaultValue" | "onChange" | "name"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  emptyLabel?: string;
}) {
  const [localValue, setLocalValue] = useState(defaultValue);
  return (
    <Select
      value={value ?? localValue}
      name={name}
      required={required}
      disabled={disabled}
      onValueChange={(next) => {
        const selection = next === CLEAR_VALUE ? "" : next;
        setLocalValue(selection);
        onValueChange?.(selection);
      }}
    >
      <SelectTrigger {...triggerProps}>
        <SelectValue placeholder={emptyLabel ?? "Choisir…"} />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {emptyLabel && !required && (
          <SelectItem value={CLEAR_VALUE}>{emptyLabel}</SelectItem>
        )}
        {children}
      </SelectContent>
    </Select>
  );
}
