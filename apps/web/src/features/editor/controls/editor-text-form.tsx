import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import type { ComponentProps } from "react";
import type { EditorUI } from "@digipm/editor/document-editor/editor-ui";
export function EditorTextForm({
  kind,
  value,
  onSubmit,
}: ComponentProps<EditorUI["TextForm"]>) {
  return (
    <ActionForm
      schema={z.object({
        text:
          kind === "link"
            ? z
                .string()
                .refine(
                  (value) => !value || /^(https?:\/\/|mailto:)/.test(value),
                  "Utilisez un lien https://, http:// ou mailto:.",
                )
            : z.string().trim().min(1, "Précisez votre instruction.").max(4000),
      })}
      defaultValues={{ text: value }}
      fields={[
        {
          name: "text",
          label: kind === "link" ? "Adresse du lien" : "Instruction pour l’IA",
          placeholder: kind === "link" ? "https://…" : undefined,
        },
      ]}
      submitLabel={kind === "link" ? "Appliquer" : "Envoyer à l’IA"}
      onSubmit={({ text }) => onSubmit(text)}
    />
  );
}
