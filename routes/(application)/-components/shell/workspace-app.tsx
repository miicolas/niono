import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PAGES } from "@/constants/pages";
import { useUI } from "@/lib/ui/store";
import { readStoredTheme } from "@/lib/ui/theme";
import { bootstrapQuery } from "@/routes/(application)/-lib/workspace-queries";
import { WorkspaceShell } from "./workspace-shell";
/** Loads the bootstrap, restores the theme and hands the workspace to the shell. */
export function WorkspaceApp({
  search,
}: {
  search: { w?: string; p?: string; view?: string; invite?: string };
}) {
  const navigate = useNavigate();
  const setTheme = useUI((s) => s.setTheme);
  const bootstrap = useQuery(bootstrapQuery());
  useEffect(() => {
    setTheme(readStoredTheme());
  }, [setTheme]);
  useEffect(() => {
    if (
      bootstrap.error &&
      "code" in bootstrap.error &&
      bootstrap.error.code === "UNAUTHORIZED"
    ) {
      navigate({ to: PAGES.SIGN_IN });
    }
  }, [bootstrap.error, navigate]);
  if (bootstrap.isPending) {
    return (
      <div className="empty-state">
        <span className="brand-mark">D</span>
        <p>Ouverture de votre espace…</p>
      </div>
    );
  }
  if (!bootstrap.data) {
    return (
      <div className="empty-state">
        <h1>Votre espace est indisponible</h1>
        <p>{bootstrap.error?.message}</p>
        <Button onClick={() => bootstrap.refetch()}>Réessayer</Button>
      </div>
    );
  }
  return (
    <WorkspaceShell
      bootstrap={bootstrap.data}
      pageId={search.p ?? null}
      workspaceId={search.w ?? bootstrap.data.workspaceId}
    />
  );
}
