"use client";

import { useEffect, useState } from "react";
import { getAllBlogs } from "@/lib/api/blog";
import { Blog } from "@/types/blog.types";
import BlogCard from "@/components/blog/BlogCard";
import CreateBlogModal from "@/components/blog/CreateBlogModal";
import { Search, Flame, Newspaper, Plus, XCircle, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [trendingBlogs, setTrendingBlogs] = useState<Blog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const BLOGS_PER_PAGE = 6; // Matching backend limit

  const loadData = async (query = "", page = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      // 1. Fetch main blog list with pagination
      const mainData = await getAllBlogs({
        search: query,
        page,
        limit: BLOGS_PER_PAGE
      });

      // 2. Handle Pagination logic
      if (mainData.length < BLOGS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (append) {
        setBlogs((prev) => [...prev, ...mainData]);
      } else {
        setBlogs(mainData);
        // 3. Fetch top 3 trending blogs for sidebar
        const trendingData = await getAllBlogs({ isTrending: 'true', limit: 3 });
        setTrendingBlogs(trendingData);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
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
    <div className="p-10 h-screen bg-gray-50 relative">
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
        >
          <Plus size={20} /> Create Blog
        </button>
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
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search className="text-white" size={18} />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* LEFT COLUMN: Main Feed (2/3) */}
        <div className="lg:w-2/3">
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
                className="text-sm text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded-lg"
              >
                <XCircle size={14} /> Clear Search
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-80 bg-gray-50 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Search size={48} className="text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-800">Search input not found</h3>
              <p className="text-gray-500 text-center mt-2 max-w-xs">
                We couldn&apos;t find any articles matching &quot;{activeSearch}&quot;.
              </p>
              <button onClick={clearSearch} className="mt-4 text-green-600 font-bold hover:underline">
                View all blogs
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {blogs.map(blog => <BlogCard key={blog._id} blog={blog} />)}
              </div>

              {/* Pagination Controller */}
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

        {/* RIGHT COLUMN: Trending Sidebar (1/3) */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Flame className="text-orange-500" size={22} fill="currentColor" /> Trending Now
            </h2>

            <div className="space-y-6">
              {isLoading ? (
                // Skeleton loaders for 4 items
                [1, 2, 3, 4].map(n => <div key={n} className="h-20 bg-gray-50 animate-pulse rounded-2xl" />)
              ) : trendingBlogs.length === 0 ? (
                // Fallback text if no trending posts exist
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 font-medium px-4">
                    No posts are currently marked as trending.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 px-4">
                  Create a post to "Mark as Trending" to see it here.
                  </p>
                </div>
              ) : (
                // Show up to 4 trending posts
                trendingBlogs.map(blog => (
                  <Link
                    key={blog._id}
                    href={`/admin/blog/${blog._id}`}
                    className="group block border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-20 h-20 relative flex-shrink-0">
                        <img
                          src={blog.imageUrl}
                          className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300 shadow-sm"
                          alt={blog.title}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest block">{blog.niche}</span>
                        <h4 className="text-sm font-extrabold text-gray-800 line-clamp-2 leading-snug group-hover:text-green-600 transition-colors">
                          {blog.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium">By {blog.author} • {blog.minuteRead} min read</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CreateBlogModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { setIsModalOpen(false); loadData(); }}
        />
      )}
    </div>
  );
}