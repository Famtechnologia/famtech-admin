"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getBlogById, incrementBlogViews } from "@/lib/api/blog";
import { Blog, Author } from "@/types/blog.types";
import { getBlogCover } from "@/lib/utils/blogUtils"; 
import { ChevronLeft, Clock, User, Settings, Eye, Flame } from "lucide-react";
import Link from "next/link";

const BlogDetailPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchBlogData = async () => {
      if (hasFetched.current || !id) return;
      try {
        const data = await getBlogById(id as string);
        setBlog(data);
        hasFetched.current = true;

        // View Increment Logic
        const viewedKey = `viewed_blog_${id}`;
        if (!sessionStorage.getItem(viewedKey)) {
          try {
            await incrementBlogViews(id as string);
            sessionStorage.setItem(viewedKey, "true");
          } catch (vError) {
            console.warn("View increment blocked, but article loaded.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-green-600 font-bold animate-pulse">Loading content...</div>;
  if (!blog) return <div className="p-10 text-center text-red-500">Blog not found.</div>;

  
  // 1. Author Resolution 
  const getAuthorDisplay = () => {
    // If blog.author is null or undefined, return fallback immediately
    if (!blog.author) return "Famtech Team";

    const author = blog.author;

    // Check if it's the populated Author object
    if (typeof author === 'object' && 'firstName' in author) {
      const { firstName, lastName } = author as Author;
      
      // Ensure firstName exists and isn't just an empty string
      if (!firstName && !lastName) return "Famtech Team";
      
      return `${firstName || ""} ${lastName || ""}`.trim();
    }

    // If it's a string (the ID), return it or the fallback
    return typeof author === 'string' && author.trim() !== "" 
      ? "Famtech Admin" 
      : "Famtech Team";
  };

  const authorName = getAuthorDisplay();

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 md:p-8 lg:p-6 pb-20 text-black">

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
      <div className="relative w-full h-[300px] md:h-[500px] mb-12 rounded-2xl overflow-hidden shadow-md ring-1 ring-gray-100">
        <Image
          src={getBlogCover(blog)} 
          alt={blog.title}
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* 3. Article Metadata */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            {blog.niche || "Insights"}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-8 py-6 border-y border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Author</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{authorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Read Time</p>
              <p className="text-sm font-bold text-gray-800">{blog.minuteRead || 1} min</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 border border-purple-100">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Views</p>
              <p className="text-sm font-bold text-gray-800">{blog.views || 0}</p>
            </div>
          </div>

          {(blog.views >= 10 || blog.isTrending) && (
            <div className="md:ml-auto flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full ring-1 ring-orange-200">
              <Flame size={18} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-tighter">Trending Now</span>
            </div>
          )}
        </div>
      </header>

      {/* 4. Content */}
      <article
        className="tiptap prose prose-lg md:prose-xl max-w-none text-gray-800 prose-headings:text-gray-900 prose-p:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* 5. Additional Images Gallery */}
      {blog.blogImages && blog.blogImages.length > 1 && (
        <div className="mt-16 pt-8 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-600 tracking-widest mb-6">Article Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {blog.blogImages.slice(1).map((img, idx) => (
              <div key={img.fileId || idx} className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <Image
                  src={img.url}
                  alt={`Gallery ${idx + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetailPage;