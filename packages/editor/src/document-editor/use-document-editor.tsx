import { slashMenuAtSelection } from "./slash-menu-at-selection";
import { useEditorUploads } from "../media/use-editor-uploads";
import { useMentionSuggestions } from "../mentions/use-mention-suggestions";
import { useEditorLinks } from "../links/use-editor-links";
import { normalizeSearch } from "./normalize-search";
import { documentHeadings } from "./document-headings";
import { useEditorFormatting } from "./use-editor-formatting";
import { useMemo } from "react";
import { matchesKeyboardEvent } from "@tanstack/hotkeys";
import { useState, useRef, useEffect } from "react";
import { useEditor, type Editor, type JSONContent } from "@tiptap/react";
import type { DocumentNode } from "@digipm/contracts";
import {
  ASSISTANT_HOTKEY,
  type DocumentEditorProps,
  type Action,
  type AssistantState,
  type BlockMenuState,
  type SlashMenuState,
} from "./shared";
import { createEditorExtensions } from "./create-editor-extensions";
import { createEditorActions } from "./create-editor-actions";
import { createEditorMenuAction } from "./create-editor-menu-action";
import { openEditorContextMenu } from "./open-editor-context-menu";
import { openEditorKeyboardMenu } from "./open-editor-keyboard-menu";

export function useDocumentEditor({
  AssistantDialog,
  Input,
  Checkbox: TaskCheckbox,
  QuestionnaireSection,
  content,
  collaboration,
  editable,
  onChange,
  onReady,
  onUpload,
  onMentionSearch,
  onAI,
  onCodex,
  codexIcon,
  aiAvailable,
  onError,
  onHeadings,
}: DocumentEditorProps) {
  const [slash, setSlash] = useState<SlashMenuState | null>(null);
  const [selected, setSelected] = useState(0);
  const [blockMenu, setBlockMenu] = useState<BlockMenuState | null>(null);
  const [ai, setAI] = useState<AssistantState | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [colors, setColors] = useState(false);
  const nodePos = useRef(0);
  const editableRef = useRef(editable);
  editableRef.current = editable;
  const uploadInput = useRef<HTMLInputElement>(null);
  const mentionKeys = useRef<(event: KeyboardEvent) => boolean>(() => false);
  const linkPaste = useRef<(event: ClipboardEvent) => boolean>(() => false);
  const linkClick = useRef<(event: MouseEvent) => boolean>(() => false);
  const slashRef = useRef(slash);
  slashRef.current = slash;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const itemsRef = useRef<Action[]>([]);
  const openBlockMenu = (menu: BlockMenuState) => {
    setSlash(null);
    setColors(false);
    setLink(null);
    setBlockMenu(menu);
  };
  const extensions = useMemo(
    () =>
      createEditorExtensions({
        editable,
        TaskCheckbox,
        QuestionnaireSection,
        collaboration,
        onUpload,
      }),
    [editable, TaskCheckbox, QuestionnaireSection, collaboration, onUpload],
  );
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable,
    content: collaboration ? undefined : (content as JSONContent),
    extensions,
    editorProps: {
      attributes: {
        class: "digipm-editor",
        role: "textbox",
        "aria-label": "Contenu de la page",
        "aria-multiline": "true",
      },
      handleKeyDown: (view, event) => {
        if (event.isComposing) return false;
        if (mentionKeys.current(event)) return true;
        if (
          editableRef.current &&
          (event.key === "ContextMenu" ||
            (event.key === "F10" && event.shiftKey))
        ) {
          event.preventDefault();
          openEditorKeyboardMenu({ view, nodePos, open: openBlockMenu });
          return true;
        }
        if (event.key === "Escape") {
          setSlash(null);
          setBlockMenu(null);
          setAI(null);
          return false;
        }
        if (editable && matchesKeyboardEvent(event, ASSISTANT_HOTKEY)) {
          event.preventDefault();
          if (!event.repeat) askAIRef.current();
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
        if (!editableRef.current) return false;
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.length) {
          event.preventDefault();
          void uploadRef.current(files);
          return true;
        }
        return linkPaste.current(event);
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!editableRef.current) return false;
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length && !moved) {
          event.preventDefault();
          const pos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })?.pos;
          void uploadRef.current(files, pos);
          return true;
        }
        return false;
      },
      handleDOMEvents: {
        click: (_view, event) => linkClick.current(event),
        contextmenu: (view, event) =>
          openEditorContextMenu({
            view,
            event,
            editable: editableRef.current,
            nodePos,
            open: openBlockMenu,
          }),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as DocumentNode);
      updateSlash(editor);
      updateHeadings(editor);
    },
    onSelectionUpdate: ({ editor }) => updateSlash(editor),
  });
  const editorState = useEditorFormatting(editor);
  const updateHeadings = (editor: Editor) =>
    onHeadings?.(documentHeadings(editor));
  function updateSlash(e: Editor) {
    const next = slashMenuAtSelection(e);
    if (slash?.query !== next?.query) setSelected(0);
    setSlash(next);
  }
  useEffect(() => {
    if (editor) {
      onReady?.(editor);
      updateHeadings(editor);
    }
  }, [editor]);
  useEffect(() => {
    editor?.setEditable(editable, false);
    editor?.commands.setMeta("editable", editable);
  }, [editor, editable]);
  const uploads = useEditorUploads(editor, onUpload);
  const mentions = useMentionSuggestions(editor, onMentionSearch);
  const links = useEditorLinks(editor);
  mentionKeys.current = mentions.handleKeyDown;
  linkPaste.current = links.paste;
  linkClick.current = links.click;
  const upload = uploads.upload;
  const uploadRef = useRef(upload);
  uploadRef.current = upload;
  const actions = useMemo(
    () => createEditorActions(uploadInput, !!QuestionnaireSection),
    [QuestionnaireSection],
  );
  const filtered = useMemo(() => {
    const query = normalizeSearch(slash?.query ?? "");
    return actions.filter((action) =>
      normalizeSearch(action.label + " " + action.id).includes(query),
    );
  }, [actions, slash?.query]);
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
  const askAI = (configuredProvider = false) => {
    if (!editor || !editable) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    if (!text.trim()) return;
    if (onCodex && !configuredProvider) {
      onCodex({ from, to, text });
      return;
    }
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
  const blockAction = createEditorMenuAction({
    editor,
    nodePos,
    close: () => setBlockMenu(null),
    askAI,
  });
  return {
    Input,
    uploadInput,
    upload,
    uploads,
    mentions,
    links,
    editable,
    editorState,
    editor,
    nodePos,
    setBlockMenu,
    askAI,
    onCodex,
    codexIcon,
    aiAvailable,
    setLink,
    setColors,
    colors,
    link,
    onError,
    slash,
    filtered,
    selected,
    setSelected,
    run,
    blockMenu,
    blockAction,
    ai,
    AssistantDialog,
    setAI,
    onAI,
  };
}
