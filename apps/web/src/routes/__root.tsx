import { RootDocument } from "./../components/root/root-document";
import { Button } from "@/components/ui/button";
import {
  AppState,
  ContentState,
  RequestError,
} from "@/components/content-state";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

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
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/brand/favicon-32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "192x192",
          href: "/brand/icon-192.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/brand/apple-touch-icon.png",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    }),
    errorComponent: ({ error }) => (
      <RequestError
        error={error}
        fullPage
        title="Impossible d’afficher cette page"
        description="Un problème a interrompu l’ouverture de la page. Vous pouvez la recharger ou revenir à l’accueil."
        onRetry={() => window.location.reload()}
        onHome={() => window.location.assign("/")}
      />
    ),
    shellComponent: RootDocument,
    component: RootComponent,
    notFoundComponent: () => (
      <AppState>
        <ContentState
          icon={FileQuestion}
          headingLevel={1}
          title="Cette page est introuvable"
          description="Ce lien ne mène à aucune page. Vérifiez l’adresse ou retrouvez vos contenus depuis votre espace."
        >
          <Button asChild>
            <a href="/">
              <ArrowLeft aria-hidden="true" />
              Retour à l’espace
            </a>
          </Button>
        </ContentState>
      </AppState>
    ),
  },
);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Outlet />
        <Toaster theme="dark" position="bottom-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
