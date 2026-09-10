import { Card } from "@/components/ui/card";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { useDraggable } from "@dnd-kit/react";
import { type PropertyValue } from "@digipm/contracts";
import { Button } from "@/components/ui/button";
import { type Row, type Property } from "./shared";

export function BoardCard({
  row,
  editable,
  onNavigate,
  property,
  onChange,
}: {
  row: Row;
  property: Property;
  onChange: (value: PropertyValue) => void;
  editable: boolean;
  onNavigate: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: row.id,
    data: { row },
    disabled: !editable,
  });
  return (
    <Card
      ref={ref}
      className={`board-card gap-2 py-3 ${isDragging ? "dragging" : ""}`}
    >
      <Button
        variant="ghost"
        size="sm"
        type="button"
        ref={handleRef}
        aria-label={`Déplacer ${row.title}`}
        className="board-grip"
        disabled={!editable}
      >
        ⠿
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => onNavigate(row.id)}
      >
        {row.icon}
        <strong>{row.title}</strong>
      </Button>
      {editable && (
        <SelectField
          aria-label={`Statut de ${row.title}`}
          value={String(row.values[property.id]?.value ?? "")}
          onValueChange={(value) => onChange(value || null)}
          emptyLabel="Sans statut"
        >
          {property.options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectField>
      )}
    </Card>
  );
}
