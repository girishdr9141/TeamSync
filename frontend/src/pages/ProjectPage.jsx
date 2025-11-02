// src/pages/ProjectPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom'; // useParams hooks into the URL (e.g., /project/:id)
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Clock, Settings, Brain, CalendarDays } from 'lucide-react';
import AddTaskSheet from '@/components/AddTaskSheet';

// This is a placeholder. We'll build this component later.


export default function ProjectPage() {
    const [project, setProject] = useState(null); // Will hold the single project object
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { api } = useAuth();
    const { id } = useParams(); // Gets the 'id' from the URL

    // --- Data Fetching ---
    const fetchProject = async () => {
        setLoading(true);
        setError(null);
        try {
            // We use the 'id' from the URL to fetch one specific project
            const response = await api.get(`/projects/${id}/`);
            setProject(response.data);
        } catch (err) {
            setError('Failed to fetch project details.');
        } finally {
            setLoading(false);
        }
    };

    // --- Run AI Algorithms ---
    const handleRunAssignment = async () => {
        alert("Running Task Assignment Algorithm (dummy)...");
        // This calls the '@action' we built in Django
        try {
            const response = await api.post(`/projects/${id}/run_assignment/`);
            console.log(response.data);
            alert("Assignment complete! Refreshing tasks.");
            fetchProject(); // Re-fetch the project to show the new assignments
        } catch (err) {
            alert("Algorithm failed.");
        }
    };
    
    const handleRunScheduler = async () => {
        alert("Running Meeting Scheduler Algorithm (dummy)...");
        try {
            const response = await api.post(`/projects/${id}/run_scheduler/`, {
                duration_hours: 1 // Sending the meeting duration
            });
            const { best_slot } = response.data;
            alert(`Best slot found: ${new Date(best_slot.start_time).toLocaleString()}`);
        } catch (err) {
            alert("Scheduler failed.");
        }
    };
    
    // Fetch the project when the page loads (or when the 'id' changes)
    useEffect(() => {
        fetchProject();
    }, [id]);

    // --- Render Logic ---
    if (loading) return <p className="text-gray-400">Loading project...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!project) return null; // Should be covered by loading/error

    // We split members and tasks for easier access
    const { tasks, members } = project;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <Link to="/projects" className="text-blue-400 hover:underline">&larr; Back to all projects</Link>
                <h2 className="text-4xl font-bold text-white mt-2">{project.name}</h2>
                <p className="text-lg text-gray-400">{project.description}</p>
            </div>

            {/* AI Control Panel */}
            <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Brain className="mr-2" />
                        AI Control Panel
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button onClick={handleRunAssignment} className="bg-green-600 hover:bg-green-700 text-white">
                        Run Task Assignment
                    </Button>
                    <Button onClick={handleRunScheduler} className="bg-purple-600 hover:bg-purple-700 text-white">
                        Find Meeting Time
                    </Button>
                </CardContent>
            </Card>

            {/* Main Content Area with Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="bg-gray-800 border-gray-700">
                    <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-950 data-[state=active]:text-white">
                        <FileText className="mr-2 h-4 w-4" /> Tasks ({tasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="members" className="data-[state=active]:bg-gray-950 data-[state=active]:text-white">
                        <Users className="mr-2 h-4 w-4" /> Members ({members.length})
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="data-[state=active]:bg-gray-950 data-[state=active]:text-white">
                        <Clock className="mr-2 h-4 w-4" /> Schedule
                    </TabsTrigger>
                </TabsList>

                {/* --- Tasks Tab --- */}
                <TabsContent value="tasks" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <AddTaskSheet 
                           projectId={project.id} 
                           onTaskCreated={fetchProject} 
                        />
                    </div>
                    <Card className="bg-gray-900 border-gray-800 text-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800">
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-white">Title</TableHead>
                                    <TableHead className="text-white">Assigned To</TableHead>
                                    <TableHead className="text-white">Est. Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length > 0 ? tasks.map(task => (
                                    <TableRow key={task.id} className="border-gray-800">
                                        <TableCell>{task.status}</TableCell>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell>{task.assigned_to || <span className="text-gray-500">Unassigned</span>}</TableCell>
                                        <TableCell>{task.estimated_hours}h</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan="4" className="text-center text-gray-400">
                                            No tasks have been added to this project yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* --- Members Tab --- */}
                <TabsContent value="members" className="mt-4">
                    <Card className="bg-gray-900 border-gray-800 text-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800">
                                    <TableHead className="text-white">Username</TableHead>
                                    <TableHead className="text-white">Full Name</TableHead>
                                    <TableHead className="text-white">Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => (
                                    <TableRow key={member} className="border-gray-800">
                                        {/* This is a temporary setup. We'll need to fetch full member details later */}
                                        <TableCell className="font-medium">{member}</TableCell>
                                        <TableCell>...</TableCell>
                                        <TableCell>...</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* --- Schedule Tab --- */}
                <TabsContent value="schedule" className="mt-4">
                    {/* We'll build this component next */}
                    <div className="text-gray-400">The `FullCalendar` component will go here.</div>
                </TabsContent>
            </Tabs>
        </div>
    );
}