import type { DatabaseState } from "./shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DatabasePagination({
  config,
  rowsQuery,
  rows,
  offset,
  setOffset,
}: Pick<
  DatabaseState,
  "config" | "rowsQuery" | "rows" | "offset" | "setOffset"
>) {
  return (
    config.layout !== "board" &&
    config.layout !== "chart" && (
      <div className="database-footer">
        <span>
          {rowsQuery.isFetching
            ? "Chargement…"
            : `${rows.length} entrée${rows.length > 1 ? "s" : ""} affichée${rows.length > 1 ? "s" : ""}`}
          {(offset > 0 || rowsQuery.data?.hasMore) && " · résultats paginés"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 50))}
          aria-label="Résultats précédents"
        >
          <ChevronLeft size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={!rowsQuery.data?.hasMore}
          onClick={() => setOffset(offset + 50)}
          aria-label="Résultats suivants"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    )
  );
}
