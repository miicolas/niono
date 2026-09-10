import { Link2, Bookmark, ImageIcon, Unlink } from "lucide-react";
import { useEditorUI } from "../document-editor/use-editor-ui";
import type { useEditorLinks } from "./use-editor-links";

export function EditorLinkTools({
  links,
}: {
  links: ReturnType<typeof useEditorLinks>;
}) {
  const { Button, Popover, TextForm } = useEditorUI();
  const link = links.link;
  if (!link) return null;
  return (
    <div className="editor-link-anchor" style={{ left: link.x, top: link.y }}>
      <Popover
        open
        onOpenChange={(open) => {
          if (!open) links.close();
        }}
        label="Options du lien"
        onRestoreFocus={links.restoreFocus}
        trigger={
          <Button aria-label="Options du lien">
            <Link2 size={16} />
          </Button>
        }
      >
        <div className="editor-link-tools">
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="media-link-preview"
          >
            Ouvrir {link.href}
          </a>
          {link.pasted && (
            <Button onClick={() => links.close()}>
              <Link2 size={16} />
              Conserver le lien
            </Button>
          )}
          {/^https?:\/\//i.test(link.href) && (
            <>
              <Button onClick={() => links.apply("bookmark")}>
                <Bookmark size={16} />
                Créer un signet
              </Button>
              <Button onClick={() => links.apply("image")}>
                <ImageIcon size={16} />
                Intégrer une image
              </Button>
            </>
          )}
          <Button onClick={() => links.apply("plain")}>
            <Unlink size={16} />
            Retirer le lien
          </Button>
          <TextForm
            kind="link"
            value={link.href}
            onSubmit={(value) =>
              links.apply(value ? "link" : "plain", value || link.href)
            }
          />
        </div>
      </Popover>
    </div>
  );
}
