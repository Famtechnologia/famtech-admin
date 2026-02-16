"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBlog } from "@/lib/api/blog";
import Tiptap from "@/components/blog/Editor";
import {
  FolderOpen,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  X
} from "lucide-react";

const NICHES = [
  'Agro', 'Agrotech', 'Poultry', 'Livestock', 'Crop Science',
  'Sustainability', 'Farm Machinery', 'Fishery', 'Agribusiness', 'Food Security'
];

export default function CreateBlogPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [previewRead, setPreviewRead] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    niche: "Agro",
  });

  // State for image previews (local blobs) and actual files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleContentChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    setPreviewRead(words > 0 ? Math.ceil(words / 200) : 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
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
      // Use FormData 
      const data = new FormData();
      data.append("title", formData.title);
      data.append("content", formData.content);
      data.append("niche", formData.niche);

      // Append files as 'blogImages' to match your backend multer config
      selectedFiles.forEach((file) => {
        data.append("blogImages", file);
      });

      await createBlog(data);

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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-4 sm:px-8 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Create New Post</h1>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all">
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
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm animate-pulse">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <input
              type="text"
              placeholder="Post Title..."
              className="w-full p-6 text-3xl font-bold text-black border-b border-gray-100 outline-none placeholder:text-gray-300"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <Tiptap
              initialContent={formData.content}
              onChange={handleContentChange}
            />

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-widest">
                <Clock size={14} /> {previewRead} min read
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 text-sm uppercase tracking-wider">Post Details</h3>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Niche</label>
              <div className="flex items-center gap-2 border rounded-lg p-2 bg-gray-50">
                <FolderOpen size={16} className="text-gray-400" />
                <select
                  className="bg-transparent outline-none w-full text-sm text-black font-medium cursor-pointer"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                >
                  {NICHES.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
              <ImageIcon size={18} className="text-green-600" /> blog images
            </h3>

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <div className="grid grid-cols-2 gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border aspect-square">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg aspect-square flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-600 hover:border-green-600 hover:bg-green-50 transition-all"
              >
                <Plus size={20} />
                <span className="text-[10px] font-bold uppercase">Add Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[70] bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-green-500 p-1 rounded-full">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <span className="font-bold">Published Successfully!</span>
        </div>
      )}
    </div>
  );
}