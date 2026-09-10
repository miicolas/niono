import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { pmWorkflows } from "@digipm/contracts/pm-os";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
export function WorkflowCatalog({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalized = query
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const matches = pmWorkflows.filter((workflow) =>
    [workflow.id, workflow.title, workflow.description, workflow.group]
      .join(" ")
      .toLocaleLowerCase("fr")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(normalized),
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <BookOpen size={14} /> Workflows <span className="pm-count">41</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="pm-catalog">
        <label className="pm-search">
          <Search size={15} />
          <Input
            aria-label="Rechercher un workflow PM-OS"
            placeholder="PRD, réunion, recherche…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="pm-catalog-results" aria-label="Workflows PM-OS">
          {matches.map((workflow) => (
            <button
              key={workflow.id}
              type="button"
              className="pm-workflow"
              onClick={() => {
                onSelect(workflow.id);
                setOpen(false);
              }}
            >
              <strong>{workflow.title}</strong>
              <span>{workflow.description}</span>
              <small>
                /{workflow.id} · {workflow.group}
              </small>
            </button>
          ))}
          {!matches.length && <p>Aucun workflow trouvé.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
