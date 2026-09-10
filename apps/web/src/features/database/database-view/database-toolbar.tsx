import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Plus, SlidersHorizontal, Search, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { download } from "@/lib/download";
import Papa from "papaparse";
import { ViewControls } from "../view-controls";
import { type DatabaseState } from "./shared";
import { displayValue } from "./display-value";

export function DatabaseToolbar({
  query,
  setQuery,
  setOffset,
  config,
  pageId,
  selected,
  properties,
  members,
  setConfig,
  editable,
  setPanel,
  filterRequest,
  rows,
  add,
  busy,
}: Pick<
  DatabaseState,
  | "query"
  | "setQuery"
  | "setOffset"
  | "config"
  | "pageId"
  | "selected"
  | "properties"
  | "members"
  | "setConfig"
  | "editable"
  | "setPanel"
  | "filterRequest"
  | "rows"
  | "add"
  | "busy"
>) {
  return (
    <div className="database-toolbar">
      <InputGroup className="database-search">
        <InputGroupAddon>
          <Search size={13} />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Rechercher dans la base"
          placeholder="Rechercher…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOffset(0);
          }}
        />
      </InputGroup>
      <ViewControls
        filtersOnly={config.layout === "chart"}
        key={`${pageId}:${selected?.id}`}
        config={config}
        properties={properties}
        members={members.data ?? []}
        onChange={setConfig}
        onAddProperty={editable ? () => setPanel("property") : undefined}
        filterRequest={
          filterRequest?.viewId === selected?.id ? filterRequest : null
        }
      />
      {config.layout !== "chart" && (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="icon-button"
          aria-label="Options de la vue"
          onClick={() => setPanel("options")}
        >
          <SlidersHorizontal size={14} />
        </Button>
      )}
      {config.layout !== "chart" && (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="icon-button"
          aria-label="Exporter les lignes affichées en CSV"
          onClick={() => {
            const data = rows.map((row) =>
              Object.fromEntries([
                ["Nom", row.title],
                ...properties.map((p) => [
                  p.name,
                  displayValue(
                    p,
                    row.values[p.id]?.value ?? null,
                    members.data ?? [],
                  ),
                ]),
              ]),
            );
            download(
              "vue.csv",
              Papa.unparse(data, { escapeFormulae: true }),
              "text/csv;charset=utf-8",
            );
          }}
        >
          <FileDown size={14} />
        </Button>
      )}
      {editable && (
        <Button size="sm" onClick={() => void add()} disabled={busy}>
          <Plus size={13} />
          Nouveau
        </Button>
      )}
    </div>
  );
}
