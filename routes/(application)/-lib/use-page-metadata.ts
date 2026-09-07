import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import type { MetadataChanges, PageMetadata } from "./types";

/**
 * Métadonnées locales de la page (titre, icône, couverture) et file de mises
 * à jour sérialisées vers le serveur, avec resynchronisation quand le serveur
 * publie une révision plus récente.
 */
export function usePageMetadata(
  page: PageMetadata,
  onRefresh: () => Promise<void>
) {
  const cache = useQueryClient();
  const [metadata, setMetadata] = useState(page);
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState(page.icon);
  const metadataRef = useRef(metadata);
  useEffect(() => {
    if (page.revision <= metadataRef.current.revision) {
      return;
    }
    const previous = metadataRef.current;
    metadataRef.current = page;
    setMetadata(page);
    setTitle((value) => (value === previous.title ? page.title : value));
    setIcon(page.icon);
  }, [page]);
  const queue = useRef(Promise.resolve(true));
  const update = (changes: MetadataChanges) => {
    queue.current = queue.current.then(async () => {
      try {
        if (
          Object.entries(changes).every(
            ([key, value]) =>
              metadataRef.current[key as keyof PageMetadata] === value
          )
        ) {
          return true;
        }
        const result = await orpcClient.pages.update({
          id: page.id,
          expectedRevision: metadataRef.current.revision,
          ...changes,
        });
        metadataRef.current = result;
        setMetadata(result);
        await onRefresh();
        return true;
      } catch (e) {
        reportError(e);
        await cache.invalidateQueries({ queryKey: ["page", page.id] });
        return false;
      }
    });
    return queue.current;
  };
  /** Remplace les métadonnées par une version fraîchement relue du serveur. */
  const replace = (fresh: PageMetadata) => {
    metadataRef.current = fresh;
    setMetadata(fresh);
  };
  return { metadata, title, setTitle, icon, setIcon, update, replace };
}
