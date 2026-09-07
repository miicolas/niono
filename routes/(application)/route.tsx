import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PAGES } from "@/constants/pages";
import { getServerSession } from "@/server/functions/get-server-session";

export const Route = createFileRoute("/(application)")({
  beforeLoad: async () => {
    const session = await getServerSession();
    if (!session) {
      throw redirect({ to: PAGES.SIGN_IN });
    }
    return { session };
  },
  component: Outlet,
});
