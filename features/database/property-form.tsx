import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportError } from "@/lib/ui/notifications";
import { isChoiceType, type PropertyType } from "@/validators/contracts";
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
        maxLength={100}
        name="name"
        placeholder="Nom de la propriété"
        required
      />
      <select
        aria-label="Type de propriété"
        onChange={(e) => setType(e.target.value as PropertyType)}
        value={type}
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
