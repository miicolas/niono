import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api";
import { RequestError } from "@/components/content-state";
import { DocumentSkeleton } from "@/components/loading-state";
import { type Props } from "./shared";
import { LoadedPage } from "./loaded-page";

export function PageView(props: Props) {
  const query = useQuery({
    queryKey: ["page", props.pageId],
    queryFn: () => client.pages.get({ id: props.pageId }),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const [epoch, setEpoch] = useState(0);
  if (query.isPending && query.fetchStatus !== "paused")
    return <DocumentSkeleton />;
  if (
    !query.data ||
    (query.error &&
      "code" in query.error &&
      ["NOT_FOUND", "FORBIDDEN", "UNAUTHORIZED"].includes(
        String(query.error.code),
      ))
  )
    return (
      <RequestError
        error={query.error}
        title="Impossible d’ouvrir cette page"
        description="Le chargement de la page a été interrompu. Réessayez pour reprendre votre lecture."
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        onHome={props.onHome}
      />
    );
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
