'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`w-full h-screen flex flex-col overflow-hidden transition-all duration-300 transform ${
        sidebarOpen
          ? 'translate-y-4 md:translate-y-0 md:ml-64'
          : 'translate-y-0 md:ml-0'
      }`}>
        {/* Fixed Header */}
        <div className="sticky top-0 z-10">
          <Header onMenuClick={toggleSidebar} />
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
