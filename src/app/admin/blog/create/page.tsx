"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBlog } from "@/lib/api/blog";
import Tiptap from "@/components/blog/Editor"; // Import your new shared component
import { 
  User, 
  FolderOpen, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

export default function CreateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [previewRead, setPreviewRead] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    niche: "",
    author: "",
    imageUrl: "",
  });

  // Calculate read time whenever content changes
  const handleContentChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
    
    // Simple regex to strip HTML tags and count words
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    setPreviewRead(words > 0 ? Math.ceil(words / 200) : 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || formData.content === "<p></p>") {
      setError("Please add some content to your blog post.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createBlog(formData);
      setShowSuccessToast(true);
      setTimeout(() => router.push("/admin/blog"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish blog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-black">
      {/* Header */}
      <div className="bg-white border-b-gray-400 top-0 z-20 px-4 py-4 sm:px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Create New Post</h1>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
            Discard
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-all flex items-center gap-2"
          >
            {loading ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Title and The New Tiptap Editor */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <input
              type="text"
              placeholder="Post Title..."
              className="w-full p-6 text-2xl font-semibold text-black border-b border-gray-100 outline-none placeholder:text-gray-300"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            
            <Tiptap 
                initialContent={formData.content} 
                onChange={handleContentChange} 
            />

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
               <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {previewRead} min read
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">Post Details</h3>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Author</label>
              <div className="flex items-center gap-2 mt-1 border rounded-lg p-2 bg-gray-50">
                <User size={16} className="text-gray-400" />
                <input 
                  className="bg-transparent outline-none w-full text-sm text-black" 
                  placeholder="Famtech Team"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Niche</label>
              <div className="flex items-center gap-2 mt-1 border rounded-lg p-2 bg-gray-50">
                <FolderOpen size={16} className="text-gray-400" />
                <input 
                  className="bg-transparent outline-none w-full text-sm text-black" 
                  placeholder="e.g. AgroTech"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <ImageIcon size={18} /> Cover Image
            </h3>
            <input 
                type="url"
                placeholder="Paste Image URL..."
                className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-green-500 text-black"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
            {formData.imageUrl && (
                <div className="rounded-lg overflow-hidden border mt-2">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-40 object-cover" />
                </div>
            )}
          </div>
        </div>
      </div>

      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[70] bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={20} />
          <span className="font-bold">Published Successfully!</span>
        </div>
      )}
    </div>
  );
}