import { useState, useRef, useEffect, useCallback } from "react";
import {
  useEditor,
  EditorContent,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import UniqueID from "@tiptap/extension-unique-id";
import {
  Details,
  DetailsSummary,
  DetailsContent,
} from "@tiptap/extension-details";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  Text,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Minus,
  ImageIcon,
  Table2,
  ChevronRight,
  GripVertical,
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  Sparkles,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  FileUp,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { Callout, FileNode, PageLink } from "./extensions";
import type { DocumentNode } from "@digipm/contracts";

export type DocumentEditorProps = {
  content: DocumentNode;
  editable: boolean;
  onChange: (doc: DocumentNode) => void;
  onReady?: (editor: Editor) => void;
  onUpload: (file: File) => Promise<{ url: string; name: string }>;
  onAI?: (text: string, instruction: string) => Promise<string>;
  aiAvailable?: boolean;
  onError?: (message: string) => void;
  onHeadings?: (
    headings: { id: string; text: string; level: number }[],
  ) => void;
};
type Action = {
  id: string;
  label: string;
  description: string;
  icon: typeof Text;
  run: (e: Editor) => void;
};
export function DocumentEditor({
  content,
  editable,
  onChange,
  onReady,
  onUpload,
  onAI,
  aiAvailable,
  onError,
  onHeadings,
}: DocumentEditorProps) {
  const [slash, setSlash] = useState<{
    query: string;
    from: number;
    to: number;
    x: number;
    y: number;
  } | null>(null);
  const [selected, setSelected] = useState(0);
  const [blockMenu, setBlockMenu] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [ai, setAI] = useState<{
    text: string;
    from: number;
    to: number;
    instruction: string;
    result: string;
    busy: boolean;
  } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [colors, setColors] = useState(false);
  const nodePos = useRef(0);
  const uploadInput = useRef<HTMLInputElement>(null);
  const slashRef = useRef(slash);
  slashRef.current = slash;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const itemsRef = useRef<Action[]>([]);
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable,
    content: content as JSONContent,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          defaultProtocol: "https",
          protocols: ["https", "http", "mailto"],
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({
        placeholder: "Écrivez quelque chose, ou « / » pour les commandes…",
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript,
      Superscript,
      Details.configure({ persist: true }),
      DetailsSummary,
      DetailsContent,
      Callout,
      FileNode,
      PageLink,
      UniqueID.configure({
        types: [
          "paragraph",
          "heading",
          "blockquote",
          "codeBlock",
          "image",
          "table",
          "taskItem",
          "listItem",
          "callout",
          "details",
          "file",
        ],
      }),
    ],
    editorProps: {
      attributes: {
        class: "digipm-editor",
        role: "textbox",
        "aria-label": "Contenu de la page",
        "aria-multiline": "true",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape") {
          setSlash(null);
          setBlockMenu(null);
          setAI(null);
          return false;
        }
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "j"
        ) {
          event.preventDefault();
          askAIRef.current();
          return true;
        }
        if (slashRef.current) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setSelected(
              (i) =>
                (i +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  itemsRef.current.length) %
                Math.max(itemsRef.current.length, 1),
            );
            return true;
          }
          if (event.key === "Enter" && itemsRef.current[selectedRef.current]) {
            event.preventDefault();
            runRef.current(itemsRef.current[selectedRef.current]!);
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? [])[0];
        if (file) {
          event.preventDefault();
          void uploadRef.current(file);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event, _slice, moved) => {
        const file = event.dataTransfer?.files?.[0];
        if (file && !moved) {
          event.preventDefault();
          void uploadRef.current(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as DocumentNode);
      updateSlash(editor);
      updateHeadings(editor);
    },
    onSelectionUpdate: ({ editor }) => updateSlash(editor),
  });
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold"),
      italic: ctx.editor?.isActive("italic"),
      underline: ctx.editor?.isActive("underline"),
      strike: ctx.editor?.isActive("strike"),
      table: ctx.editor?.isActive("table"),
      undo: ctx.editor?.can().undo(),
      redo: ctx.editor?.can().redo(),
    }),
  });
  function updateHeadings(e: Editor) {
    const headings: { id: string; text: string; level: number }[] = [];
    e.state.doc.descendants((n) => {
      if (n.type.name === "heading")
        headings.push({
          id: n.attrs.id,
          text: n.textContent,
          level: n.attrs.level,
        });
    });
    onHeadings?.(headings);
  }
  function updateSlash(e: Editor) {
    const { $from } = e.state.selection;
    if (!$from.parent.isTextblock) return setSlash(null);
    const before = $from.parent.textBetween(0, $from.parentOffset);
    const match = before.match(/^\/([^\n/]*)$/);
    if (match) {
      const pos = e.view.coordsAtPos($from.pos);
      setSlash((old) => {
        if (old?.query !== match[1]) setSelected(0);
        return {
          query: match[1]!,
          from: $from.start(),
          to: $from.pos,
          x: Math.min(pos.left, window.innerWidth - 295),
          y: Math.min(pos.bottom + 8, window.innerHeight - 380),
        };
      });
    } else setSlash(null);
  }
  useEffect(() => {
    if (editor) {
      onReady?.(editor);
      updateHeadings(editor);
    }
  }, [editor]);
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);
  useEffect(() => {
    if (!blockMenu) return;
    const close = () => setBlockMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [blockMenu]);
  const upload = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        const result = await onUpload(file);
        if (file.type.startsWith("image/"))
          editor
            .chain()
            .focus()
            .setImage({ src: result.url, alt: result.name })
            .run();
        else
          editor
            .chain()
            .focus()
            .insertContent({
              type: "file",
              attrs: { href: result.url, name: result.name },
            })
            .run();
      } catch (error) {
        onError?.(
          error instanceof Error ? error.message : "Import impossible.",
        );
      }
    },
    [editor, onUpload, onError],
  );
  const uploadRef = useRef(upload);
  uploadRef.current = upload;
  const actions: Action[] = [
    {
      id: "text",
      label: "Texte",
      description: "Commencez à écrire en toute simplicité",
      icon: Text,
      run: (e) => e.chain().focus().setParagraph().run(),
    },
    ...([1, 2, 3] as const).map((level) => ({
      id: `h${level}`,
      label: `Titre ${level}`,
      description:
        level === 1
          ? "Un titre de grande taille"
          : level === 2
            ? "Un titre de taille moyenne"
            : "Un petit titre",
      icon: [Heading1, Heading2, Heading3][level - 1]!,
      run: (e: Editor) => e.chain().focus().setHeading({ level }).run(),
    })),
    {
      id: "bullet",
      label: "Liste à puces",
      description: "Une liste simple et organisée",
      icon: List,
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      id: "ordered",
      label: "Liste numérotée",
      description: "Des étapes dans le bon ordre",
      icon: ListOrdered,
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      id: "task",
      label: "Liste de tâches",
      description: "Suivez ce qui reste à faire",
      icon: ListTodo,
      run: (e) => e.chain().focus().toggleTaskList().run(),
    },
    {
      id: "toggle",
      label: "Liste dépliante",
      description: "Du contenu à ouvrir à votre rythme",
      icon: ChevronRight,
      run: (e) => e.chain().focus().setDetails().run(),
    },
    {
      id: "quote",
      label: "Citation",
      description: "Mettez des mots en lumière",
      icon: Quote,
      run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      id: "callout",
      label: "Encadré",
      description: "Faites ressortir une information",
      icon: Info,
      run: (e) =>
        e
          .chain()
          .focus()
          .insertContent({ type: "callout", content: [{ type: "paragraph" }] })
          .run(),
    },
    {
      id: "code",
      label: "Code",
      description: "Un extrait de code bien présenté",
      icon: Code2,
      run: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
    {
      id: "table",
      label: "Tableau simple",
      description: "Organisez vos informations en cellules",
      icon: Table2,
      run: (e) =>
        e
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      id: "image",
      label: "Image",
      description: "Ajoutez une image à votre page",
      icon: ImageIcon,
      run: () => uploadInput.current?.click(),
    },
    {
      id: "file",
      label: "Fichier",
      description: "Joignez un document",
      icon: FileUp,
      run: () => uploadInput.current?.click(),
    },
    {
      id: "divider",
      label: "Séparateur",
      description: "Séparez les sections de votre page",
      icon: Minus,
      run: (e) => e.chain().focus().setHorizontalRule().run(),
    },
  ];
  const filtered = actions.filter((a) =>
    (a.label + " " + a.id)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(
        (slash?.query ?? "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      ),
  );
  itemsRef.current = filtered;
  const run = (action: Action) => {
    if (!editor) return;
    const current = slashRef.current;
    if (current)
      editor
        .chain()
        .focus()
        .deleteRange({ from: current.from, to: current.to })
        .run();
    setSlash(null);
    action.run(editor);
  };
  const runRef = useRef(run);
  runRef.current = run;
  const askAI = () => {
    if (!editor || !editable) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    if (!text.trim()) return;
    setAI({
      text,
      from,
      to,
      instruction: "Améliore la clarté de ce texte.",
      result: "",
      busy: false,
    });
  };
  const askAIRef = useRef(askAI);
  askAIRef.current = askAI;
  function blockAction(kind: "duplicate" | "delete" | "up" | "down") {
    if (!editor) return;
    const pos = nodePos.current;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    const tr = editor.state.tr;
    if (kind === "delete")
      editor.view.dispatch(tr.delete(pos, pos + node.nodeSize));
    if (kind === "duplicate") {
      const json = node.toJSON();
      if (json.attrs) json.attrs.id = crypto.randomUUID();
      editor
        .chain()
        .focus()
        .insertContentAt(pos + node.nodeSize, json)
        .run();
    }
    if (kind === "up" || kind === "down") {
      const resolved = editor.state.doc.resolve(pos);
      const index = resolved.index();
      const parent = resolved.parent;
      if (kind === "up" && index > 0) {
        const previous = parent.child(index - 1);
        editor.view.dispatch(
          tr
            .delete(pos, pos + node.nodeSize)
            .insert(pos - previous.nodeSize, node),
        );
      }
      if (kind === "down" && index < parent.childCount - 1) {
        const next = parent.child(index + 1);
        editor.view.dispatch(
          tr.delete(pos, pos + node.nodeSize).insert(pos + next.nodeSize, node),
        );
      }
    }
    setBlockMenu(null);
    editor.commands.focus();
  }
  if (!editor)
    return <div className="editor-loading">Ouverture de votre page…</div>;
  return (
    <div className="editor-container">
      <input
        ref={uploadInput}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
      {editable && (
        <div className="editor-history-tools">
          <button
            aria-label="Annuler"
            disabled={!editorState?.undo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={14} />
          </button>
          <button
            aria-label="Rétablir"
            disabled={!editorState?.redo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={14} />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      {editable && (
        <DragHandle
          editor={editor}
          nested
          onNodeChange={({ pos }) => {
            nodePos.current = pos;
          }}
        >
          <div className="block-handle">
            <button
              aria-label="Ajouter un bloc"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .insertContentAt(nodePos.current, {
                    type: "paragraph",
                    content: [{ type: "text", text: "/" }],
                  })
                  .setTextSelection(nodePos.current + 2)
                  .run();
              }}
            >
              <Plus size={16} />
            </button>
            <button
              aria-label="Déplacer ou modifier le bloc"
              onClick={(e) => {
                e.stopPropagation();
                editor.view.dispatch(
                  editor.state.tr.setSelection(
                    NodeSelection.create(editor.state.doc, nodePos.current),
                  ),
                );
                setBlockMenu({
                  x: e.clientX,
                  y: Math.min(e.clientY, window.innerHeight - 300),
                });
              }}
            >
              <GripVertical size={16} />
            </button>
          </div>
        </DragHandle>
      )}
      {editable && (
        <BubbleMenu
          editor={editor}
          options={{ placement: "top", offset: 8 }}
          shouldShow={({ editor, state }) =>
            !state.selection.empty &&
            !editor.isActive("image") &&
            !editor.isActive("codeBlock")
          }
        >
          <div className="editor-bubble">
            <button
              className="ai-button"
              onClick={askAI}
              title="Demander à l’IA · ⌘ J"
            >
              <Sparkles size={14} />
              <span>Demander à l’IA</span>
            </button>
            <i />
            <button
              title="Gras"
              aria-label="Gras"
              data-active={editorState?.bold}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={15} />
            </button>
            <button
              title="Italique"
              aria-label="Italique"
              data-active={editorState?.italic}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={15} />
            </button>
            <button
              title="Souligner"
              aria-label="Souligner"
              data-active={editorState?.underline}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <Underline size={15} />
            </button>
            <button
              title="Barrer"
              aria-label="Barrer"
              data-active={editorState?.strike}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough size={15} />
            </button>
            <button
              title="Lien"
              aria-label="Ajouter un lien"
              onClick={() => setLink(editor.getAttributes("link").href ?? "")}
            >
              <Link2 size={15} />
            </button>
            <button
              aria-label="Couleurs et surlignage"
              onClick={() => setColors(!colors)}
            >
              <Highlighter size={15} />
            </button>
            <i />
            <button
              aria-label="Aligner à gauche"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft size={15} />
            </button>
            <button
              aria-label="Centrer"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
            >
              <AlignCenter size={15} />
            </button>
            <button
              aria-label="Aligner à droite"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight size={15} />
            </button>
            {link !== null && (
              <form
                className="bubble-popover"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!link) editor.chain().focus().unsetLink().run();
                  else if (/^(https?:\/\/|mailto:)/.test(link))
                    editor.chain().focus().setLink({ href: link }).run();
                  else {
                    onError?.("Utilisez un lien https://, http:// ou mailto:.");
                    return;
                  }
                  setLink(null);
                }}
              >
                <input
                  aria-label="Adresse du lien"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  autoFocus
                />
                <button type="submit">Appliquer</button>
              </form>
            )}
            {colors && (
              <div className="bubble-popover color-palette">
                {[
                  "#deddd8",
                  "#9da3aa",
                  "#ca8d8d",
                  "#d3b789",
                  "#95b69c",
                  "#92b2d0",
                  "#bba2d1",
                ].map((color) => (
                  <button
                    key={color}
                    aria-label={`Couleur ${color}`}
                    style={{ color }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setColors(false);
                    }}
                  >
                    A
                  </button>
                ))}
                {["#4a3b2b", "#284136", "#263e52", "#44344e"].map((color) => (
                  <button
                    key={color}
                    aria-label={`Surlignage ${color}`}
                    style={{ background: color }}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setColors(false);
                    }}
                  >
                    A
                  </button>
                ))}
              </div>
            )}
          </div>
        </BubbleMenu>
      )}
      {slash && (
        <div
          className="slash-menu"
          role="listbox"
          aria-label="Insérer un bloc"
          style={{ left: slash.x, top: slash.y }}
        >
          <div className="menu-caption">BLOCS DE BASE</div>
          {filtered.length ? (
            filtered.map((a, i) => (
              <button
                key={a.id}
                role="option"
                aria-selected={i === selected}
                className={i === selected ? "selected" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setSelected(i)}
                onClick={() => run(a)}
              >
                <span className="slash-icon">
                  <a.icon size={20} />
                </span>
                <span>
                  <strong>{a.label}</strong>
                  <small>{a.description}</small>
                </span>
              </button>
            ))
          ) : (
            <p>Aucun bloc correspondant</p>
          )}
          <footer>
            <span>↑ ↓ pour naviguer</span>
            <span>↵ pour insérer</span>
          </footer>
        </div>
      )}
      {blockMenu && (
        <div
          className="block-context-menu"
          role="menu"
          style={{ left: blockMenu.x, top: blockMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-caption">ACTIONS DU BLOC</div>
          {[
            { kind: "duplicate", label: "Dupliquer", icon: Copy },
            { kind: "up", label: "Déplacer vers le haut", icon: ArrowUp },
            { kind: "down", label: "Déplacer vers le bas", icon: ArrowDown },
            { kind: "delete", label: "Supprimer", icon: Trash2 },
          ].map((a) => (
            <button
              key={a.kind}
              role="menuitem"
              onClick={() =>
                blockAction(a.kind as "duplicate" | "delete" | "up" | "down")
              }
            >
              <a.icon size={14} />
              {a.label}
            </button>
          ))}
        </div>
      )}
      {editorState?.table && editable && (
        <div className="table-tools">
          {[
            {
              label: "+ Ligne",
              run: () => editor.chain().focus().addRowAfter().run(),
            },
            {
              label: "+ Colonne",
              run: () => editor.chain().focus().addColumnAfter().run(),
            },
            {
              label: "Supprimer la ligne",
              run: () => editor.chain().focus().deleteRow().run(),
            },
            {
              label: "Supprimer la colonne",
              run: () => editor.chain().focus().deleteColumn().run(),
            },
            {
              label: "Fusionner",
              run: () => editor.chain().focus().mergeCells().run(),
            },
            {
              label: "Séparer",
              run: () => editor.chain().focus().splitCell().run(),
            },
          ].map((a) => (
            <button key={a.label} onClick={a.run}>
              {a.label}
            </button>
          ))}
        </div>
      )}
      {ai && (
        <div
          className="ai-panel"
          role="dialog"
          aria-label="Assistant d’écriture"
        >
          <div className="ai-panel-header">
            <Sparkles size={16} />
            <strong>Un coup de pouce pour vos idées</strong>
            <button aria-label="Fermer l’assistant" onClick={() => setAI(null)}>
              <X size={16} />
            </button>
          </div>
          {!aiAvailable ? (
            <p>
              Pour activer l’assistant, configurez un fournisseur IA dans les
              paramètres du serveur. Votre texte reste sur votre appareil tant
              que vous ne lancez pas une demande.
            </p>
          ) : (
            <>
              <div className="ai-presets">
                {[
                  "Améliorer la clarté",
                  "Corriger l’orthographe",
                  "Résumer",
                  "Traduire en anglais",
                ].map((label) => (
                  <button
                    key={label}
                    onClick={() => setAI({ ...ai, instruction: label })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAI({ ...ai, busy: true });
                  try {
                    const result = await onAI?.(ai.text, ai.instruction);
                    setAI({ ...ai, result: result ?? "", busy: false });
                  } catch (error) {
                    onError?.(
                      error instanceof Error
                        ? error.message
                        : "Assistant indisponible.",
                    );
                    setAI({ ...ai, busy: false });
                  }
                }}
              >
                <input
                  aria-label="Instruction pour l’IA"
                  value={ai.instruction}
                  onChange={(e) =>
                    setAI({ ...ai, instruction: e.target.value })
                  }
                />
                <button disabled={ai.busy}>
                  {ai.busy ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ArrowUp size={16} />
                  )}
                </button>
              </form>
              {ai.result && (
                <>
                  <div className="ai-result">{ai.result}</div>
                  <div className="ai-result-actions">
                    <button
                      onClick={() => {
                        const current = editor.state.doc.textBetween(
                          ai.from,
                          ai.to,
                          "\n",
                        );
                        if (current !== ai.text) {
                          onError?.(
                            "Le texte a changé. Relancez la sélection.",
                          );
                          return;
                        }
                        editor
                          .chain()
                          .focus()
                          .insertContentAt(
                            { from: ai.from, to: ai.to },
                            { type: "text", text: ai.result },
                          )
                          .run();
                        setAI(null);
                      }}
                    >
                      Remplacer la sélection
                    </button>
                    <button
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .insertContent({
                            type: "paragraph",
                            content: [{ type: "text", text: ai.result }],
                          })
                          .run();
                        setAI(null);
                      }}
                    >
                      Insérer à la suite
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
