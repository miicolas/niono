import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ViewConfig } from "@digipm/contracts";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ChartDatum } from "./chart-data";

export function ChartEntryDialog({
  pageId,
  config,
  query,
  selection,
  onClose,
  onNavigate,
}: {
  pageId: string;
  config: ViewConfig;
  query: string;
  selection: ChartDatum;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const detail = useQuery({
    queryKey: [
      "entries",
      pageId,
      "chart-detail",
      config,
      query,
      selection.id,
      offset,
    ],
    queryFn: () =>
      client.databases.query({
        pageId,
        config,
        query,
        chartBucket: selection.key,
        offset,
        limit: 50,
      }),
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selection?.label}</DialogTitle>
          <DialogDescription>
            Pages de cette catégorie, avec les filtres du graphique.
          </DialogDescription>
        </DialogHeader>
        <div className="chart-detail-list">
          {detail.isPending ? (
            <p role="status">Chargement des pages…</p>
          ) : detail.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{detail.error.message}</AlertDescription>
            </Alert>
          ) : detail.data?.rows.length ? (
            detail.data.rows.map((row) => (
              <Button
                key={row.id}
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onClose();
                  onNavigate(row.id);
                }}
              >
                <span>{row.icon}</span>
                <span className="truncate">{row.title}</span>
              </Button>
            ))
          ) : (
            <p>Aucune page dans cette catégorie.</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Pages précédentes"
            disabled={!offset}
            onClick={() => setOffset(Math.max(0, offset - 50))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Pages suivantes"
            disabled={!detail.data?.hasMore}
            onClick={() => setOffset(offset + 50)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
