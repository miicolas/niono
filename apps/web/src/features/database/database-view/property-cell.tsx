import { listWorkspacePeople } from "@/lib/organization";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { useState } from "react";
import { type PropertyValue } from "@digipm/contracts";
import { uploadFile } from "@/features/editor/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportError } from "@/lib/notifications";
import { type Property } from "./shared";
import { displayValue } from "./display-value";

export function PropertyCell({
  pageId,
  property,
  value,
  editable,
  members,
  onChange,
}: {
  pageId: string;
  property: Property;
  value: PropertyValue;
  editable: boolean;
  members: Awaited<ReturnType<typeof listWorkspacePeople>>;
  onChange: (value: PropertyValue) => void;
}) {
  const [draft, setDraft] = useState(
    typeof value === "string" || typeof value === "number" ? String(value) : "",
  );
  if (property.type === "files")
    return (
      <div className="cell-files">
        {(Array.isArray(value) ? value : []).map((id, i) => (
          <span key={id}>
            <a href={`/api/assets/${id}`} target="_blank" rel="noreferrer">
              Fichier {i + 1}
            </a>
            {editable && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                aria-label={`Retirer le fichier ${i + 1}`}
                onClick={() =>
                  onChange(
                    (Array.isArray(value) ? value : []).filter((v) => v !== id),
                  )
                }
              >
                ×
              </Button>
            )}
          </span>
        ))}
        {editable && (
          <Label className="file-cell-upload">
            Ajouter
            <Input
              type="file"
              aria-label={`Ajouter un fichier à ${property.name}`}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                try {
                  const asset = await uploadFile(pageId, file);
                  onChange([...(Array.isArray(value) ? value : []), asset.id]);
                } catch (error) {
                  reportError(error);
                }
              }}
            />
          </Label>
        )}
      </div>
    );
  if (!editable)
    return (
      <span className="cell-value">
        {displayValue(property, value, members)}
      </span>
    );
  if (property.type === "checkbox")
    return (
      <Checkbox
        aria-label={property.name}
        checked={value === true}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
    );
  if (property.type === "select" || property.type === "status")
    return (
      <SelectField
        aria-label={property.name}
        value={typeof value === "string" ? value : ""}
        onValueChange={(value) => onChange(value || null)}
        emptyLabel="—"
      >
        {property.options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectField>
    );
  if (property.type === "multiSelect" || property.type === "person") {
    const options =
      property.type === "person"
        ? members.map((m) => ({ id: m.id, name: m.name }))
        : property.options;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="cell-multi-trigger"
            aria-label={property.name}
          >
            {displayValue(property, value, members) || "—"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="cell-multi w-64 max-h-72 overflow-y-auto"
        >
          {options.map((o) => (
            <Label className="flex items-center gap-2" key={o.id}>
              <Checkbox
                checked={Array.isArray(value) && value.includes(o.id)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked === true
                      ? [...(Array.isArray(value) ? value : []), o.id]
                      : (Array.isArray(value) ? value : []).filter(
                          (id) => id !== o.id,
                        ),
                  )
                }
              />
              {o.name}
            </Label>
          ))}
          {!options.length && (
            <p className="muted text-sm">Aucune option disponible</p>
          )}
        </PopoverContent>
      </Popover>
    );
  }
  if (property.type === "date")
    return (
      <DatePicker
        aria-label={property.name}
        value={typeof value === "string" ? value : ""}
        onValueChange={(date) => onChange(date || null)}
      />
    );
  return (
    <Input
      aria-label={property.name}
      type={
        ["number", "email", "url"].includes(property.type)
          ? property.type
          : "text"
      }
      step={property.type === "number" ? "any" : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next =
          draft === ""
            ? null
            : property.type === "number"
              ? Number(draft)
              : draft;
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
