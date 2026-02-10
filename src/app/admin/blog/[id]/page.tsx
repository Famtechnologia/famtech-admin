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
      // 2. If already fetched, exit the function early
      if (hasFetched.current) return;

      try {
        const data = await getBlogById(id as string);
        setBlog(data);
        // 3. Set the lock to true after the first successful call
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
      {/* Navigation & Actions */}
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

      {/* Hero Image */}
      {blog.imageUrl && (
        <div className="relative w-full h-[450px] mb-10 rounded-lg overflow-hidden ring-1 ring-gray-200">
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
      <header className="space-y-6 mb-12">

        <span className="bg-green-100 text-green-600 lowercase px-3 py-1 rounded-lg">{blog.niche}</span>

        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mt-3 uppercase ">
          {blog.title}
        </h1>

        <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold">Author</p>
              <p className="text-sm font-bold text-gray-800">{blog.author}</p>

            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold">Reading time</p>
              <p className="text-sm font-bold text-gray-800">{blog.minuteRead} min read</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
            <Eye size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400  font-semibold">Views</p>
            <p className="text-sm font-bold text-gray-800">{blog.views?.length || 0}</p>

          </div>


          {blog.views?.length >= 10 && (
            <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
              <Flame size={20} />
            </span>
          )}
        </div>
      </header>

      {/* --- TIPTAP CONTENT RENDERER --- */}
      <article
        className="prose prose-lg md:prose-xl prose-green max-w-none text-gray-800 leading-relaxed 
             prose-headings:font-bold prose-headings:text-gray-900
             prose-p:mb-6 prose-li:my-1
             prose-img:rounded-2xl prose-img:shadow-lg
             /* Add these link styles */
             prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
             /* Fix for the green bar (Horizontal Rule) */
             prose-hr:border-t-2 prose-hr:border-gray-200 prose-hr:my-8"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
};

export default BlogDetailPage;