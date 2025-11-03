// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderKanban, FileText } from 'lucide-react';

export default function DashboardPage() {
    const [myTasks, setMyTasks] = useState([]);
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { api, user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch both sets of data in parallel
                const [tasksResponse, projectsResponse] = await Promise.all([
                    api.get('/tasks/my_tasks/'), // Our new endpoint
                    api.get('/projects/')         // The existing endpoint
                ]);
                
                setMyTasks(tasksResponse.data);
                setMyProjects(projectsResponse.data.slice(0, 3)); // Only show the first 3 projects
                
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [api]); // Run when 'api' object is available

    if (loading) {
        return <p className="text-gray-400">Loading dashboard...</p>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">
                    Welcome back, {user?.first_name || user?.username}!
                </h2>
                <p className="text-lg text-gray-400">Here's a summary of your active work.</p>
            </div>

            {/* Grid Layout */}
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
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800 hover:bg-gray-800">
                                    <TableHead className="text-white">Task</TableHead>
                                    <TableHead className="text-white">Project</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
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
                                        {/* We need to fetch project details to show name, but this is a good start */}
                                        <TableCell>Project {task.project}</TableCell>
                                        <TableCell>{task.status}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan="3" className="text-center text-gray-400 h-24">
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
                        {myProjects.length > 0 ? myProjects.map(project => (
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
                            <Button variant="outline" className="w-full border-blue-400  hover:bg-blue-900/50 hover:text-blue-300 text-blue-400">
                                View All Projects
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
