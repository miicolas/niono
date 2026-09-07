import { useQuery } from "@tanstack/react-query";
import { type MutableRefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import { orpcClient } from "@/orpc/client";
import type { Bootstrap, PageItem } from "@/routes/(application)/-lib/types";
import { LoadedPage } from "./loaded-page";

export type PageViewProps = {
  pageId: string;
  workspaceId: string;
  user: Bootstrap["user"];
  pages: PageItem[];
  onRefresh: () => Promise<void>;
  onNavigate: (id: string) => void;
  beforeLeave: MutableRefObject<
    null | ((requireSaved?: boolean) => Promise<boolean>)
  >;
  onAction: (action: string) => void;
};

export function PageView(props: PageViewProps) {
  const query = useQuery({
    queryKey: ["page", props.pageId],
    queryFn: () => orpcClient.pages.get({ id: props.pageId }),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const [epoch, setEpoch] = useState(0);
  if (query.isPending) {
    return <div className="empty-state">Ouverture de la page…</div>;
  }
  if (!query.data) {
    return (
      <div className="empty-state">
        <h2>Cette page est indisponible</h2>
        <p>
          Elle a peut-être été déplacée dans la corbeille, ou vos accès ont
          changé.
        </p>
        <Button onClick={() => query.refetch()}>Réessayer</Button>
      </div>
    );
  }
  return (
    <LoadedPage
      key={`${props.pageId}:${epoch}`}
      {...props}
      data={query.data}
      onReload={async () => {
        await query.refetch();
        setEpoch((i) => i + 1);
      }}
    />
  );
}
