import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orpcClient } from "@/orpc/client";
export function SearchDialog({
  open,
  workspaceId,
  onNavigate,
  onClose,
}: {
  open: boolean;
  workspaceId: string;
  onNavigate: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(timer);
  }, [query]);
  const results = useQuery({
    queryKey: ["search", workspaceId, debounced],
    queryFn: () => orpcClient.pages.search({ workspaceId, query: debounced }),
    enabled: open,
  });
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Rechercher dans l’espace</DialogTitle>
          <DialogDescription>
            Retrouvez vos pages par leur titre ou leur contenu.
          </DialogDescription>
        </DialogHeader>
        <input
          aria-label="Rechercher dans l’espace"
          autoFocus
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans votre espace…"
          value={query}
        />
        <div className="max-h-96 overflow-auto p-2">
          {results.isFetching && (
            <p className="muted p-3 text-xs">Recherche…</p>
          )}
          {results.error && (
            <p className="p-3" role="alert">
              {results.error.message}
            </p>
          )}
          {results.data?.map((page) => (
            <button
              className="search-result hover:bg-accent"
              key={page.id}
              onClick={() => {
                onNavigate(page.id);
                onClose();
              }}
              type="button"
            >
              {page.icon} <strong className="font-medium">{page.title}</strong>
              <small>{page.excerpt}</small>
            </button>
          ))}
          {!(results.isFetching || results.data?.length) && (
            <div className="empty-state p-8">
              <Search size={24} />
              <p>Aucune page trouvée.</p>
            </div>
          )}
        </div>
        <div className="muted border-t p-3 text-xs">
          Recherchez par mots, dans les pages auxquelles vous avez accès.
        </div>
      </DialogContent>
    </Dialog>
  );
}
