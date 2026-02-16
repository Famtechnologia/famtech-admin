"use client";

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
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
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: { levels: [1, 2, 3] },

      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-xl border border-gray-200 max-w-full h-auto mx-auto' },
      }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialContent,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm sm:prose lg:prose-lg focus:outline-none p-10 text-black max-w-none mx-auto min-h-full',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML() && initialContent !== '') {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const tabClass = (tab: 'write' | 'preview') =>
    `px-4 py-2 text-sm font-bold border-x transition-colors ${activeTab === tab
      ? 'bg-white border-gray-200 text-green-600 -mb-[1px] z-10'
      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="w-full border bg-gray-50 border-gray-200 shadow-sm rounded-lg flex flex-col overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-end border-b border-gray-200 bg-gray-50/50 shrink-0">
        <button type="button" onClick={() => setActiveTab('write')} className={tabClass('write')}>Write</button>
        <button type="button" onClick={() => setActiveTab('preview')} className={tabClass('preview')}>Preview</button>
      </div>

      {activeTab === 'write' ? (
        <div className="flex flex-col flex-1">
          {/* 1. The Toolbar stays at the top */}
          <EditorToolbar editor={editor} />

          {/* 2. The Content area scrolls internally */}
          <div className="bg-white overflow-y-auto h-[500px] border-t border-gray-100">
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white h-[650px] overflow-y-auto animate-in fade-in duration-300">
          <div
            className="tiptap prose prose-sm sm:prose lg:prose-lg max-w-none text-black"
            dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '<p class="text-gray-400 italic">Nothing to preview yet...</p>' }}
          />
        </div>
      )}
    </div>
  );
};

export default Tiptap;