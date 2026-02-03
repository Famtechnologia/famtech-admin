"use client";

import React from "react";
import Link from "next/link";
import { Blog } from "../../types/blog.types";
import Image from "next/image";
import { Eye, Flame, User, Clock, ImageIcon } from "lucide-react";

interface BlogCardProps {
  blog: Blog;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {

  // 1. Logic to strip HTML tags before truncating
  const truncateContent = (html: string, limit: number = 120) => {
    if (!html) return "";
    // Remove HTML tags using Regex to prevent them showing as text
    const plainText = html.replace(/<[^>]*>/g, "");

    if (plainText.length <= limit) return plainText;
    return plainText.slice(0, limit).trim() + "...";
  };

  // 2. Logic to keep titles consistent
  const truncateTitle = (text: string, limit: number = 40) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit).trim() + "...";
  };

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-all p-4 bg-white flex flex-col h-full border-gray-100">
      {/* Cover Image */}
      <div className="relative w-full h-48 mb-4 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
        {blog.imageUrl ? (
          <Image
            src={blog.imageUrl}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // This shows if no image is provided
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <ImageIcon size={40} strokeWidth={1.5} />
            <span className="text-[10px] font-medium uppercase tracking-widest">No Preview Available</span>
          </div>
        )}
      </div>


      {/* Meta Header: Niche, Views, and Trending Badge */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg ">
            {blog.niche}
          </span>


          <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <Eye size={14} className="text-gray-400" /> {blog.views?.length || 0} views
          </span>

          {/* Automated Trending Badge based on 10+ views */}
          {blog.views?.length >= 10 && (
            <span className="flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
              <Flame size={14} />
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} /> {blog.minuteRead} min
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg text-gray-900 font-bold leading-tight mb-2 uppercase">
        {truncateTitle(blog.title)}
      </h3>

      {/* Clean Content Preview (No HTML tags visible) */}
      <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
        {truncateContent(blog.content)}
      </p>

      {/* Footer: Author and View Link */}
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-green-600" />
          </div>
          {blog.author}
        </div>

        <Link
          href={`/admin/blog/${blog._id}`}
          className="text-green-600 text-xs font-bold hover:text-green-700 transition-colors hover:underline px-3 py-1.5 rounded-lg"
        >
          View More
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;