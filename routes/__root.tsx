import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import appCss from "@/styles/globals.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: "DigiPM — votre espace pour penser",
        },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    }),
    errorComponent: () => (
      <div className="empty-state" role="alert">
        <h1>Impossible d’afficher cette page</h1>
        <p>Rechargez l’espace pour retrouver vos contenus.</p>
        <button onClick={() => window.location.reload()}>
          Recharger l’espace
        </button>
      </div>
    ),
    shellComponent: RootDocument,
    component: RootComponent,
    notFoundComponent: () => (
      <div className="empty-state">
        <h1>Page introuvable</h1>
        <a href="/">Retour à l’espace</a>
      </div>
    ),
  }
);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Outlet />
        <Toaster position="bottom-right" richColors theme="dark" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Scripts />
      </body>
    </html>
  );
}
