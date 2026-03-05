"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Blog, Author } from "@/types/blog.types";
import StatusBadge from "./StatusBadge";

const NICHES = [
  "All Topic",
  "Agro",
  "Agrotech",
  "Poultry",
  "Livestock",
  "Crop Science",
  "Sustainability",
  "Farm Machinery",
  "Fishery",
  "Agribusiness",
  "Food Security",
];

interface BlogTableProps {
  blogs: Blog[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onTopicFilter: (topic: string) => void;
  onCreateBlog: () => void;
}

function getAuthorName(author: Author | string): string {
  if (typeof author === "string") return "Unknown";
  return `${author.firstName} ${author.lastName}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogTable({
  blogs,
  totalResults,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  onTopicFilter,
  onCreateBlog,
}: BlogTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All Topic");
  const [topicOpen, setTopicOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    onTopicFilter(topic);
    setTopicOpen(false);
  };

  const limit = 12;
  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, totalResults);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Table Header */}
      <div className=" flex flex-col md:flex-row space-y-4 items-start md:items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          Recent Blog Post
        </h2>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 space-y-2 sm:space-y-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search post"
              value={searchValue}
              onChange={handleSearch}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-52"
            />
          </div>

          {/* Topic Filter */}
          <div className="relative ">
            <button
              onClick={() => setTopicOpen(!topicOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors min-w-[120px] justify-between"
            >
              {selectedTopic}
              <ChevronRight
                className={`w-4 h-4 transition-transform ${topicOpen ? "rotate-90" : ""}`}
              />
            </button>
            {topicOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 py-1">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    onClick={() => handleTopicSelect(niche)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedTopic === niche
                        ? "text-green-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto blog-table-scroll">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Title", "Status", "Author", "Views", "Eng. Rate"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-semibold text-gray-500  tracking-wide px-6 py-3"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {blogs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No blog posts found
                </td>
              </tr>
            ) : (
              blogs.map((blog) => {
                const engRate =
                  blog.views > 0
                    ? ((blog.views / totalResults) * 100).toFixed(1) + "%"
                    : "--";

                return (
                  <tr
                    key={blog._id}
                    onClick={() => router.push(`/admin/blog/${blog._id}`)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    {/* Title */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 max-w-[220px] leading-snug">
                        {blog.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {blog.status === "approved"
                          ? `Pub: ${formatDate(blog.createdAt)}`
                          : blog.status === "in-review"
                          ? `Draft: ${formatDate(blog.createdAt)}`
                          : "Awaiting Approval"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={blog.status ?? "pending"} />
                    </td>

                    {/* Author */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800 font-medium">
                        {getAuthorName(blog.author)}
                      </p>
                      <p className="text-xs text-gray-400">Copy Writer</p>
                    </td>

                    {/* Views */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {blog.views > 0
                        ? blog.views.toLocaleString()
                        : "--"}
                    </td>

                    {/* Eng. Rate */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {blog.views > 0 ? engRate : "--"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 md:px-6 py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">
            {from} to {to}
          </span>{" "}
          of{" "}
          <span className="font-medium text-gray-700">
            {totalResults.toLocaleString()}
          </span>{" "}
          results
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}