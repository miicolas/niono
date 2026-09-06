import { useInfiniteQuery } from "@tanstack/react-query";
import { useDroppable } from "@dnd-kit/react";
import type { PropertyValue, ViewConfig } from "@digipm/contracts";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BoardCard } from "./board-card";
import type { Property, Row } from "./types";
export function BoardColumn({
  id,
  name,
  pageId,
  property,
  config,
  query,
  onChange,
  editable,
  onNavigate,
}: {
  id: string;
  name: string;
  pageId: string;
  property: Property;
  config: ViewConfig;
  query: string;
  onChange: (
    row: Row,
    property: Property,
    value: PropertyValue,
  ) => Promise<void>;
  editable: boolean;
  onNavigate: (id: string) => void;
}) {
  const results = useInfiniteQuery({
    queryKey: ["entries", pageId, "group", id, property.id, config, query],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      client.databases.query({
        pageId,
        config,
        query,
        offset: pageParam,
        limit: 50,
        scope: { propertyId: property.id, value: id || null },
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
  });
  const rows = results.data?.pages.flatMap((p) => p.rows) ?? [];
  const { ref, isDropTarget } = useDroppable({
    id: `group:${id}`,
    disabled: !editable,
  });
  return (
    <div
      ref={ref}
      className={`board-column ${isDropTarget ? "drop-target" : ""}`}
    >
      <header>
        <span>{name}</span>
        <small>{rows.length}</small>
      </header>
      {rows.map((row) => (
        <BoardCard
          key={row.id}
          row={row}
          editable={editable}
          onNavigate={onNavigate}
          property={property}
          onChange={(value) => void onChange(row, property, value)}
        />
      ))}
      {results.error && <p role="alert">{results.error.message}</p>}
      {results.hasNextPage && (
        <Button
          variant="ghost"
          disabled={results.isFetchingNextPage}
          onClick={() => void results.fetchNextPage()}
        >
          Charger plus
        </Button>
      )}
    </div>
  );
}
