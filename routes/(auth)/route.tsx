import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PAGES } from "@/constants/pages";
import { getServerSession } from "@/server/functions/get-server-session";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: async () => {
    if (await getServerSession()) {
      throw redirect({ to: PAGES.HOME });
    }
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: Outlet,
});
