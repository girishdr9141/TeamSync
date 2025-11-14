// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// --- V2.0 IMPORTS ---
// We'll need the toast hook for notifications
import { useToast } from '@/hooks/use-toast'; 
// We'll use the Select components for our progress dropdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// --- END V2.0 IMPORTS ---

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderKanban, FileText } from 'lucide-react';

// --- V2.0 HELPER FUNCTION ---
// A simple utility to make our ISO date strings human-readable
// Example: "2025-11-14T13:30:00Z" -> "11/14/2025, 1:30:00 PM"
// This will respect the user's local timezone.
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    // Using 'en-GB' locale formats the date as dd/mm/yyyy
    return new Date(dateString).toLocaleString('en-GB');
};
// --- END V2.0 HELPER ---

export default function DashboardPage() {
    const [myTasks, setMyTasks] = useState([]);
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { api, user } = useAuth();
    
    // --- V2.0: Initialize the toast hook ---
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tasksResponse, projectsResponse] = await Promise.all([
                    api.get('/tasks/my_tasks/'),
                    api.get('/projects/')
                ]);
                
                setMyTasks(tasksResponse.data);
                // We'll use the full projects list to find task project names
                setMyProjects(projectsResponse.data); 
                
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [api]); // Run when 'api' object is available

    // --- V2.0: Helper to get project name from its ID ---
    // This is a small improvement on your original code.
    const getProjectName = (projectId) => {
        const project = myProjects.find(p => p.id === projectId);
        return project ? project.name : `Project ${projectId}`;
    };

    // --- V2.0: FUNCTION TO HANDLE PROGRESS CHANGE ---
    const handleProgressChange = async (taskId, newProgress) => {
        // Convert the string value from <Select> to a number
        const progressValue = parseInt(newProgress, 10);

        try {
            // Call our new V2.0 API endpoint
            const response = await api.post(`/tasks/${taskId}/set_progress/`, {
                progress: progressValue,
            });

            // The API returns the updated task (and maybe a bonus message!)
            const updatedTask = response.data;

            // If the task is 100% complete, it will be marked 'DONE'
            // and our 'my_tasks' API won't return it next time.
            // Let's remove it from the list immediately for a snappy UI.
            if (updatedTask.progress === 100) {
                setMyTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            } else {
                // Otherwise, just update the task in our list
                setMyTasks(prevTasks => 
                    prevTasks.map(t => (t.id === taskId ? updatedTask : t))
                );
            }

            // Show a success toast!
            toast({
                title: "Progress Updated",
                // This is the magic part: Check if the API sent a bonus message
                // and show it if it did!
                description: updatedTask.message || `Task set to ${updatedTask.progress}%.`,
            });

        } catch (error) {
            console.error("Failed to update task progress", error);
            // Show an error toast
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "There was an error updating your task. Please try again.",
            });
        }
    };
    // --- END V2.0 FUNCTION ---

    if (loading) {
        return <p className="text-gray-400">Loading dashboard...</p>;
    }

    return (
        <div className="space-y-8">
            {/* Header (No Changes) */}
            <div>
                <h2 className="text-3xl font-bold text-white">
                    Welcome back, {user?.first_name || user?.username}!
                </h2>
                <p className="text-lg text-gray-400">Here's a summary of your active work.</p>
            </div>

            {/* Grid Layout (Modified) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: My Tasks (takes up 2/3 width on large screens) */}
                <Card className="lg:col-span-2 bg-gray-900 border-gray-800 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2" />
                            My Active Tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* --- V2.0: UPDATED TABLE --- */}
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800 hover:bg-gray-800">
                                    <TableHead className="text-white">Task</TableHead>
                                    <TableHead className="text-white">Project</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-white">Due Date</TableHead>
                                    <TableHead className="text-white w-[150px]">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myTasks.length > 0 ? myTasks.map(task => (
                                    <TableRow key={task.id} className="border-gray-800">
                                        <TableCell className="font-medium">
                                            <Link to={`/project/${task.project}`} className="hover:underline">
                                                {task.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {/* Use our helper to show the name */}
                                            {getProjectName(task.project)}
                                        </TableCell>
                                        
                                        {/* V2.0: Add styling for OVERDUE status */}
                                        <TableCell>
                                            <span 
                                                className={task.status === 'OVERDUE' ? 'text-red-500 font-bold' : ''}
                                            >
                                                {task.status}
                                            </span>
                                        </TableCell>

                                        {/* V2.0: Show the formatted due date */}
                                        <TableCell>
                                            {formatDate(task.due_date)}
                                        </TableCell>

                                        {/* V2.0: Add the progress <Select> dropdown */}
                                        <TableCell>
                                            <Select
                                                // We must use String() for the <Select> value
                                                value={String(task.progress)}
                                                // When changed, call our new handler
                                                onValueChange={(value) => handleProgressChange(task.id, value)}
                                            >
                                                <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                                                    <SelectValue placeholder="Set progress" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                                    <SelectItem value="0" className="hover:bg-gray-800">Not Started (0%)</SelectItem>
                                                    <SelectItem value="25" className="hover:bg-gray-800">25%</SelectItem>
                                                    <SelectItem value="50" className="hover:bg-gray-800">50%</SelectItem>
                                                    <SelectItem value="75" className="hover:bg-gray-800">75%</SelectItem>
                                                    <SelectItem value="100" className="hover:bg-gray-800">Done (100%)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        {/* V2.0: Updated colSpan to 5 */}
                                        <TableCell colSpan="5" className="text-center text-gray-400 h-24">
                                            You have no active tasks.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Column 2: My Projects (takes up 1/3 width) */}
                <Card className="lg:col-span-1 bg-gray-900 border-gray-800 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FolderKanban className="mr-2" />
                            My Projects
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* We slice to show first 3 projects */}
                        {myProjects.length > 0 ? myProjects.slice(0, 3).map(project => (
                            <div key={project.id} className="pb-4 border-b border-gray-800 last:border-b-0">
                                <Link to={`/project/${project.id}`}>
                                    <h3 className="font-semibold hover:underline">{project.name}</h3>
                                </Link>
                                <p className="text-sm text-gray-400">{project.members.length} member(s)</p>
                            </div>
                        )) : (
                            <p className="text-gray-400">You are not part of any projects.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Link to="/projects" className="w-full">
                            <Button variant="outline" className="w-full border-blue-400 hover:bg-blue-900/50 hover:text-blue-300 text-blue-400">
                                View All Projects
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}