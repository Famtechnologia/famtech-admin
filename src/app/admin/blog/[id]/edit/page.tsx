"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlogById, updateBlog, deleteBlog } from "@/lib/api/blog";
import { BlogFormData } from "@/types/blog.types";
import { Save, Trash2, ArrowLeft, CheckCircle, AlertTriangle, ImageIcon, Type } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import EditorToolbar from "@/components/blog/EditorToolBar"; // Reusing your toolbar

const EditBlogPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    niche: "",
    author: "",
    imageUrl: "",
    
  });

  // 1. Initialize Tiptap
  const editor = useEditor({
    extensions: [StarterKit],
    content: "", // Starts empty, will be set in useEffect
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] p-6 text-black max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // 2. Fetch Data and set Editor Content
  useEffect(() => {
    const loadBlog = async () => {
      try {
        const data = await getBlogById(id as string);
        setFormData({
          title: data.title,
          content: data.content,
          niche: data.niche,
          author: data.author,
          imageUrl: data.imageUrl || "",
          
        });

        // Crucial: Push the fetched content into the editor
        if (editor && data.content) {
          editor.commands.setContent(data.content);
        }
      } catch (error) {
        console.error("Failed to load blog");
      } finally {
        setLoading(false);
      }
    };
    if (id && editor) loadBlog();
  }, [id, editor]);

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await updateBlog(id as string, formData);
      setShowSuccessModal(true);
    } catch (error) {
      alert("Update failed.");
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBlog(id as string);
      router.push("/admin/blog");
    } catch (error) {
      alert("Delete failed.");
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-green-600 font-bold animate-pulse">Loading Data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Edit Post</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Main Editor Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <label className="text-xs font-bold text-gray-400 tracking-wider">Blog Title</label>
              <input
                type="text"
                className="w-full text-2xl font-bold text-black mt-1 outline-none placeholder:text-gray-300"
                placeholder="Enter title..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Tiptap Integration */}
            <EditorToolbar editor={editor} />
            <div className="bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Image & Details Sections below the editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                   <ImageIcon size={16} className="text-green-600" /> Cover Image
                </label>
                <input
                  type="text"
                  className="w-full text-black p-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                />
                {formData.imageUrl && (
                    <img src={formData.imageUrl} className="w-full h-32 object-cover rounded-lg border" alt="Preview" />
                )}
             </div>

             <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400">Author</label>
                        <input
                            type="text"
                            className="w-full text-black p-2 border-b outline-none focus:border-green-500"
                            value={formData.author}
                            onChange={(e) => setFormData({...formData, author: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 ">Niche</label>
                        <input
                            type="text"
                            className="w-full text-black p-2 border-b outline-none focus:border-green-500"
                            value={formData.niche}
                            onChange={(e) => setFormData({...formData, niche: e.target.value})}
                        />
                    </div>
                </div>
              
             </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:w-72">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Actions</h3>
            <button
              onClick={handleUpdate}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all mb-3"
            >
              <Save size={18} /> Save Changes
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-all"
            >
              <Trash2 size={18} /> Delete Post
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}



      {/* 1. Success Modal */}

      {showSuccessModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">

            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">

              <CheckCircle size={32} className="text-green-600" />

            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Updated!</h2>

            <p className="text-gray-500 mb-6">Your changes have been saved successfully.</p>

            <button 

              onClick={() => setShowSuccessModal(false)}

              className="w-full bg-green-600 mb-3 text-white font-bold py-3 rounded-xl hover:bg-green-700"

            >

              Continue Editing

            </button>

             <button 

              onClick={() => router.push("/admin/blog")}

              className="w-full bg-gray-600 mb-6 text-white font-bold py-3 rounded-xl hover:bg-gray-700"

            >

             Back to Posts

            </button>

           

          </div>

        </div>

      )}



      {/* 2. Delete Confirmation Modal */}

      {showDeleteModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">

            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">

              <AlertTriangle size={32} className="text-red-600" />

            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Post?</h2>

            <p className="text-gray-500 mb-6">This action cannot be undone. Are you sure you want to proceed?</p>

            <div className="flex gap-3">

              <button 

                onClick={() => setShowDeleteModal(false)}

                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl"

              >

                No, Keep it

              </button>

              <button 

                onClick={confirmDelete}

                disabled={isDeleting}

                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-red-300"

              >

                {isDeleting ? "Deleting..." : "Yes, Delete"}

              </button>

            </div>

          </div>

        </div>

      )}
    </div>
  );
};

export default EditBlogPage;