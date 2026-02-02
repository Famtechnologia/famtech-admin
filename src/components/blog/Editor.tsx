"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';



const Tiptap = ({ onChange }: { onChange: (richText: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      
    ],
    content: '',
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // 'prose' is the magic class from Tailwind Typography
        class: 'prose prose-sm focus:outline-none min-h-[150px] p-4 max-w-none',
      },
    },
  });

  return (
    <div className="w-full border overflow-hidden bg-white text-gray-700 border-gray-200 ">
      
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Tiptap;