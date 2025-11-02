// src/index.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

// --- Layouts ---
import ProtectedLayout from './layouts/ProtectedLayout.jsx'; // <-- 1. Import our new layout

// --- Pages ---
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProjectsListPage from './pages/ProjectsListPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';


// --- Page Placeholders ---
const DashboardPage = () => <div className="text-gray-400">Your main dashboard content will go here.</div>;



// --- 3. This is our new, professional router ---
const router = createBrowserRouter([
  // --- Auth Pages (no layout) ---
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  // --- Protected App Pages (all use the layout) ---
  {
    path: "/",
    element: <ProtectedLayout />, // The "shell"
    children: [
      // These components will be rendered inside the <Outlet />
      {
        path: "/", // The root path (e.g., localhost:5173/)
        element: <DashboardPage />,
      },
      {
        path: "/projects", // The list of projects
        element: <ProjectsListPage />,
      },
      {
        path: "/project/:id", // A single project
        element: <ProjectPage />,
      },

      { // <-- 2. ADD THIS NEW ROUTE
        path: "/settings", 
        element: <SettingsPage />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);