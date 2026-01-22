import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";


export function ErrorModal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex flex-col items-center mb-4">
          <AlertTriangle className="h-14 w-14 text-red-500 mb-2 animate-shake" />
          <span className="text-2xl font-bold text-red-700 mb-1">Error</span>
        </div>
        <div className="text-center text-gray-800 mb-6 text-base font-medium">{message}</div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg font-semibold shadow hover:scale-105 transition-transform"
        >
          Close
        </button>
      </div>
      <style jsx>{`
        .animate-fadeIn { animation: fadeIn 0.2s; }
        .animate-slideUp { animation: slideUp 0.3s; }
        .animate-shake { animation: shake 0.4s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shake { 0% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } 100% { transform: rotate(0deg); } }
      `}</style>
    </div>
  );
}


export function SuccessModal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-green-500 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex flex-col items-center mb-4">
          <CheckCircle className="h-14 w-14 text-green-500 mb-2 animate-bounce" />
          <span className="text-2xl font-bold text-green-700 mb-1">Success</span>
        </div>
        <div className="text-center text-gray-800 mb-6 text-base font-medium">{message}</div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg font-semibold shadow hover:scale-105 transition-transform"
        >
          Close
        </button>
      </div>
      <style jsx>{`
        .animate-fadeIn { animation: fadeIn 0.2s; }
        .animate-slideUp { animation: slideUp 0.3s; }
        .animate-bounce { animation: bounce 0.6s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes bounce { 0% { transform: scale(1); } 30% { transform: scale(1.2); } 60% { transform: scale(0.95); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}
