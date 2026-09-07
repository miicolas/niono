import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import type { Row } from "./types";
export function EntryTitleCell({
  row,
  editable,
  onNavigate,
  onRefresh,
}: {
  row: Row;
  editable: boolean;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  return (
    <div className="entry-title">
      <button
        aria-label={`Ouvrir ${row.title}`}
        onClick={() => onNavigate(row.id)}
        type="button"
      >
        {row.icon}
      </button>
      {editable ? (
        <input
          aria-label={`Nom de ${row.title}`}
          defaultValue={row.title}
          key={row.title}
          onBlur={async (e) => {
            if (e.target.value === row.title) {
              return;
            }
            try {
              await orpcClient.pages.update({
                id: row.id,
                title: e.target.value,
                expectedRevision: row.revision,
              });
              await onRefresh();
            } catch (error) {
              reportError(error);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
      ) : (
        <span>{row.title}</span>
      )}
      <button
        aria-label={`Ouvrir la page ${row.title}`}
        className="open-entry"
        onClick={() => onNavigate(row.id)}
        type="button"
      >
        ↗
      </button>
    </div>
  );
}
