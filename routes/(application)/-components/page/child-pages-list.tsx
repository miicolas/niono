import { ChevronDown } from "lucide-react";
import type { PageItem } from "@/routes/(application)/-lib/types";

type Props = {
  pages: PageItem[];
  parentId: string;
  onNavigate: (id: string) => void;
};

export function ChildPagesList({ pages, parentId, onNavigate }: Props) {
  const children = pages.filter((p) => p.parentId === parentId);
  if (children.length === 0) {
    return null;
  }
  return (
    <div className="child-pages">
      {children.map((p) => (
        <button
          className="w-full list-row"
          key={p.id}
          onClick={() => onNavigate(p.id)}
          type="button"
        >
          {p.icon}
          <span className="row-title text-left">{p.title}</span>
          <ChevronDown className="-rotate-90" size={12} />
        </button>
      ))}
    </div>
  );
}
