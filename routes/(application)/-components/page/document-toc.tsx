import type { Heading } from "@/routes/(application)/-lib/types";

type Props = { headings: Heading[] };

export function DocumentToc({ headings }: Props) {
  if (headings.length <= 1) {
    return null;
  }
  return (
    <nav aria-label="Sommaire" className="document-toc">
      {headings.map((h, i) => (
        <a
          aria-label={h.text}
          href={`#${h.id}`}
          key={h.id ?? i}
          onClick={(e) => {
            e.preventDefault();
            window.document
              .querySelector(`[data-id="${CSS.escape(h.id)}"]`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          style={{ width: h.level === 1 ? 20 : 14 }}
          title={h.text}
        >
          <span className="sr-only">{h.text}</span>
        </a>
      ))}
    </nav>
  );
}
