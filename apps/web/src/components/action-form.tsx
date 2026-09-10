import { useFormSubmit } from "@/hooks/use-form-submit";
import { useId } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FormInput } from "./form-input";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Button } from "./ui/button";
import { SelectField } from "./ui/select-field";
import { SelectItem } from "./ui/select";
import { reportError } from "@/lib/notifications";

type ActionField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "url";
  autoComplete?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
  emptyLabel?: string;
  when?: (values: Record<string, string>) => boolean;
};

/** Small action forms share TanStack state, Zod validation and shadcn fields. */
export function ActionForm<T extends Record<string, string>>({
  schema,
  defaultValues,
  fields,
  onSubmit,
  submitLabel,
  submitVariant = "default",
  className = "panel-form",
  resetOnSuccess = false,
}: {
  schema: z.ZodType<T, Record<string, string>>;
  defaultValues: Record<string, string>;
  fields: ActionField[];
  onSubmit: (values: T) => Promise<void> | void;
  submitLabel: string;
  submitVariant?: "default" | "destructive";
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const id = useId();
  const form = useForm({
    defaultValues,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(schema.parse(value));
        if (resetOnSuccess) form.reset();
      } catch (error) {
        reportError(error);
      }
    },
  });
  const submitForm = useFormSubmit(form);
  return (
    <form
      className={className}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm();
      }}
    >
      <form.Subscribe
        selector={(state) => [state.values, state.isSubmitting] as const}
      >
        {([values, busy]) => (
          <>
            {fields
              .filter((field) => !field.when || field.when(values))
              .map((config) => (
                <form.Field key={config.name} name={config.name}>
                  {(field) => {
                    const invalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    const fieldId = `${id}-${config.name}`;
                    return config.options ? (
                      <Field data-invalid={invalid}>
                        <FieldLabel htmlFor={fieldId}>
                          {config.label}
                        </FieldLabel>
                        <SelectField
                          id={fieldId}
                          name={field.name}
                          value={field.state.value}
                          onValueChange={field.handleChange}
                          onBlur={field.handleBlur}
                          disabled={busy}
                          emptyLabel={config.emptyLabel}
                          aria-invalid={invalid}
                          aria-describedby={
                            invalid ? `${fieldId}-error` : undefined
                          }
                        >
                          {config.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectField>
                        {invalid && (
                          <FieldError
                            id={`${fieldId}-error`}
                            errors={field.state.meta.errors}
                          />
                        )}
                      </Field>
                    ) : (
                      <FormInput
                        field={field}
                        label={config.label}
                        placeholder={config.placeholder}
                        type={config.type}
                        autoComplete={config.autoComplete}
                        maxLength={config.maxLength}
                        disabled={busy}
                      />
                    );
                  }}
                </form.Field>
              ))}
            <Button type="submit" variant={submitVariant} disabled={busy}>
              {busy ? "Enregistrement…" : submitLabel}
            </Button>
          </>
        )}
      </form.Subscribe>
    </form>
  );
}
