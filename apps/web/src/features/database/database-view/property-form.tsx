import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import { type PropertyType } from "@digipm/contracts";

export function PropertyForm({
  onSubmit,
}: {
  onSubmit: (values: {
    name: string;
    type: PropertyType;
    options: { id: string; name: string; color: string }[];
  }) => Promise<void>;
}) {
  return (
    <ActionForm
      schema={z
        .object({
          name: z.string().trim().min(1, "Saisissez un nom.").max(100),
          type: z.enum([
            "text",
            "number",
            "checkbox",
            "select",
            "multiSelect",
            "status",
            "date",
            "person",
            "url",
            "email",
            "files",
          ]),
          options: z.string(),
        })
        .refine(
          (value) =>
            !["select", "multiSelect", "status"].includes(value.type) ||
            value.options.split(",").some((option) => option.trim()),
          { path: ["options"], message: "Ajoutez au moins une option." },
        )}
      defaultValues={{ name: "", type: "text", options: "" }}
      fields={[
        { name: "name", label: "Nom de la propriété", maxLength: 100 },
        {
          name: "type",
          label: "Type de propriété",
          options: [
            { value: "text", label: "Texte" },
            { value: "number", label: "Nombre" },
            { value: "checkbox", label: "Case à cocher" },
            { value: "select", label: "Sélection" },
            { value: "multiSelect", label: "Sélection multiple" },
            { value: "status", label: "Statut" },
            { value: "date", label: "Date" },
            { value: "person", label: "Personnes" },
            { value: "url", label: "URL" },
            { value: "email", label: "Email" },
            { value: "files", label: "Fichiers" },
          ],
        },
        {
          name: "options",
          label: "Options séparées par des virgules",
          placeholder: "À faire, En cours, Terminé",
          when: (values) =>
            ["select", "multiSelect", "status"].includes(values.type ?? ""),
        },
      ]}
      submitLabel="Ajouter la propriété"
      onSubmit={async ({ name, type, options }) => {
        await onSubmit({
          name,
          type,
          options: ["select", "multiSelect", "status"].includes(type)
            ? options
                .split(",")
                .map((name) => name.trim())
                .filter(Boolean)
                .map((name) => ({
                  id: crypto.randomUUID(),
                  name,
                  color: "gray",
                }))
            : [],
        });
      }}
    />
  );
}
