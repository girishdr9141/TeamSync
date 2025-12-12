// src/layouts/ProtectedLayout.jsx

import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar, SidebarBody, SidebarLink, SidebarButton } from '@/components/ui/sidebar';
import { TeamSyncLogo } from '@/components/ui/logo';
import { cn } from "@/lib/utils";

// Icons
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  UserCircle
} from "lucide-react";

export default function ProtectedLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // FIXED: Explicitly added text-slate-500 to icons so they are dark gray, not white.
  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-slate-500" />,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <FolderOpen className="h-5 w-5 flex-shrink-0 text-slate-500" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5 flex-shrink-0 text-slate-500" />,
    },
  ];

  const handleLogout = () => {
      logout();
  };

  return (
    <div className={cn(
      "flex flex-col md:flex-row bg-gray-50 w-full flex-1 max-w-full mx-auto overflow-hidden",
      "h-screen"
    )}>
      {/* SIDEBAR CONTAINER */}
      <Sidebar open={open} setOpen={setOpen}>
        {/* FIXED: Added 'text-slate-900' to the body class to set default text color */}
        <SidebarBody className="justify-between gap-10 bg-white border-r border-slate-200 text-slate-900">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            
            {/* LOGO AREA */}
            <div className="flex items-center justify-start gap-2 mb-10">
                <TeamSyncLogo className="w-8 h-8 flex-shrink-0 text-indigo-600" />
                {open && (
                    <div className="text-slate-900 font-bold text-xl transition-all">
                        TeamSync
                    </div>
                )}
            </div>

            {/* NAV LINKS */}
            <div className="flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink 
                    key={idx} 
                    link={link} 
                    // FIXED: Force text color to slate-600 (Dark Gray)
                    className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors rounded-md"
                />
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: user ? user.username : "User",
                href: "/settings", 
                // FIXED: Icon color
                icon: <UserCircle className="h-7 w-7 flex-shrink-0 rounded-full bg-slate-100 text-slate-600 p-1" />,
              }}
              className="text-slate-700 font-medium hover:bg-slate-100 rounded-md"
            />
            
            <SidebarButton 
                onClick={handleLogout}
                icon={<LogOut className="h-5 w-5 flex-shrink-0 text-slate-500" />}
                label="Logout"
                className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-md"
            />
          </div>
        </SidebarBody>
      </Sidebar>
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-gray-50 text-slate-900 p-2 md:p-6">
        <div className="bg-white border border-slate-200 rounded-xl min-h-full p-4 md:p-8 shadow-sm overflow-hidden relative">
            <Outlet />
        </div>
      </main>
    </div>
  );
}