import { ContentState, RequestError } from "@/components/content-state";
import { ListSkeleton, LoadingLabel } from "@/components/loading-state";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type WorkspacePanelsState } from "./shared";

export function SearchDialog({
  panel,
  close,
  searchInput,
  query,
  setQuery,
  debounced,
  results,
  onNavigate,
  setDebounced,
}: Pick<
  WorkspacePanelsState,
  | "panel"
  | "close"
  | "searchInput"
  | "query"
  | "setQuery"
  | "debounced"
  | "results"
  | "onNavigate"
  | "setDebounced"
>) {
  return (
    <Dialog
      open={panel === "search"}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Rechercher dans l’espace</DialogTitle>
          <DialogDescription>
            Retrouvez vos pages par leur titre ou leur contenu.
          </DialogDescription>
        </DialogHeader>
        <Input
          className="search-input"
          ref={searchInput}
          autoFocus
          aria-label="Rechercher dans l’espace"
          placeholder="Rechercher dans votre espace…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="p-2 max-h-96 overflow-auto">
          {query !== debounced ? (
            <ListSkeleton label="Recherche dans votre espace…" />
          ) : results.error || results.fetchStatus === "paused" ? (
            <RequestError
              compact
              error={results.error}
              title="La recherche n’a pas abouti"
              description="Réessayez pour retrouver les pages de votre espace."
              onRetry={() => void results.refetch()}
              retrying={results.isFetching}
            />
          ) : results.isPending ? (
            <ListSkeleton label="Recherche dans votre espace…" />
          ) : results.data?.length ? (
            <>
              {results.isFetching && (
                <LoadingLabel>Actualisation des résultats…</LoadingLabel>
              )}
              {results.data.map((page) => (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="search-result hover:bg-accent"
                  key={page.id}
                  onClick={() => {
                    onNavigate(page.id);
                    close();
                  }}
                >
                  {page.icon}{" "}
                  <strong className="font-medium">{page.title}</strong>
                  <small>{page.excerpt}</small>
                </Button>
              ))}
            </>
          ) : (
            <ContentState
              compact
              icon={Search}
              title={
                debounced.trim()
                  ? "Aucune page trouvée"
                  : "Aucune page à afficher"
              }
              description={
                debounced.trim()
                  ? "Essayez un autre mot, ou une recherche plus courte."
                  : "Recherchez un mot du titre ou du contenu de vos pages."
              }
            >
              {debounced.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setDebounced("");
                    searchInput.current?.focus();
                  }}
                >
                  Effacer la recherche
                </Button>
              )}
            </ContentState>
          )}
        </div>
        <div className="p-3 border-t text-xs muted">
          Recherchez par mots, dans les pages auxquelles vous avez accès.
        </div>
      </DialogContent>
    </Dialog>
  );
}
