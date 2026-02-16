"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlogById, updateBlog, deleteBlog, deleteBlogImages } from "@/lib/api/blog";
import { BlogFormData, RecordImage } from "@/types/blog.types";
import { Save, Trash2, ArrowLeft, CheckCircle, AlertTriangle, ImageIcon, X, Plus } from "lucide-react";
import Tiptap from "@/components/blog/Editor";

const NICHES = [
  'Agro', 'Agrotech', 'Poultry', 'Livestock', 'Crop Science', 
  'Sustainability', 'Farm Machinery', 'Fishery', 'Agribusiness', 'Food Security'
];

const EditBlogPage = () => {
  const params = useParams();
  const id = params?.id as string; 
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    niche: "Agro",
  });
  
  const [existingImages, setExistingImages] = useState<RecordImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const loadBlog = async () => {
      if (!id) return;
      try {
        const data = await getBlogById(id);
        setFormData({
          title: data.title || "",
          content: data.content || "",
          niche: data.niche || "Agro",
        });
        setExistingImages(data.blogImages || []);
      } catch (error) {
        console.error("Failed to load blog:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (fileId: string) => {
    if (!window.confirm("Delete this image from the cloud?")) return;
    try {
      await deleteBlogImages(id, [fileId]);
      setExistingImages(prev => prev.filter(img => img.fileId !== fileId));
    } catch (error) {
      alert("Failed to delete image.");
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("content", formData.content);
      data.append("niche", formData.niche);
      
      newFiles.forEach((file) => {
        data.append("blogImages", file);
      });

      await updateBlog(id, data);
      setShowSuccessModal(true);
    } catch (error) {
      alert("Update failed. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteBlog(id);
      router.push("/admin/blog");
    } catch (error) {
      alert("Delete failed.");
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold animate-pulse text-black">Loading Blog Data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-20 text-black">
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
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">Blog Title</label>
              <input
                type="text"
                className="w-full text-2xl font-bold text-black mt-1 outline-none placeholder:text-gray-300"
                value={formData.title}
                placeholder="Enter title..."
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <Tiptap 
              initialContent={formData.content} 
              onChange={(html) => setFormData({ ...formData, content: html })} 
            />
          </div>

          {/* Image Management */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-green-600" /> Manage Images
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImages.map((img) => (
                <div key={img.fileId} className="relative group aspect-square rounded-xl overflow-hidden border">
                  <img src={img.url} className="w-full h-full object-cover" alt="Blog" />
                  <button 
                    onClick={() => handleDeleteExistingImage(img.fileId)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white p-1 text-center">Existing</div>
                </div>
              ))}

              {previews.map((src, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-green-200">
                  <img src={src} className="w-full h-full object-cover" alt="New upload" />
                  <button 
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 bg-gray-800 text-white p-1.5 rounded-full"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-[8px] text-white p-1 text-center tracking-widest font-bold">NEW</div>
                </div>
              ))}

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl aspect-square flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-600 hover:border-green-600 hover:bg-green-50 transition-all"
              >
                <Plus size={24} />
                <span className="text-[10px] font-bold uppercase">Upload</span>
              </button>
            </div>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Niche</label>
            <select 
              className="w-full text-black p-2 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium"
              value={formData.niche}
              onChange={(e) => setFormData({...formData, niche: e.target.value})}
            >
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Actions</h3>
            <button
              onClick={handleUpdate}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all mb-3 disabled:bg-gray-300"
            >
              <Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}
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

      {/* Success Modal */}
      {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-black">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Updated!</h2>
              <p className="text-gray-500 mb-6">Your changes have been saved successfully.</p>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-green-600 mb-3 text-white font-bold py-3 rounded-xl">Continue Editing</button>
              <button onClick={() => router.push("/admin/blog")} className="w-full bg-gray-600 text-white font-bold py-3 rounded-xl">Back to Posts</button>
            </div>
          </div>
      )}
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-black">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Post?</h2>
            <p className="text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBlogPage;