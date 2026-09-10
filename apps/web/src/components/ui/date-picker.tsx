import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export function DatePicker({
  value,
  onValueChange,
  "aria-label": label,
  required = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  "aria-label": string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-slot="date-trigger"
          className="w-full justify-between font-normal"
          aria-label={label}
          aria-required={required}
        >
          {selected
            ? format(selected, "dd MMM yyyy", { locale: fr })
            : "Choisir une date"}
          <CalendarIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={fr}
          labels={{
            labelNav: () => "Navigation du calendrier",
            labelPrevious: () => "Mois précédent",
            labelNext: () => "Mois suivant",
          }}
          selected={selected}
          defaultMonth={selected}
          autoFocus
          onSelect={(date) => {
            if (!date && required) return;
            onValueChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
        />
        {!required && selected && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              onValueChange("");
              setOpen(false);
            }}
          >
            Effacer la date
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
