"use client";
import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, List, ListOrdered, Quote, 
  Heading1, Heading2, Type, Link as LinkIcon, Image as ImageIcon 
} from 'lucide-react';

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const url = window.prompt('URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const btnClass = (active: boolean) => 
    `p-2 rounded transition-colors ${active ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
      <button onClick={() => editor.chain().focus().setParagraph().run()} className={btnClass(editor.isActive('paragraph'))}>
        <Type size={18} />
      </button>
      
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))}>
        <Heading1 size={18} />
      </button>

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
        <Heading2 size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
        <Bold size={18} />
      </button>

      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
        <Italic size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
        <List size={18} />
      </button>

      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
        <ListOrdered size={18} />
      </button>

      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))}>
        <Quote size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={setLink} className={btnClass(editor.isActive('link'))}>
        <LinkIcon size={18} />
      </button>

      <button onClick={addImage} className={btnClass(false)}>
        <ImageIcon size={18} />
      </button>
    </div>
  );
};

export default EditorToolbar;