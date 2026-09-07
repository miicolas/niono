import type { ColumnDef } from "@tanstack/react-table";
import type { PropertyValue, ViewConfig } from "@/validators/databases";
import { BoardLayout } from "./board-layout";
import { CalendarLayout } from "./calendar-layout";
import { GalleryLayout } from "./gallery-layout";
import { ListLayout } from "./list-layout";
import { TableLayout } from "./table-layout";
import type { Members, Property, Row } from "./types";
export function DatabaseLayout({
  pageId,
  config,
  setConfig,
  rows,
  columns,
  properties,
  visible,
  members,
  query,
  editable,
  month,
  onMonthChange,
  calendarRange,
  dateProperty,
  onCellChange,
  onNavigate,
  onAddProperty,
}: {
  pageId: string;
  config: ViewConfig;
  setConfig: (config: ViewConfig) => void;
  rows: Row[];
  columns: ColumnDef<Row>[];
  properties: Property[];
  visible: Property[];
  members: Members;
  query: string;
  editable: boolean;
  month: Date;
  onMonthChange: (month: Date) => void;
  calendarRange: { start: Date; end: Date };
  dateProperty: Property | undefined;
  onCellChange: (
    row: Row,
    property: Property,
    value: PropertyValue
  ) => Promise<void>;
  onNavigate: (id: string) => void;
  onAddProperty: () => void;
}) {
  if (config.layout === "table") {
    return (
      <TableLayout
        columns={columns}
        config={config}
        editable={editable}
        onAddProperty={onAddProperty}
        rows={rows}
        setConfig={setConfig}
      />
    );
  }
  if (config.layout === "list") {
    return (
      <ListLayout
        members={members}
        onNavigate={onNavigate}
        rows={rows}
        visible={visible}
      />
    );
  }
  if (config.layout === "gallery") {
    return (
      <GalleryLayout
        members={members}
        onNavigate={onNavigate}
        rows={rows}
        visible={visible}
      />
    );
  }
  if (config.layout === "board") {
    return (
      <BoardLayout
        config={config}
        editable={editable}
        onAddProperty={onAddProperty}
        onChange={onCellChange}
        onNavigate={onNavigate}
        pageId={pageId}
        properties={properties}
        query={query}
      />
    );
  }
  return (
    <CalendarLayout
      dateProperty={dateProperty}
      editable={editable}
      month={month}
      onAddProperty={onAddProperty}
      onMonthChange={onMonthChange}
      onNavigate={onNavigate}
      range={calendarRange}
      rows={rows}
    />
  );
}
