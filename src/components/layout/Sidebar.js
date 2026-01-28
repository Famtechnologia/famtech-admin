'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UsersRound,
  ChevronDown,
  ChevronRight,
  Shield,
  ChartCandlestick,
  UserCheck,
  UserX,
  Settings,
  MessageSquare,
  UserCog,
  BrickWallShield,
  UserStar
  
} from 'lucide-react';

// Icon mapping
const iconMap = {
  LayoutDashboard,
  Users,
  UserPlus,
  UsersRound,
  ChartCandlestick,
  UserCheck,
  UserX,
  Settings,
  MessageSquare,
  UserCog,
  BrickWallShield,
  UserStar
};

// Navigation configuration in JSON format - easy to extend
const navigationConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'LayoutDashboard'
  },
  {
    id: 'farmers',
    label: 'Farmers',
    icon: 'Users',
    group: [
      {
        id: 'create-farmers',
        label: 'Add Farmer',
        href: '/admin/farmers/create',
        icon: 'UserPlus'
      },
      {
        id: 'view-all-farmers',
        label: 'View All Farmers',
        href: '/admin/farmers',
        icon: 'Users'
      },
      {
        id: 'verified-farmers',
        label: 'Verified Farmers',
        href: '/admin/farmers/verified',
        icon: 'UserCheck'
      },
      {
        id: 'unverified-farmers',
        label: 'Unverified Farmers',
        href: '/admin/farmers/unverified',
        icon: 'UserX'
      },
      {
        id: 'farm-profiles',
        label: 'Farm Profiles',
        href: '/admin/farmers/farm-profiles',
        icon: 'UserStar'
      },
      {
        id: 'farmers-analytics',
        label: 'Farmers Analytics',
        href: '/admin/farmers/analytics',
        icon: 'ChartCandlestick'
      }
    ]
  },
  {
    id: 'admin-control',
    label: 'Admin Control',
    icon: 'BrickWallShield',
    group: [
      {
        id: 'add-admin',
        label: 'Add Admin',
        href: '/admin/staffs/create',
        icon: 'UserPlus'
      },
      {
        id: 'view-admin',
        label: 'View Admins',
        href: '/admin/staffs',
        icon: 'UserCog'
      }
    ]
  },
  {
    id: 'chat',
    label: 'Chat',
    href: '/admin/chat',
    icon: 'MessageSquare'
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/admin/profile',
    icon: 'UserCog'
  },
  {
    id: 'blog',
    label: 'Blog',
    href: '/admin/blog',
    icon: 'UserCog'
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: 'Settings'
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState({ farmers: false, 'admin-control': false });

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isActive = (href) => {
    return pathname === href;
  };

  const renderIcon = (iconName, className = '') => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={className} size={20} /> : null;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`w-64 max-md:w-80 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-900">FamTech</h2>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="py-4 px-3 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {navigationConfig.map((item) => (
            <li key={item.id}>
              {item.group ? (
                // Group item with submenu
                <div>
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-150"
                  >
                    <div className="flex items-center"> 
                      {renderIcon(item.icon, 'text-gray-600 mr-3')}
                      <span className="text-[15px] font-medium">{item.label}</span>
                    </div>
                    {expandedGroups[item.id] ? (
                      <ChevronDown size={18} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-500" />
                    )}
                  </button>
                  
                  {expandedGroups[item.id] && (
                    <ul className="mt-1 ml-4 space-y-0.5 border-l-2 border-gray-200 pl-2">
                      {item.group.map((subItem) => {
                        const isSubActive = isActive(subItem.href);
                        return (
                          <li key={subItem.id}>
                            <Link
                              href={subItem.href}
                              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-150 ${
                                isSubActive
                                  ? 'bg-green-50 text-green-700'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                {renderIcon(subItem.icon, `${isSubActive ? 'text-green-600' : 'text-gray-500'} mr-3`)}
                                <span className="text-[15px]">{subItem.label}</span>
                              </div>
                              {subItem.badge && (
                                <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                  {subItem.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                // Single link item
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-150 ${
                    isActive(item.href)
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    {renderIcon(item.icon, `${isActive(item.href) ? 'text-green-600' : 'text-gray-600'} mr-3`)}
                    <span className="text-[15px] font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
        <p className="text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} FamTech Admin
        </p>
      </div>
    </aside>
    </>
  );
}
