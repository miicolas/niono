import { ChevronLeft, ChevronRight } from "lucide-react";

const countLabel = (count: number) => {
  const plural = count > 1 ? "s" : "";
  return `${count} entrée${plural} affichée${plural}`;
};
export function DatabaseFooter({
  count,
  fetching,
  offset,
  hasMore,
  onOffsetChange,
}: {
  count: number;
  fetching: boolean;
  offset: number;
  hasMore: boolean | undefined;
  onOffsetChange: (offset: number) => void;
}) {
  return (
    <div className="database-footer">
      <span>
        {fetching ? "Chargement…" : countLabel(count)}
        {(offset > 0 || hasMore) && " · résultats paginés"}
      </span>
      <button
        aria-label="Résultats précédents"
        disabled={!offset}
        onClick={() => onOffsetChange(Math.max(0, offset - 50))}
        type="button"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        aria-label="Résultats suivants"
        disabled={!hasMore}
        onClick={() => onOffsetChange(offset + 50)}
        type="button"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
