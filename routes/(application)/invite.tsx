import { createFileRoute } from "@tanstack/react-router";
import { inviteSearchSchema } from "@/validators/workspaces";
import { InviteScreen } from "./-components/invite/invite-screen";

export const Route = createFileRoute("/(application)/invite")({
  ssr: false,
  validateSearch: inviteSearchSchema,
  head: () => ({ meta: [{ title: "Invitation — DigiPM" }] }),
  component: () => <InviteScreen token={Route.useSearch().token} />,
});
