"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getBlogById, deleteBlog } from "@/lib/api/blog";
import { Blog } from "@/types/blog.types";
import { ChevronLeft, Edit, Trash2, Clock, User, Tag, Settings } from "lucide-react";
import Link from "next/link";

const BlogDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await getBlogById(id as string);
        setBlog(data);
      } catch (error) {
        console.error("Failed to fetch blog:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBlog();
  }, [id]);

  

  if (loading) return <div className="p-10 text-center">Loading content...</div>;
  if (!blog) return <div className="p-10 text-center">Blog not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 lg:p-12 pb-20">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/admin/blog" className="flex items-center text-gray-600 hover:text-green-600 font-medium">
          <ChevronLeft size={20} /> Back to Blogs
        </Link>
    
        <div className="flex gap-3">
          <Link 
            href={`/admin/blog/${blog._id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold transition-all"
          >
            <Settings size={18} className="text-green-600" />
          </Link>
          
        </div>
      </div>

      {/* Hero Image */}
      {blog.imageUrl && (
        <div className="relative w-full h-[400px] mb-8 rounded-2xl overflow-hidden shadow-lg">
          <Image 
            src={blog.imageUrl} 
            alt={blog.title} 
            fill 
            priority
            className="object-cover" 
          />
        </div>
      )}

      {/* Meta Header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-4 text-sm  text-green-600">
          <span className="bg-green-100 px-3 py-1 rounded-full">{blog.niche}</span>
          {blog.isTrending && (
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full">🔥 Trending</span>
          )}
        </div>
        
        <h1 className="text-3xl md:text-5xl uppercase font-bold text-gray-900 ">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-100 text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <User size={18} className="text-green-600" /> {blog.author}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-green-600" /> {blog.minuteRead} min read
          </div>
        </div>
      </div>

      {/* Content Body */}
      <article className="prose prose-lg prose-green max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
        {blog.content}
      </article>
    </div>
  );
};

export default BlogDetailPage;