"use client";
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2,
  Type, Underline, Link as LinkIcon, Image as ImageIcon, X, Table as TableIcon, Minus, Rows, Columns, Trash2, Plus,
  CodeXml, CheckSquare
} from 'lucide-react';

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  if (!editor) return null;

  // --- Handlers ---
 const handleLinkSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (linkUrl === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  } else {
    // Helper to ensure the link is absolute
    let formattedUrl = linkUrl.trim();
    
    // Check if it starts with http:// or https:// or mailto: or tel:
    if (!/^https?:\/\//i.test(formattedUrl) && !/^mailto:/i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: formattedUrl, target: '_blank' })
      .run();
  }

  setLinkUrl('');
  setShowLinkModal(false);
};

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setImageUrl('');
    setShowImageModal(false);
  };

  const btnClass = (active?: boolean) => 
  `p-2 rounded transition-colors ${active ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className=" sticky top-0 z-40 w-full flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">

      {/* Text Styles */}
      <button
        type="button"
        data-tooltip="Paragraph"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={btnClass(editor.isActive('paragraph'))}
      >
        <Type size={18} />
      </button>

      <button
        type="button"
        data-tooltip="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
      >
        <Heading1 size={18} />
      </button>

      <button
        type="button"
        data-tooltip="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
      >
        <Heading2 size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Formatting */}
      <button type="button"
        data-tooltip="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
      >
        <Bold size={18} />
      </button>

      <button
        type="button"
        data-tooltip="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
      >
        <Italic size={18} />
      </button>

      <button
        type="button"
        data-tooltip="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
      >
        <Underline size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists & Quotes */}
      <button
        type="button"
        data-tooltip="Bullet List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
      >
        <List size={18} />
      </button>

      <button
        type="button"
        data-tooltip="Numbered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
      >
        <ListOrdered size={18} />
      </button>
      <button type="button" data-tooltip="Task List" onClick={() => editor.chain().focus().toggleTaskList().run()} className={btnClass(editor.isActive('taskList'))}><CheckSquare size={18} /></button>

      <div className="w-px h-6 bg-gray-300 mx-1" />
      {/* Blocks & Media */}
      <button type="button" data-tooltip="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))}><Quote size={18} /></button>
      <button type="button" data-tooltip="Code Block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))}><CodeXml size={18} /></button>
      <button type="button" data-tooltip="Horizontal Line" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 text-gray-600 hover:bg-gray-100"><Minus size={18} /></button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button type="button" data-tooltip="Insert Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className={btnClass(editor.isActive('table'))}><TableIcon size={18} /></button>


      {/* Media Tools */}
      <button
        type="button"
         data-tooltip="Add Link"
        onClick={() => {
          // This grabs the href of the selected text if it's already a link
          const existingUrl = editor.getAttributes('link').href || '';
          setLinkUrl(existingUrl);
          setShowLinkModal(true);
        }}
        className={btnClass(editor.isActive('link'))}
      >
        <LinkIcon size={18} />
      </button>
      <button
        type="button"
        data-tooltip="Add Image"
        onClick={() => setShowImageModal(true)}
        className="p-2 rounded text-gray-600 hover:bg-gray-100"
      >
        <ImageIcon size={18} />
      </button>

      {/* --- LINK MODAL --- */}
      {showLinkModal && (
        <div className="absolute top-12 left-2 z-[60] w-72 bg-white border border-gray-200 shadow-xl rounded-lg p-4 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">Add Link</span>
            <button type="button" onClick={() => setShowLinkModal(false)}><X size={16} /></button>
          </div>
          <form onSubmit={handleLinkSubmit} className="space-y-3">
            <input
              autoFocus
              className="w-full p-2 text-sm border border-gray-200 rounded outline-none focus:ring-2 focus:ring-green-500 text-black"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <button type="submit" className="w-full bg-green-600 text-white text-sm font-bold py-2 rounded hover:bg-green-700 transition-colors">
              Apply Link
            </button>
          </form>
        </div>
      )}

      {/* Dynamic Table Controls - Only shows when cursor is in a table */}
      {editor.isActive('table') && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-green-50 border-t border-green-100 animate-in slide-in-from-top-1 duration-200">
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider mr-2">Table Actions:</span>

          <button type="button" data-tooltip="Add Row After" onClick={() => editor.chain().focus().addRowAfter().run()} className={btnClass()}><Rows size={16} /></button>
          <button type="button" data-tooltip="Delete Row" onClick={() => editor.chain().focus().deleteRow().run()} className="p-2 rounded text-red-600 hover:bg-red-50"><X size={16} /></button>

          <div className="w-px h-4 bg-green-200 mx-1" />

          <button type="button" data-tooltip="Add Column After" onClick={() => editor.chain().focus().addColumnAfter().run()} className={btnClass()}><Columns size={16} /></button>
          <button type="button" data-tooltip="Delete Column" onClick={() => editor.chain().focus().deleteColumn().run()} className="p-2 rounded text-red-600 hover:bg-red-50"><X size={16} className="rotate-90" /></button>

          <div className="w-px h-4 bg-green-200 mx-1" />

          <button type="button" data-tooltip="Merge Cells" onClick={() => editor.chain().focus().mergeCells().run()} className="text-xs font-bold px-2 py-1 text-green-700 hover:bg-green-100 rounded">Merge</button>
          <button type="button" data-tooltip="Split Cell" onClick={() => editor.chain().focus().splitCell().run()} className="text-xs font-bold px-2 py-1 text-green-700 hover:bg-green-100 rounded">Split</button>

          <div className="w-px h-4 bg-green-200 mx-1" />

          <button type="button" data-tooltip="Delete Entire Table" onClick={() => editor.chain().focus().deleteTable().run()} className="p-2 rounded text-red-600 hover:bg-red-100"><Trash2 size={16} /></button>
        </div>
      )}

      {/* --- IMAGE MODAL --- */}
      {showImageModal && (
        <div className="absolute top-12 left-2 z-[60] w-72 bg-white border border-gray-200 shadow-xl rounded-lg p-4 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">Insert Image URL</span>
            <button type="button" onClick={() => setShowImageModal(false)}><X size={16} /></button>
          </div>
          <form onSubmit={handleImageSubmit} className="space-y-3">
            <input
              autoFocus
              className="w-full p-2 text-sm border border-gray-200 rounded outline-none focus:ring-2 focus:ring-green-500 text-black"
              placeholder="Paste image address..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <button type="submit" className="w-full bg-green-600 text-white text-sm font-bold py-2 rounded hover:bg-green-700 transition-colors">
              Insert Image
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;