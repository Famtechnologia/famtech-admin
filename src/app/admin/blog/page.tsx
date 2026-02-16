"use client";

import { useEffect, useState } from "react";
import { getAllBlogs } from "@/lib/api/blog";
import { Blog } from "@/types/blog.types";
import BlogCard from "@/components/blog/BlogCard";
import { Search, Newspaper, XCircle, Loader2, ChevronDown } from "lucide-react";

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const BLOGS_PER_PAGE = 6;

  const loadData = async (query = "", page = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const response = await getAllBlogs({
        search: query,
        page,
        limit: BLOGS_PER_PAGE
      });

      const newBlogs = response.blogs || [];
      const totalPages = response.totalPages || 1;

      // Handle Pagination logic
      setHasMore(page < totalPages);

      if (append) {
        setBlogs((prev) => [...prev, ...newBlogs]);
      } else {
        setBlogs(newBlogs);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      setBlogs([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchTrigger = () => {
    setCurrentPage(1);
    setActiveSearch(searchQuery);
    loadData(searchQuery, 1, false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setCurrentPage(1);
    loadData("", 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadData(activeSearch, nextPage, true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 pb-20 text-black">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 font-semibold uppercase tracking-widest text-sm">
            <Newspaper size={18} /> FamTech Insights
          </div>
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Blog Management
          </h1>
          <p className="text-gray-500 max-w-2xl font-medium">
            Manage your AgroTech insights and community stories.
          </p>
        </div>
      </div>

      {/* --- Search Bar --- */}
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mb-10 flex items-center gap-2 max-w-2xl">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search blogs by title..."
            className="w-full pl-3 pr-4 py-1 md:py-3 bg-transparent outline-none text-black font-medium text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
          />
        </div>
        <button
          onClick={handleSearchTrigger}
          disabled={isLoading}
          className="bg-green-700 text-white px-3 md:px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
        </button>
      </div>

      {/* --- Main Grid --- */}
      <div className="flex justify-between items-center mb-6 h-8">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {activeSearch ? `Results for "${activeSearch}"` : "All Articles"}
          {!isLoading && (
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">{blogs.length}</span>
          )}
        </h2>
        {activeSearch && !isLoading && (
          <button
            onClick={clearSearch}
            className="text-sm text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
          >
            <XCircle size={14} /> Clear Search
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-80 bg-gray-50 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Search size={48} className="text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-800">No Articles Found</h3>
          <p className="text-gray-500 text-center mt-2 max-w-xs">
            We couldn&apos;t find any articles matching &quot;{activeSearch}&quot;.
          </p>
          <button onClick={clearSearch} className="mt-4 text-green-600 font-bold hover:underline">
            View all blogs
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => <BlogCard key={blog._id} blog={blog} />)}
          </div>

          {hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                {isLoadingMore ? (
                  <Loader2 className="animate-spin text-green-600" size={20} />
                ) : (
                  <>
                    Load More
                    <ChevronDown size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}