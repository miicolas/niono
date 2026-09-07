import {
  CalendarDays,
  GalleryHorizontalEnd,
  Kanban,
  List,
  Table2,
} from "lucide-react";
export const layouts = [
  { id: "table", name: "Table", icon: Table2 },
  { id: "board", name: "Tableau", icon: Kanban },
  { id: "list", name: "Liste", icon: List },
  { id: "gallery", name: "Galerie", icon: GalleryHorizontalEnd },
  { id: "calendar", name: "Calendrier", icon: CalendarDays },
] as const;
