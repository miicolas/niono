import { canEditWorkspace } from "@digipm/server/permissions";
import { Clock3, Plus, FileText, Table2, ArrowRight } from "lucide-react";
import { ContentState, RequestError } from "@/components/content-state";
import { CardsSkeleton } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { type WorkspaceState } from "./shared";

export function WorkspaceHome({
  bootstrap,
  recent,
  go,
  workspace,
  create,
}: Pick<
  WorkspaceState,
  "bootstrap" | "recent" | "go" | "workspace" | "create"
>) {
  if (!bootstrap.data) return null;
  return (
    <main className="home">
      <span className="eyebrow">VOTRE ESPACE, À VOTRE RYTHME</span>
      <h1 className="mt-4">
        Bonjour, {bootstrap.data.user.name.split(" ")[0]}{" "}
        <span className="font-normal">☀</span>
      </h1>
      <p className="muted">Un peu de place pour vos prochaines idées.</p>
      <section className="home-section">
        <div className="section-label">
          <Clock3 size={14} />
          Consultées récemment
        </div>
        {recent.error || (!recent.data && recent.fetchStatus === "paused") ? (
          <RequestError
            compact
            error={recent.error}
            title="Les pages récentes sont indisponibles"
            description="Réessayez ou ouvrez une page depuis la barre latérale."
            onRetry={() => void recent.refetch()}
            retrying={recent.isFetching}
          />
        ) : recent.isPending ? (
          <CardsSkeleton />
        ) : !recent.data?.length ? (
          <ContentState
            compact
            icon={Clock3}
            title="Vos prochaines idées commencent ici"
            description="Les pages que vous ouvrez apparaîtront ici pour les retrouver facilement."
          />
        ) : (
          <div className="recent-grid">
            {(recent.data ?? []).slice(0, 6).map((page) => (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="recent-card"
                key={page.id}
                onClick={() => void go(page.id)}
              >
                <span className="card-icon">{page.icon}</span>
                <strong>{page.title}</strong>
                <small>
                  {new Date(page.visitedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </small>
              </Button>
            ))}
          </div>
        )}
      </section>
      {canEditWorkspace(workspace?.role) && (
        <section className="home-section">
          <div className="section-label">
            <Plus size={14} />
            Créer quelque chose
          </div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="list-row w-full"
            onClick={() => void create()}
          >
            <FileText size={17} />
            <span className="row-title text-left">Une page blanche</span>
            <ArrowRight size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="list-row w-full"
            onClick={() => void create(undefined, "database")}
          >
            <Table2 size={17} />
            <span className="row-title text-left">Une base de données</span>
            <ArrowRight size={15} />
          </Button>
        </section>
      )}
    </main>
  );
}
