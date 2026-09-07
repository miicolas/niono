import { uploadFile } from "@/lib/editor/upload-file";
import { reportError } from "@/lib/ui/notifications";
import type { PropertyValue } from "@/validators/databases";
import type { Property } from "./types";
export function FilesCell({
  pageId,
  property,
  value,
  editable,
  onChange,
}: {
  pageId: string;
  property: Property;
  value: PropertyValue;
  editable: boolean;
  onChange: (value: string[]) => void;
}) {
  const ids = Array.isArray(value) ? value : [];
  return (
    <div className="cell-files">
      {ids.map((id, i) => (
        <span key={id}>
          <a href={`/api/assets/${id}`} rel="noreferrer" target="_blank">
            Fichier {i + 1}
          </a>
          {editable && (
            <button
              aria-label={`Retirer le fichier ${i + 1}`}
              onClick={() => onChange(ids.filter((v) => v !== id))}
              type="button"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {editable && (
        <label className="file-cell-upload">
          Ajouter
          <input
            aria-label={`Ajouter un fichier à ${property.name}`}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) {
                return;
              }
              e.target.value = "";
              try {
                const asset = await uploadFile(pageId, file);
                onChange([...ids, asset.id]);
              } catch (error) {
                reportError(error);
              }
            }}
            type="file"
          />
        </label>
      )}
    </div>
  );
}
