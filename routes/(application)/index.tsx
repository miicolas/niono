import { createFileRoute } from "@tanstack/react-router";
import { workspaceSearchSchema } from "@/validators/workspaces";
import { WorkspaceApp } from "./-components/shell/workspace-app";

export const Route = createFileRoute("/(application)/")({
  ssr: false,
  validateSearch: workspaceSearchSchema,
  component: () => <WorkspaceApp search={Route.useSearch()} />,
});
