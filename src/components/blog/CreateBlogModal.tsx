"use client";
import React, { useState, useEffect } from "react";
import { BlogFormData } from "@/types/blog.types";
import { createBlog } from "@/lib/api/blog";
import { X, Clock, Type, User, FolderOpen, Image as ImageIcon, AlertCircle, CheckCircle2, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateBlogModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    niche: "",
    author: "",
    imageUrl: "",
    isTrending: false,
  });


  const [previewRead, setPreviewRead] = useState(0);
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    setPreviewRead(words > 0 ? Math.ceil(words / 200) : 0);
  }, [formData.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createBlog(formData);
      setShowSuccessToast(true);
      setTimeout(() => {
        onSuccess();
        router.push("/admin/blog");
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ensure your backend is running on http://localhost:4000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[70] bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold">Blog Published Successfully!</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col relative border border-gray-200">

        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <Type className="text-green-600" /> New Blog Post
            </h2>

          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Blog Title</label>
            <input
              type="text"
              required
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g. 5 Ways IoT is Transforming Nigerian Poultry"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                <User size={14} /> Author Name
              </label>
              <input
                type="text"
                required
                className="w-full text-black p-3 border border-gray-300 rounded-lg"
                placeholder="Your Name"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                <FolderOpen size={14} /> Niche
              </label>
              <input
                type="text"
                required
                className="w-full text-black p-3 border border-gray-300 rounded-lg"
                placeholder="e.g. AgroTech, Career, news"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              />
            </div>
          </div>

          {/* Image URL & Live Preview Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <ImageIcon size={14} className="text-green-600" /> Cover Image URL
            </label>
            <input
              type="url"
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />

            {/* The Preview Logic */}
            {formData.imageUrl && formData.imageUrl.startsWith("http") && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 mt-2 shadow-inner">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("Image loaded successfully")}
                  onError={(e) => {
                    console.error("Image failed to load");
                    e.currentTarget.src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                  Live Preview
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-gray-700">Content</label>
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {previewRead} min read
              </span>
            </div>
            <textarea
              required
              rows={5}
              className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder="Start sharing your Agrotech story here. Use paragraphs for better readability..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
            <input
              type="checkbox"
              id="trending-checkbox"
              className="w-5 h-5 accent-green-600 rounded cursor-pointer"
              checked={formData.isTrending}
              onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
            />
            <label htmlFor="trending-checkbox" className="text-sm font-bold text-green-800 cursor-pointer">
              Mark as Trending Content
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-50 rounded-lg transition-all">
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2 shadow-lg shadow-green-100 transition-all"
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