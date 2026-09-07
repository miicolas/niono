import { ArrowRight, FileText, Plus, Table2 } from "lucide-react";
export function CreateShortcuts({
  onCreate,
}: {
  onCreate: (kind: "page" | "database") => void;
}) {
  return (
    <section className="home-section">
      <div className="section-label">
        <Plus size={14} />
        Créer quelque chose
      </div>
      <button
        className="w-full list-row"
        onClick={() => onCreate("page")}
        type="button"
      >
        <FileText size={17} />
        <span className="row-title text-left">Une page blanche</span>
        <ArrowRight size={15} />
      </button>
      <button
        className="w-full list-row"
        onClick={() => onCreate("database")}
        type="button"
      >
        <Table2 size={17} />
        <span className="row-title text-left">Une base de données</span>
        <ArrowRight size={15} />
      </button>
    </section>
  );
}
