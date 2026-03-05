"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, BookOpen, Eye, Clock, Users, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllBlogs, getBlogStats } from "@/lib/api/blog";
import { Blog, BlogStats } from "@/types/blog.types";
import StatCard from "@/components/blog/StatCard";
import BlogTable from "@/components/blog/BlogTable";

const LIMIT = 12;

export default function BlogPerformancePage() {
  const router = useRouter();

  // Stats state
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Table state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All Topic");

  // ── Fetch stats ──────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await getBlogStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch blog stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ── Fetch blogs
  const fetchBlogs = useCallback(async () => {
    try {
      setTableLoading(true);
      const params: Record<string, any> = {
        page: currentPage,
        limit: LIMIT,
      };
      if (search) params.search = search;
      if (topic !== "All Topic") params.niche = topic;

      const data = await getAllBlogs(params);
      setBlogs(data.blogs);
      setTotalPages(data.totalPages);
      setTotalResults(data.totalResults ?? data.blogs.length);
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, search, topic]);

  useEffect(() => {
    const timer = setTimeout(fetchBlogs, 300);
    return () => clearTimeout(timer);
  }, [fetchBlogs]);

  // Reset to page 1 on filter change
  const handleSearch = (query: string) => {
    setSearch(query);
    setCurrentPage(1);
  };

  const handleTopicFilter = (t: string) => {
    setTopic(t);
    setCurrentPage(1);
  };

  // ── Stat cards config ──
  const statCards = stats
    ? [
        {
          title: "Total Posts",
          value: stats.totalPosts,
          change: stats.changes.posts,
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          title: "Total Views",
          value:
            stats.totalViews >= 1000
              ? `${(stats.totalViews / 1000).toFixed(1)}k`
              : stats.totalViews,
          change: stats.changes.views,
          icon: <Eye className="w-4 h-4" />,
        },
        {
          title: "Avg. Read Time",
          value: `${stats.avgReadTime}m`,
          change: stats.changes.avgReadTime,
          icon: <Clock className="w-4 h-4" />,
        },
        {
          title: "Leads Generated",
          value: stats.leadsGenerated,
          change: stats.changes.leads,
          icon: <Users className="w-4 h-4" />,
        },
        {
          title: "Conversion Rate",
          value: `${stats.conversionRate}%`,
          change: stats.changes.conversionRate,
          icon: <Target className="w-4 h-4" />,
        },
      ]
    : [];

  return (
    <div className=" bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-6 md:p-8 pb-20 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row space-y-6 items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Blog Performance
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor your content impact, and engagement.
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/blog/create")}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Blog
          </button>
        </div>

        {/* ── Stats Cards ── */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-3 md:p-5 h-28 animate-pulse"
              >
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
                <div className="h-6 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5  gap-2 md:gap-4">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>
        )}

        {/* ── Blog Table ── */}
        {tableLoading && blogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <BlogTable
            blogs={blogs}
            totalResults={totalResults}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onSearch={handleSearch}
            onTopicFilter={handleTopicFilter}
            onCreateBlog={() =>
              router.push("/admin/blog/create")
            }
          />
        )}
      </div>
    </div>
  );
}