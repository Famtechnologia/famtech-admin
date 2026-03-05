"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getBlogById, incrementBlogViews, updateBlogStatus, clearBlogComment } from "@/lib/api/blog";
import { Blog, Author } from "@/types/blog.types";
import { getBlogCover } from "@/lib/utils/blogUtils";
import { ChevronLeft, Clock, User, Settings, Eye, Flame, CheckCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/blog/StatusBadge";
import ReviewModal from "@/components/blog/ReviewModal";

const BlogDetailPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const hasFetched = useRef(false);
  const [commentDismissed, setCommentDismissed] = useState(false);

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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAccept = async () => {
    if (!blog) return;
    try {
      setActionLoading(true);
      const { blog: updated } = await updateBlogStatus(blog._id, "approved");
      setBlog(updated);
      showToast("Blog approved and published successfully.", "success");
    } catch {
      showToast("Failed to update status. Try again.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendForReview = async (comment: string) => {
    if (!blog) return;
    try {
      setActionLoading(true);
      const { blog: updated } = await updateBlogStatus(blog._id, "in-review", comment);
      setBlog(updated);
      setReviewModalOpen(false);
      showToast("Feedback sent to the author.", "success");
    } catch {
      showToast("Failed to send feedback. Try again.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Clears the comment without changing the status
  const handleClearComment = async () => {
    if (!blog) return;
    try {
      setActionLoading(true);
      const { blog: updated } = await clearBlogComment(blog._id);
      setBlog(updated);
      showToast("Comment cleared.", "success");
    } catch {
      showToast("Failed to clear comment.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="p-10 text-center text-green-600 font-bold animate-pulse">Loading content...</div>
  );
  if (!blog) return (
    <div className="p-10 text-center text-red-500">Blog not found.</div>
  );

  // Author Resolution
  const getAuthorDisplay = () => {
    if (!blog.author) return "Famtech Team";
    const author = blog.author;
    if (typeof author === "object" && "firstName" in author) {
      const { firstName, lastName } = author as Author;
      if (!firstName && !lastName) return "Famtech Team";
      return `${firstName || ""} ${lastName || ""}`.trim();
    }
    return typeof author === "string" && author.trim() !== ""
      ? "Famtech Admin"
      : "Famtech Team";
  };

  const authorName = getAuthorDisplay();
  const isApproved = blog.status === "approved";
  const isInReview = blog.status === "in-review";

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 md:p-8 lg:p-6 pb-20 text-black">

      {/* 1. Header Navigation */}
      <div className="flex justify-between items-center mb-8">
        <Link
          href="/admin/blog"
          className="flex items-center text-gray-500 hover:text-green-600 font-medium transition-colors"
        >
          <ChevronLeft size={20} /> Back to all posts
        </Link>

        <div className="flex items-center gap-3">
          <StatusBadge status={blog.status ?? "pending"} />
          <Link
            href={`/admin/blog/${blog._id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 text-gray-700 hover:text-green-700 font-semibold transition-all shadow-sm"
          >
            <Settings size={18} />
            <span>Edit Post</span>
          </Link>
        </div>
      </div>

      {/* 2. Hero Image */}
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
              <div
                key={img.fileId || idx}
                className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100"
              >
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

      {/* 6. Admin feedback banner — shown whenever a comment exists, any status */}
      {blog.comment && !commentDismissed && (
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
          <MessageSquare className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-amber-700">Admin Feedback</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCommentDismissed(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearComment}
                  disabled={actionLoading}
                  className="text-xs text-amber-500 hover:text-amber-700 underline underline-offset-2 disabled:opacity-50 transition-colors"
                >
                  Clear comment
                </button>
              </div>
            </div>
            <p className="text-sm text-amber-700 leading-relaxed">{blog.comment}</p>
          </div>
        </div>
      )}

      {/* 7. Approval panel — always visible so admin can change status freely */}
      <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-900">Review Decision</h2>
          {isApproved && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Currently published
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-5">
          {isApproved
            ? "This post is live. You can still send it back for revision if needed."
            : "Approve to publish this post, or send it back with feedback for the author to revise."}
        </p>
        <div className="flex items-center gap-3">
          {/* Approve button — always shown */}
          <button
            onClick={handleAccept}
            disabled={actionLoading || isApproved}
            className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 ${
              isApproved
                ? "bg-green-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {actionLoading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <CheckCircle className="w-4 h-4" />
            }
            {isApproved ? "Approved" : "Approve & Publish"}
          </button>

          {/* Send for review — always shown, even on approved posts */}
          <button
            onClick={() => setReviewModalOpen(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Send for Review
          </button>
        </div>
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onConfirm={handleSendForReview}
        isLoading={actionLoading}
      />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === "success" ? "bg-green-600" : "bg-red-500"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default BlogDetailPage;