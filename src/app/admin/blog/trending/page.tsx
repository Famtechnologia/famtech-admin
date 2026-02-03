"use client";
import React, { useEffect, useState } from "react";
import { getTrendingBlogs } from "@/lib/api/blog";
import { Blog } from "@/types/blog.types";
import { Flame, Eye, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

const TrendingPage = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const data = await getTrendingBlogs();
                setBlogs(data);
            } catch (error) {
                console.error("Failed to fetch trending blogs");
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, []);

    const truncateContent = (html: string, limit: number = 120) => {
        if (!html) return "";
        // Remove HTML tags using Regex to prevent them showing as text
        const plainText = html.replace(/<[^>]*>/g, "");

        if (plainText.length <= limit) return plainText;
        return plainText.slice(0, limit).trim() + "...";
    };

    if (loading) return <div className="p-10 text-center text-green-600 font-bold animate-pulse">Loading Trends...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 mt-6 md:p-10">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <TrendingUp className="text-green-500" size={36} /> Trending Insights
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                    Trending stories with high engagement and reader interest.
                </p>
            </header>

            {blogs.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
                    <p className="text-gray-400 font-bold italic text-lg">No trending post.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map((blog) => (
                        <div key={blog._id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
                            <div className="relative h-48 w-full">
                                <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 shadow-lg">
                                    <Flame size={16} fill="white" />Trending
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg w-fit mb-2 ">
                                    {blog.niche}
                                </span>
                                <h2 className="text-xl uppercase font-bold text-gray-900 mb-4 line-clamp-2">{blog.title}</h2>
                                {/* Clean Content Preview (No HTML tags visible) */}
                                <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
                                    {truncateContent(blog.content)}
                                </p>
                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1 text-xs font-bold">
                                            <Eye size={14} className="text-orange-400" /> {blog.views}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-bold">
                                            <Clock size={14} className="text-green-600" /> {blog.minuteRead}m Read
                                        </span>
                                    </div>
                                    <Link href={`/admin/blog/${blog._id}`} className="text-sm font-semibold text-green-600 hover:underline">
                                        view
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrendingPage;