import React from "react";
import Link from "next/link";
import { Blog } from "../../types/blog.types";
import Image from "next/image";
import { User } from "lucide-react";
interface BlogCardProps {
  blog: Blog;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  // Logic for the first 50 words
  const truncateContent = (text: string, limit: number = 200) => {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + "...";
};
  const truncateTitle = (text: string, limit: number = 20) => {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + "...";
};

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 bg-white">
      {blog.imageUrl && (
        <Image
          src={blog.imageUrl}
          alt={blog.title}
          width={500}
          height={300}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}
      <div className="flex justify-between items-center mb-2">
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-semi-bold px-2 py-1 bg-green-100 text-green-700 rounded">
          {blog.niche}
        </span>
        {blog.isTrending && (
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs">🔥 Trending</span>
          )}
        </div>
        <span className="text-xs text-gray-500">{blog.minuteRead} min read</span>
      </div>
      <h3 className="text-xl text-black font-bold uppercase mb-2 mt-4">{truncateTitle(blog.title)}</h3>
      <p className="text-gray-600 text-sm mb-4">
        {truncateContent(blog.content)}
      </p>
      <div className="flex justify-between items-center mt-auto">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <User size={18} className="text-green-600" /> {blog.author}
        </div>
        <Link
          href={`/admin/blog/${blog._id}`}
          className="text-green-600 text-xs md:text-sm font-medium hover:underline"
        >
          View More
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;