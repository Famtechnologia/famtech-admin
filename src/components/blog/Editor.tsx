"use client";

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import EditorToolbar from './EditorToolBar';

interface TiptapProps {
  initialContent?: string;
  onChange: (richText: string) => void;
}

const Tiptap = ({ initialContent = '', onChange }: TiptapProps) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-green-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl border border-gray-200 max-w-full h-auto mx-auto',
        },
      }),
      HorizontalRule,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
    TaskItem.configure({
      nested: true,
    }),
    ],
    content: initialContent,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[400px] p-6 text-black max-w-none',
      },
    },
  });

  // Sync content if it changes externally (important for Edit Page loading)
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML() && initialContent !== '') {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const tabClass = (tab: 'write' | 'preview') =>
    `px-4 py-2 text-sm font-bold border-x  transition-colors ${activeTab === tab
      ? 'bg-white border-gray-200 text-green-600 -mb-[1px] z-10'
      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="w-full border bg-gray-50 border-gray-200 shadow-sm">
      {/* GitHub Style Tabs */}
      <div className="flex items-end border-b border-gray-200 bg-gray-50/50"> 
        <button type="button" onClick={() => setActiveTab('write')} className={tabClass('write')}>
          Write
        </button>
        <button type="button" onClick={() => setActiveTab('preview')} className={tabClass('preview')}>
          Preview
        </button>
      </div>

      {activeTab === 'write' ? (
        <div className="animate-in fade-in duration-300">
          <EditorToolbar editor={editor} />
          <div className="bg-white">
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white min-h-[465px] animate-in fade-in duration-300">
          {/* Preview Mode */}
          <div
            className=" tiptap prose prose-sm sm:prose lg:prose-lg max-w-none text-black"
            dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '<p class="text-gray-400 italic">Nothing to preview yet...</p>' }}
          />
        </div>
      )}


    </div>
  );
};

export default Tiptap;