import { ContentState } from "@/components/content-state";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { type DatabaseState } from "./shared";

export function DatabaseCalendar({
  config,
  setMonth,
  setOffset,
  month,
  dateProperty,
  rows,
  onNavigate,
  editable,
  setPanel,
}: Pick<
  DatabaseState,
  | "config"
  | "setMonth"
  | "setOffset"
  | "month"
  | "dateProperty"
  | "rows"
  | "onNavigate"
  | "editable"
  | "setPanel"
>) {
  return (
    config.layout === "calendar" && (
      <>
        <div className="calendar-header">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="icon-button"
            aria-label="Mois précédent"
            onClick={() => {
              setMonth((m) => addMonths(m, -1));
              setOffset(0);
            }}
          >
            <ChevronLeft size={15} />
          </Button>
          <strong>{format(month, "MMMM yyyy", { locale: fr })}</strong>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="icon-button"
            aria-label="Mois suivant"
            onClick={() => {
              setMonth((m) => addMonths(m, 1));
              setOffset(0);
            }}
          >
            <ChevronRight size={15} />
          </Button>
        </div>
        {dateProperty ? (
          <div className="calendar-grid">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div className="calendar-day-label" key={day}>
                {day}
              </div>
            ))}
            {eachDayOfInterval({
              start: startOfWeek(startOfMonth(month), {
                weekStartsOn: 1,
              }),
              end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
            }).map((day) => (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isSameMonth(day, month) ? "" : "outside"}`}
              >
                <span>{format(day, "d")}</span>
                {rows
                  .filter(
                    (row) =>
                      String(row.values[dateProperty.id]?.value ?? "").slice(
                        0,
                        10,
                      ) === format(day, "yyyy-MM-dd"),
                  )
                  .map((row) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      key={row.id}
                      onClick={() => onNavigate(row.id)}
                    >
                      {row.icon} {row.title}
                    </Button>
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <ContentState
            compact
            icon={CalendarDays}
            title="Donnez une date à vos pages"
            description="Une propriété « Date » permet de placer les pages dans le calendrier."
          >
            {editable && (
              <Button onClick={() => setPanel("property")}>
                Ajouter une propriété
              </Button>
            )}
          </ContentState>
        )}
      </>
    )
  );
}
