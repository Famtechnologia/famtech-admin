import React from "react";
import { X, Copy } from "lucide-react";

export default function ViewCodeModal({ open, code = "", onClose, onCopy }) {
  // code: string, e.g. "1234"
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-8 relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold"
          aria-label="Close"
        >
          <X />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Verification Code</h2>
        <div className="flex justify-center gap-2 mb-6">
          {typeof code === "string" && code.length > 0 ? (
            code.split("").map((digit, idx) => (
              <div
                key={idx}
                className="w-12 h-14 flex items-center justify-center border-2 border-green-500 rounded-lg text-2xl font-bold bg-green-50 text-green-700 shadow-sm"
              >
                {digit}
              </div>
            ))
          ) : (
            <span className="text-gray-400 text-lg">No code available</span>
          )}
        </div>
        <button
          onClick={onCopy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
          <Copy size={18} /> Copy Code
        </button>
      </div>
      <style jsx>{`
        .animate-slideUp { animation: slideUp 0.3s; }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
