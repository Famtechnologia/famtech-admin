"use client";

import React from "react";
import Link from "next/link";
import { Blog, Author } from "../../types/blog.types";
import Image from "next/image";
import { Eye, Flame, User, Clock, ImageIcon } from "lucide-react";
import { getBlogCover } from "@/lib/utils/blogUtils"; 

interface BlogCardProps {
  blog: Blog;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
 
  const truncateContent = (html: string, limit: number = 120): string => {
    if (!html) return "";
    const plainText = html.replace(/<[^>]*>/g, "");
    if (plainText.length <= limit) return plainText;
    return plainText.slice(0, limit).trim() + "...";
  };

  // 2. Logic to keep titles consistent
  const truncateTitle = (text: string, limit: number = 40): string => {
    if (!text) return "";
    if (text.length <= limit) return text;
    return text.slice(0, limit).trim() + "...";
  };

  
  // Resolve Image: Uses the central utility that handles arrays and niche fallbacks
  const displayImage = getBlogCover(blog);

  // Resolve Author Safely: Fixed null/undefined check for populated objects
  const resolveAuthor = () => {
    const author = blog.author;
    if (author && typeof author === 'object' && 'firstName' in author) {
      const { firstName, lastName } = author as Author;
      const name = `${firstName || ""} ${lastName || ""}`.trim();
      return name || "Famtech Team";
    }
    if (typeof author === 'string' && author.trim() !== "") {
      return author;
    }
    return "Famtech Team";
  };

  const displayAuthor = resolveAuthor();

  // Resolve Views & Trending
  const viewCount = blog.views || 0;
  const isTrending = viewCount >= 10 || blog.isTrending;

  return (
    <div className="border rounded-2xl shadow-sm hover:shadow-md transition-all p-4 bg-white flex flex-col h-full border-gray-100 group">
      {/* Cover Image */}
      <div className="relative w-full h-48 mb-4 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={blog.title}
            fill 
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <ImageIcon size={40} strokeWidth={1.5} />
            <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">No Image</span>
          </div>
        )}
      </div>

      {/* Meta Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-lg">
            {blog.niche || "General"}
          </span>

          <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <Eye size={14} className="text-gray-400" /> {viewCount}
          </span>

          {isTrending && (
            <span className="flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">
              <Flame size={14} className="animate-pulse" />
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} /> {blog.minuteRead || 1} min
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg text-gray-900 font-bold leading-tight mb-2 uppercase">
        {truncateTitle(blog.title)}
      </h3>

      {/* Content Preview */}
      <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
        {truncateContent(blog.content)}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-green-600" />
          </div>
          <span className="truncate max-w-[120px]">{displayAuthor}</span>
        </div>

        <Link
          href={`/admin/blog/${blog._id}`}
          className="text-green-700 text-xs font-bold hover:bg-green-50 px-3 py-2 rounded-lg transition-colors"
        >
          View More
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;