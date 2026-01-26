import React from "react";
import Link from "next/link";
import { Blog } from "../../types/blog.types";
import Image from "next/image";
interface BlogCardProps {
  blog: Blog;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  // Logic for the first 50 words
  const truncateContent = (text: string) => {
    return text.split(" ").slice(0, 50).join(" ") + "...";
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
        <span className="text-xs font-semi-bold px-2 py-1 bg-green-100 text-green-700 rounded">
          {blog.niche}
        </span>
        <span className="text-xs text-gray-500">{blog.minuteRead} min read</span>
      </div>
      <h3 className="text-xl text-black font-bold uppercase mb-2 mt-4">{blog.title}</h3>
      <p className="text-gray-600 text-sm mb-4">
        {truncateContent(blog.content)}
      </p>
      <div className="flex justify-between items-center mt-auto">
        <span className="text-sm text-gray-500 font-medium">By {blog.author}</span>
        <Link
          href={`/admin/blog/${blog._id}`}
          className="text-green-600 text-sm font-medium hover:underline"
        >
          View More
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;