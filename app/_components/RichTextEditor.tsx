"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";

type Props = {
  /** Current value as an HTML string. `""` means empty. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
  /** Accessible name for the editing area. */
  ariaLabel?: string;
};

const EDITOR_CLASS = "rte-content min-h-56 max-w-none px-4 py-3 text-sm text-ink outline-none";

// Tiptap represents an empty document as "<p></p>" — collapse it to "" so
// callers can validate against a plain empty string.
const normalize = (html: string) => (html === "<p></p>" ? "" : html);

// A reusable rich-text editor (Tiptap). Emits and accepts HTML strings; the
// caller is responsible for sanitising the HTML before it is persisted.
export function RichTextEditor({ value, onChange, placeholder, invalid, ariaLabel }: Props) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: EDITOR_CLASS,
        role: "textbox",
        "aria-multiline": "true",
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(normalize(editor.getHTML())),
  });

  // Re-sync when `value` is replaced from outside (e.g. an async form load),
  // but never while the user is typing.
  useEffect(() => {
    if (!editor) return;
    if (value !== normalize(editor.getHTML()) && !editor.isFocused) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors focus-within:ring-4 ${
        invalid
          ? "border-coral focus-within:border-coral focus-within:ring-coral/10"
          : "border-line focus-within:border-brand focus-within:ring-brand/10"
      }`}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function setLink(editor: Editor) {
  const previous = (editor.getAttributes("link").href as string | undefined) ?? "https://";
  const url = window.prompt("Link URL", previous);
  if (url === null) return;
  const chain = editor.chain().focus().extendMarkRange("link");
  if (url === "") chain.unsetLink().run();
  else chain.setLink({ href: url }).run();
}

function Toolbar({ editor }: { editor: Editor | null }) {
  return (
    <div className="border-line bg-cream flex flex-wrap items-center gap-0.5 border-b p-1.5">
      {editor ? (
        <>
          <Btn
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="font-bold">B</span>
          </Btn>
          <Btn
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </Btn>
          <Btn
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </Btn>
          <Btn
            label="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <span className="line-through">S</span>
          </Btn>

          <Divider />

          <Btn
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </Btn>
          <Btn
            label="Subheading"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </Btn>
          <Btn
            label="Bulleted list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </Btn>
          <Btn
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </Btn>
          <Btn
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            &ldquo; &rdquo;
          </Btn>

          <Divider />

          <Btn label="Add link" active={editor.isActive("link")} onClick={() => setLink(editor)}>
            Link
          </Btn>
          <Btn
            label="Remove link"
            disabled={!editor.isActive("link")}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            Unlink
          </Btn>
          <Btn
            label="Clear formatting"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            Clear
          </Btn>

          <Divider />

          <Btn
            label="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            ↶
          </Btn>
          <Btn
            label="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            ↷
          </Btn>
        </>
      ) : (
        <span className="text-muted px-2 py-1 text-xs">Loading editor…</span>
      )}
    </div>
  );
}

function Divider() {
  return <span className="bg-line mx-1 h-5 w-px shrink-0" aria-hidden />;
}

function Btn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`grid h-7 min-w-7 place-items-center rounded-lg px-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
        active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
