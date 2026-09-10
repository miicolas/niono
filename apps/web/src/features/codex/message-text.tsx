import type { CellContext } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Separator } from "@/components/ui/separator";
import { Fragment, type ReactNode } from "react";
import { marked, type Token, type Tokens } from "marked";

type Source = { pageId: string };
/** Render markdown as React nodes: HTML and unverified links stay inert text. */
export function MessageText({
  text,
  sources,
  workspaceId,
}: {
  text: string;
  sources: Source[];
  workspaceId: string;
}) {
  const safeLink = (href: string) => {
    try {
      const url = new URL(href, "https://digipm.invalid");
      if (
        url.origin === "https://digipm.invalid" &&
        url.pathname === "/" &&
        url.searchParams.get("w") === workspaceId &&
        sources.some((source) => source.pageId === url.searchParams.get("p"))
      )
        return url.pathname + url.search;
    } catch {}
    return null;
  };
  const render = (tokens: Token[]): ReactNode =>
    tokens.map((token, index) => {
      const children =
        "tokens" in token && token.tokens
          ? render(token.tokens)
          : "text" in token
            ? String(token.text)
            : token.raw;
      let node: ReactNode;
      switch (token.type) {
        case "space":
          node = null;
          break;
        case "paragraph":
          node = <p>{children}</p>;
          break;
        case "heading":
          node = <h3>{children}</h3>;
          break;
        case "strong":
          node = <strong>{children}</strong>;
          break;
        case "em":
          node = <em>{children}</em>;
          break;
        case "del":
          node = <del>{children}</del>;
          break;
        case "codespan":
          node = <code>{token.text}</code>;
          break;
        case "code":
          node = (
            <pre>
              <code>{token.text}</code>
            </pre>
          );
          break;
        case "blockquote":
          node = <blockquote>{children}</blockquote>;
          break;
        case "br":
          node = <br />;
          break;
        case "hr":
          node = <Separator />;
          break;
        case "list": {
          const items = token.items.map((item: Tokens.ListItem, i: number) => (
            <li key={i}>
              {item.task && (
                <span aria-label={item.checked ? "Terminé" : "À faire"}>
                  {item.checked ? "☑ " : "☐ "}
                </span>
              )}
              {render(item.tokens)}
            </li>
          ));
          node = token.ordered ? (
            <ol
              start={typeof token.start === "number" ? token.start : undefined}
            >
              {items}
            </ol>
          ) : (
            <ul>{items}</ul>
          );
          break;
        }
        case "link": {
          const href = safeLink(token.href);
          node = href ? <a href={href}>{children}</a> : children;
          break;
        }
        case "table":
          node = (
            <div className="codex-table-scroll">
              <DataTable
                data={token.rows}
                columns={token.header.map(
                  (header: Tokens.TableCell, index: number) => ({
                    id: String(index),
                    header: () => render(header.tokens),
                    cell: ({ row }: CellContext<Tokens.TableCell[], unknown>) =>
                      render(row.original[index]?.tokens ?? []),
                  }),
                )}
              />
            </div>
          );
          break;
        default:
          node = children;
      }
      return <Fragment key={index}>{node}</Fragment>;
    });
  return <div className="codex-message-text">{render(marked.lexer(text))}</div>;
}
