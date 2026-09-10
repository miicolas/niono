import { canEditWorkspace } from "@digipm/server/permissions";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api";
import { useUI } from "@/lib/ui-store";
import type { Bootstrap } from "../types";

export function useWorkspacePanels({
  workspaceId,
  bootstrap,
  onNavigate,
  onRefresh,
}: {
  workspaceId: string;
  bootstrap: Bootstrap;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const panel = useUI((s) => s.panel);
  const setPanel = useUI((s) => s.setPanel);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [debounced, setDebounced] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(timer);
  }, [query]);
  const results = useQuery({
    queryKey: ["search", workspaceId, debounced],
    queryFn: () => client.pages.search({ workspaceId, query: debounced }),
    enabled: panel === "search",
  });
  const trash = useQuery({
    queryKey: ["trash", workspaceId],
    queryFn: () => client.pages.list({ workspaceId, trash: true }),
    enabled: panel === "trash",
  });
  const canEdit = canEditWorkspace(
    bootstrap.workspaces.find((w) => w.id === workspaceId)?.role,
  );
  const close = () => setPanel("none");
  const templates = [
    {
      icon: "🗓️",
      title: "Notes de réunion",
      description: "Un ordre du jour, des décisions et une suite claire.",
      sections: [
        "Ordre du jour",
        "Notes & discussions",
        "Décisions",
        "Prochaines étapes",
      ],
    },
    {
      icon: "🚀",
      title: "Brief de projet",
      description: "Une direction commune pour votre prochain projet.",
      sections: ["Contexte", "Objectifs", "Livrables", "Étapes & calendrier"],
    },
    {
      icon: "🌿",
      title: "Journal personnel",
      description: "Prenez le temps de poser vos idées.",
      sections: ["Aujourd’hui", "Ce que j’ai appris", "Une idée pour demain"],
    },
    {
      icon: "📚",
      title: "Wiki d’équipe",
      description: "Tout ce que votre équipe a besoin de retrouver.",
      sections: ["Bienvenue", "Notre façon de travailler", "Ressources utiles"],
    },
  ];
  return {
    panel,
    close,
    searchInput,
    query,
    setQuery,
    debounced,
    results,
    onNavigate,
    setDebounced,
    trash,
    canEdit,
    onRefresh,
    templates,
    busy,
    setBusy,
    workspaceId,
    bootstrap,
  };
}
