import { useQuery } from "@tanstack/react-query";
import { recentQuery } from "@/routes/(application)/-lib/workspace-queries";
import { CreateShortcuts } from "./create-shortcuts";
import { RecentPagesGrid } from "./recent-pages-grid";
export function WorkspaceHome({
  workspaceId,
  userName,
  canCreate,
  onOpen,
  onCreate,
}: {
  workspaceId: string;
  userName: string;
  canCreate: boolean;
  onOpen: (id: string) => void;
  onCreate: (kind: "page" | "database") => void;
}) {
  const recent = useQuery(recentQuery(workspaceId));
  return (
    <main className="home">
      <span className="eyebrow">VOTRE ESPACE, À VOTRE RYTHME</span>
      <h1 className="mt-4">
        Bonjour, {userName.split(" ")[0]} <span className="font-normal">☀</span>
      </h1>
      <p className="muted">Un peu de place pour vos prochaines idées.</p>
      <RecentPagesGrid onOpen={onOpen} pages={recent.data ?? []} />
      {canCreate && <CreateShortcuts onCreate={onCreate} />}
    </main>
  );
}
