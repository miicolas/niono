import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { WorkspaceApp } from "@/features/workspace/workspace-app";
import { WorkspaceSkeleton } from "@/components/loading-state";
const searchSchema = z.object({
  w: z.uuid().optional().catch(undefined),
  p: z.uuid().optional().catch(undefined),
  view: z.uuid().optional().catch(undefined),
  invite: z.string().optional(),
});
export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: searchSchema,
  pendingComponent: WorkspaceSkeleton,
  component: () => <WorkspaceApp search={Route.useSearch()} />,
});
