import { Clock3 } from "lucide-react";
import type { orpcClient } from "@/orpc/client";

type RecentPage = Awaited<ReturnType<typeof orpcClient.pages.recent>>[number];
export function RecentPagesGrid({
  pages,
  onOpen,
}: {
  pages: RecentPage[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className="home-section">
      <div className="section-label">
        <Clock3 size={14} />
        Consultées récemment
      </div>
      <div className="recent-grid">
        {pages.slice(0, 6).map((page) => (
          <button
            className="recent-card"
            key={page.id}
            onClick={() => onOpen(page.id)}
            type="button"
          >
            <span className="card-icon">{page.icon}</span>
            <strong>{page.title}</strong>
            <small>
              {new Date(page.visitedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
