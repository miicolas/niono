import { addMonths, eachDayOfInterval, format, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property, Row } from "./types";

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export function CalendarLayout({
  month,
  onMonthChange,
  range,
  dateProperty,
  rows,
  editable,
  onNavigate,
  onAddProperty,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  range: { start: Date; end: Date };
  dateProperty: Property | undefined;
  rows: Row[];
  editable: boolean;
  onNavigate: (id: string) => void;
  onAddProperty: () => void;
}) {
  const rowsOn = (day: Date) => {
    if (!dateProperty) {
      return [];
    }
    const key = format(day, "yyyy-MM-dd");
    return rows.filter(
      (row) =>
        String(row.values[dateProperty.id]?.value ?? "").slice(0, 10) === key
    );
  };
  return (
    <>
      <div className="calendar-header">
        <button
          aria-label="Mois précédent"
          className="icon-button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          type="button"
        >
          <ChevronLeft size={15} />
        </button>
        <strong>{format(month, "MMMM yyyy", { locale: fr })}</strong>
        <button
          aria-label="Mois suivant"
          className="icon-button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          type="button"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      {dateProperty ? (
        <div className="calendar-grid">
          {dayLabels.map((day) => (
            <div className="calendar-day-label" key={day}>
              {day}
            </div>
          ))}
          {eachDayOfInterval(range).map((day) => (
            <div
              className={`calendar-day ${isSameMonth(day, month) ? "" : "outside"}`}
              key={day.toISOString()}
            >
              <span>{format(day, "d")}</span>
              {rowsOn(day).map((row) => (
                <button
                  key={row.id}
                  onClick={() => onNavigate(row.id)}
                  type="button"
                >
                  {row.icon} {row.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state py-10">
          <p>Ajoutez une propriété « Date » pour utiliser le calendrier.</p>
          {editable && (
            <Button onClick={onAddProperty}>Ajouter une propriété</Button>
          )}
        </div>
      )}
    </>
  );
}
