// src/layouts/ProtectedLayout.jsx

import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FolderKanban, LogOut, Settings } from 'lucide-react'; // Our icons

export default function ProtectedLayout() {
    const { user, logout } = useAuth();

    // --- 1. Protection ---
    // If there is no user, redirect them to the /login page
    if (!user) {
        return <Navigate to="/login" />;
    }

    // --- 2. The Layout ---
    // This is a modern 2-column layout (Sidebar + Main Content)
    return (
        <div className="flex min-h-screen w-full bg-gray-950">
            
            {/* --- Sidebar (Column 1) --- */}
            <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900 p-4 flex flex-col">
                {/* Logo/Title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">TeamSync</h1>
                </div>

                {/* Main Navigation */}
                <nav className="flex-grow space-y-2">
                    <Link to="/">
                        <Button variant="ghost" className="w-full justify-start text-lg text-gray-300 hover:bg-gray-800 hover:text-white">
                            <LayoutDashboard className="mr-3 h-5 w-5" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link to="/projects">
                        <Button variant="ghost" className="w-full justify-start text-lg text-gray-300 hover:bg-gray-800 hover:text-white">
                            <FolderKanban className="mr-3 h-5 w-5" />
                            Projects
                        </Button>
                    </Link>
                </nav>

                {/* Footer / User Area */}
                <div className="mt-auto">
                    <Button variant="ghost" className="w-full justify-start text-lg text-gray-300 hover:bg-gray-800 hover:text-white">
                        <Settings className="mr-3 h-5 w-5" />
                        Settings
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={logout} 
                        className="w-full justify-start text-lg text-red-500 hover:bg-red-900/50 hover:text-red-400"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Log Out
                    </Button>
                </div>
            </aside>

            {/* --- Main Content (Column 2) --- */}
            <main className="flex-1 p-8 overflow-auto">
                {/* Header */}
                <header className="mb-8 flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Dashboard</h2> 
                    <div className="text-lg text-gray-400">
                        Welcome, {user.first_name || user.username}
                    </div>
                </header>

                {/* This is where the actual page (Dashboard, ProjectPage, etc.) will be rendered */}
                <Outlet />
            </main>
        </div>
    );
}