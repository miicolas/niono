import { lazy } from "react";
import {
  Table2,
  BarChart3,
  Kanban,
  GalleryHorizontalEnd,
  List,
  CalendarDays,
} from "lucide-react";
import { client } from "@/lib/api";
import { useDatabaseView } from "./use-database-view";

export const ChartView = lazy(() =>
  import("../chart-view").then((module) => ({ default: module.ChartView })),
);

export type Database = Awaited<ReturnType<typeof client.databases.get>>;

export type Property = Database["properties"][number];

export type Row = Awaited<
  ReturnType<typeof client.databases.query>
>["rows"][number];

export const noRows: Row[] = [];

export const noProperties: Property[] = [];

export const layouts = [
  { id: "table", name: "Table", icon: Table2 },
  { id: "board", name: "Tableau", icon: Kanban },
  { id: "list", name: "Liste", icon: List },
  { id: "gallery", name: "Galerie", icon: GalleryHorizontalEnd },
  { id: "calendar", name: "Calendrier", icon: CalendarDays },
  { id: "chart", name: "Graphique", icon: BarChart3 },
] as const;

export type DatabaseViewProps = {
  pageId: string;
  workspaceId: string;
  editable: boolean;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
};

export type DatabaseState = ReturnType<typeof useDatabaseView>;
