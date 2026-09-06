import { useState } from "react";
import { isChoiceType, type PropertyType } from "@digipm/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportError } from "@/lib/notifications";
import { propertyTypeLabels } from "./property-types";
const hasOptions = (type: PropertyType) =>
  isChoiceType(type) || type === "multiSelect";
export function PropertyForm({
  onSubmit,
}: {
  onSubmit: (values: {
    name: string;
    type: PropertyType;
    options: { id: string; name: string; color: string }[];
  }) => Promise<void>;
}) {
  const [type, setType] = useState<PropertyType>("text");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await onSubmit({
            name: String(f.get("name")),
            type,
            options: hasOptions(type)
              ? String(f.get("options"))
                  .split(",")
                  .map((n) => n.trim())
                  .filter(Boolean)
                  .map((name) => ({
                    id: crypto.randomUUID(),
                    name,
                    color: "gray",
                  }))
              : [],
          });
        } catch (error) {
          reportError(error);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input
        aria-label="Nom de la propriété"
        name="name"
        placeholder="Nom de la propriété"
        required
        maxLength={100}
      />
      <select
        aria-label="Type de propriété"
        value={type}
        onChange={(e) => setType(e.target.value as PropertyType)}
      >
        {Object.entries(propertyTypeLabels).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      {hasOptions(type) && (
        <label>
          Options séparées par des virgules
          <Input
            name="options"
            placeholder="À faire, En cours, Terminé"
            required
          />
        </label>
      )}
      <Button disabled={busy}>Ajouter la propriété</Button>
    </form>
  );
}
