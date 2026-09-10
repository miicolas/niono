import { useRef } from "react";
import { z } from "zod";
import { safeUrl } from "@digipm/contracts";
import type { MediaFormProps } from "@digipm/editor/media/media-types";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Upload } from "lucide-react";

export function EditorMediaForm({
  kind,
  values,
  onSubmit,
  onUpload,
  busy,
  error,
  onCancel,
}: MediaFormProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="media-settings">
      {kind !== "bookmark" && (
        <div className="media-upload-controls">
          <Input
            ref={input}
            hidden
            type="file"
            aria-label="Choisir un fichier"
            accept={
              kind === "image"
                ? "image/png,image/jpeg,image/gif,image/webp"
                : undefined
            }
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? <Spinner /> : <Upload size={16} />}
            {busy
              ? "Envoi en cours…"
              : values.url
                ? "Remplacer le fichier"
                : "Importer un fichier"}
          </Button>
          {busy && (
            <Button variant="ghost" onClick={onCancel}>
              Annuler l’envoi
            </Button>
          )}
          <small>20 Mo maximum · ou collez une adresse ci-dessous</small>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
      <fieldset disabled={busy}>
        <ActionForm
          key={JSON.stringify(values)}
          defaultValues={values}
          schema={z.object({
            url: z
              .string()
              .trim()
              .min(1, "Saisissez une adresse.")
              .max(2000)
              .refine(
                (url) =>
                  safeUrl(url) && /^(https?:\/\/|\/api\/assets\/)/.test(url),
                "Utilisez une adresse https:// ou http://.",
              ),
            name: z.string().max(2000),
            caption: z.string().max(2000),
            alt: z.string().max(2000),
            description: z.string().max(2000),
            width: z
              .string()
              .refine(
                (v) =>
                  !v ||
                  (/^\d+$/.test(v) && Number(v) >= 80 && Number(v) <= 2400),
                "Choisissez une largeur entre 80 et 2 400 pixels.",
              ),
            alignment: z.enum(["left", "center", "right"]),
          })}
          fields={[
            {
              name: "url",
              label:
                kind === "image" ? "Adresse de l’image" : "Adresse du lien",
              placeholder: "https://…",
            },
            {
              name: "name",
              label: kind === "bookmark" ? "Titre du signet" : "Nom du fichier",
              maxLength: 2000,
            },
            ...(kind === "bookmark"
              ? [{ name: "description", label: "Description", maxLength: 2000 }]
              : []),
            { name: "caption", label: "Légende", maxLength: 2000 },
            ...(kind === "image"
              ? [
                  { name: "alt", label: "Texte alternatif", maxLength: 2000 },
                  {
                    name: "width",
                    label: "Largeur en pixels",
                    placeholder: "Pleine largeur",
                  },
                  {
                    name: "alignment",
                    label: "Alignement",
                    options: [
                      { value: "left", label: "Gauche" },
                      { value: "center", label: "Centre" },
                      { value: "right", label: "Droite" },
                    ],
                  },
                ]
              : []),
          ]}
          submitLabel={values.url ? "Enregistrer" : "Insérer"}
          onSubmit={onSubmit}
        />
      </fieldset>
    </div>
  );
}
