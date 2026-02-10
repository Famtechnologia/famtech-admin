"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getBlogById } from "@/lib/api/blog";
import { Blog } from "@/types/blog.types";
import { ChevronLeft, Clock, User, Settings, Eye, Flame } from "lucide-react";
import Link from "next/link";

const BlogDetailPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchBlog = async () => {
      if (hasFetched.current) return;
      try {
        const data = await getBlogById(id as string);
        setBlog(data);
        hasFetched.current = true;
      } catch (error) {
        console.error("Failed to fetch blog:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBlog();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-green-600 font-bold animate-pulse">Loading content...</div>;
  if (!blog) return <div className="p-10 text-center text-red-500">Blog not found.</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 md:p-8 lg:p-6 pb-20">
      
      {/* 1. Header Navigation */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/admin/blog" className="flex items-center text-gray-500 hover:text-green-600 font-medium transition-colors">
          <ChevronLeft size={20} /> Back to all posts
        </Link>

        <Link
          href={`/admin/blog/${blog._id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 text-gray-700 hover:text-green-700 font-semibold transition-all shadow-sm"
        >
          <Settings size={18} />
          <span>Edit Post</span>
        </Link>
      </div>

      {/* 2. Hero Image Section */}
      {blog.imageUrl && (
        <div className="relative w-full h-[300px] md:h-[500px] mb-12 rounded-2xl overflow-hidden shadow-md ring-1 ring-gray-100">
          <Image
            src={blog.imageUrl}
            alt={blog.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* 3. Article Metadata */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
           <span className="bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            {blog.niche}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-8 py-6 border-y border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Author</p>
              <p className="text-sm font-bold text-gray-800">{blog.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Read Time</p>
              <p className="text-sm font-bold text-gray-800">{blog.minuteRead} min</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Views</p>
              <p className="text-sm font-bold text-gray-800">{blog.views?.length || 0}</p>
            </div>
          </div>

          {blog.views?.length >= 10 && (
            <div className="ml-auto flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full ring-1 ring-orange-200">
              <Flame size={18} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-tighter">Trending Now</span>
            </div>
          )}
        </div>
      </header>

     
      {/* 
           used "tiptap" class to apply your globals.css (tables, quotes, tasks).
           used "prose" to handle basic typography and spacing.
      */}
      <article
        className="tiptap prose prose-lg md:prose-xl max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

    </div>
  );
};

export default BlogDetailPage;