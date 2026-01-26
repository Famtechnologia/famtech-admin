"use client";
import React, { useState, useEffect } from "react";
import { BlogFormData } from "@/types/blog.types";
import { createBlog } from "@/lib/api/blog";
import { X, Clock, Type, User, FolderOpen, Image as ImageIcon } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateBlogModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    niche: "",
    author: "",
    imageUrl: "",
    isTrending: false,
  });

  // Est. Reading Time Preview
  const [previewRead, setPreviewRead] = useState(0);
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).length;
    setPreviewRead(formData.content.length > 5 ? Math.ceil(words / 200) : 0);
  }, [formData.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBlog(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Creation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header - Using FamTech Green */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Type className="text-green-600" /> New Blog Post
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Blog Title</label>
            <input
              type="text"
              required
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
              placeholder="e.g. The Future of AgroTech in Nigeria"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Author */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                <User size={14} /> Author Name
              </label>
              <input
                type="text"
                required
                className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Author Name"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            {/* Niche */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                <FolderOpen size={14} /> Niche
              </label>
             <input
                type="text"
                required
                className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. AgroTech, News, Career"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <ImageIcon size={14} /> Cover Image URL
            </label>
            <input
              type="url"
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-gray-700">Content</label>
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Clock size={12} /> {previewRead} min read
              </span>
            </div>
            <textarea
              required
              rows={6}
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder="Start writing your insights here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Trending Toggle - Styled Green */}
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
            <input
              type="checkbox"
              id="trending-checkbox"
              className="w-5 h-5 accent-green-600 rounded cursor-pointer"
              checked={formData.isTrending}
              onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
            />
            <label htmlFor="trending-checkbox" className="text-sm font-bold text-green-800 cursor-pointer">
              Set as Trending Content
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-50 rounded-lg transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-200 disabled:bg-gray-300 disabled:shadow-none"
            >
              {loading ? "Publishing..." : "Publish Blog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlogModal;