"use client";
import { useEffect, useState } from "react";
import { getAllBlogs } from "@/lib/api/blog";
import { Blog } from "@/types/blog.types";
import BlogCard from "@/components/blog/BlogCard";
import CreateBlogModal from "@/components/blog/CreateBlogModal";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 1. Added loading state

  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllBlogs();
      setBlogs(data);
    } catch (error) {
      console.error("Failed to load blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12 pt-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Blogs</h1>
          {/* 2. Added Subtext */}
          <p className="text-gray-500 mt-1">
            Manage your AgroTech insights, news, and trending articles for the FamTech community.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100"
        >
          <Plus size={20} /> Create Blog
        </button>
      </div>

    {/* 3. Conditional Rendering: Loading -> Empty -> Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <FileText size={48} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No blogs found</h3>
          <p className="text-gray-500 max-w-xs text-center mt-2">
            It looks like you haven&apos;t published any articles yet. Start by creating your first post!
          </p>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="mt-6 text-green-600 font-bold hover:underline"
          >
            Create your first blog post &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}

      {/* Create Modal Overlay */}
      {isModalOpen && (
        <CreateBlogModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            loadBlogs(); // Re-fetch data after creation
          }} 
        />
      )}
    </div>
  );
}