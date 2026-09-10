import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import type { ChartConfig } from "@digipm/contracts";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataTable } from "@/components/data-table";
import { numberFormat, type ChartDatum } from "./chart-data";

export function ChartDataTable({
  rows,
  chart,
  metric,
  categoryName,
  tooMany,
  select,
}: {
  rows: ChartDatum[];
  chart: ChartConfig;
  metric: string;
  categoryName: string;
  tooMany: boolean;
  select: (row: ChartDatum) => void;
}) {
  const [showData, setShowData] = useState(false);
  const columns: ColumnDef<ChartDatum>[] = [
    {
      id: "category",
      header: categoryName,
      cell: ({ row }) => (
        <Button
          variant="link"
          className="max-w-full justify-start whitespace-normal text-left"
          onClick={() => select(row.original)}
        >
          {row.original.label}
        </Button>
      ),
    },
    {
      id: "value",
      header: metric,
      cell: ({ row }) =>
        row.original.value === null
          ? "—"
          : numberFormat.format(row.original.value),
    },
  ];
  if (chart.aggregation !== "count")
    columns.push({ accessorKey: "count", header: "Pages" });
  return (
    <Collapsible
      open={showData}
      onOpenChange={setShowData}
      className="chart-data"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">
          <ChevronDown size={14} />
          {showData ? "Masquer" : "Afficher"} les données
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="muted text-xs my-2">
          Sélectionnez une catégorie pour ouvrir ses pages.
          {tooMany && " Les 200 premières catégories sont affichées."}
        </p>
        <DataTable data={rows} columns={columns} className="chart-values" />
      </CollapsibleContent>
    </Collapsible>
  );
}
