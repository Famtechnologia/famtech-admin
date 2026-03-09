"use client";

import { useState } from "react";
import { X, MessageSquare } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isLoading: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: ReviewModalProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError("Please provide feedback for the author.");
      return;
    }
    setError("");
    onConfirm(comment.trim());
  };

  const handleClose = () => {
    setComment("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Send for Review
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Leave feedback for the author
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Textarea */}
        <div className="mt-2">
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (e.target.value.trim()) setError("");
            }}
            placeholder="e.g. Great structure, but please add more detail on irrigation methods and include at least two citations..."
            rows={5}
            className={`w-full text-sm text-gray-800 placeholder:text-gray-400 border rounded-xl p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition ${
              error ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
            }`}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1.5">{error}</p>
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            {comment.length} characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              "Send Feedback"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}