import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onUpdate: (html: string) => void
  editable?: boolean
  placeholder?: string
}

export function RichTextEditor({
  content,
  onUpdate,
  editable = true,
  placeholder = 'Start typing...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none px-3 py-2 min-h-[120px] focus:outline-none text-sm',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
  })

  // Sync editable prop
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  if (!editor) return null

  return (
    <div className="border rounded-md bg-background overflow-hidden">
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center gap-0.5 border-b px-1.5 py-1 bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            type="button"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            type="button"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${editor.isActive('underline') ? 'bg-muted' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            type="button"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            type="button"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            type="button"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
