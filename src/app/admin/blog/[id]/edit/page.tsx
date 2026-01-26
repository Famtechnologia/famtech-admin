"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlogById, updateBlog, deleteBlog } from "@/lib/api/blog";
import { BlogFormData } from "@/types/blog.types";
import { Save, Trash2, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

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
    isTrending: false,
  });

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
          isTrending: data.isTrending,
        });
      } catch (error) {
        console.error("Failed to load blog");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadBlog();
  }, [id]);

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

  if (loading) return <div className="p-10 text-center text-green-600 font-bold">Loading Data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Edit Post</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: The Form */}
        <form className="flex-1 space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Blog Title</label>
            <input
              type="text"
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Author</label>
              <input
                type="text"
                className="w-full text-black p-3 border border-gray-300 rounded-lg"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Niche</label>
              <input
                type="text"
                className="w-full text-black p-3 border border-gray-300 rounded-lg"
                value={formData.niche}
                onChange={(e) => setFormData({...formData, niche: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
            <textarea
              rows={15}
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>
        </form>

        {/* Right Side: Fixed Action Sidebar */}
        <div className="lg:w-72 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4">Post Settings</h3>
            
            <button
              onClick={handleUpdate}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all mb-3"
            >
              <Save size={18} /> Update Post
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-all"
            >
              <Trash2 size={18} /> Delete Post
            </button>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                   type="checkbox" 
                   className="accent-green-600"
                   checked={formData.isTrending} 
                   onChange={(e) => setFormData({...formData, isTrending: e.target.checked})}
                />
                <span className="text-sm font-semibold text-gray-600">Trending Post</span>
              </label>
            </div>
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
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700"
            >
              Continue Editing
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