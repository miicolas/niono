import { useId, type ComponentProps } from "react";
import { Field, FieldLabel, FieldError, FieldDescription } from "./ui/field";
import { Input } from "./ui/input";

type TextField = {
  name: string;
  state: { value: string; meta: { isTouched: boolean; errors: unknown[] } };
  handleChange: (value: string) => void;
  handleBlur: () => void;
};

/** Shared presentation for TanStack Form string fields validated by Zod. */
export function FormInput({
  field,
  label,
  description,
  ...props
}: Omit<
  ComponentProps<typeof Input>,
  "name" | "value" | "onChange" | "onBlur"
> & { field: TextField; label: string; description?: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const errors = field.state.meta.errors.flatMap((error) =>
    typeof error === "string"
      ? [{ message: error }]
      : error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ? [{ message: error.message }]
        : [],
  );
  const invalid = field.state.meta.isTouched && errors.length > 0;
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        {...props}
        id={id}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={
          [description && `${id}-description`, invalid && `${id}-error`]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {description && (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      )}
      {invalid && <FieldError id={`${id}-error`} errors={errors} />}
    </Field>
  );
}
