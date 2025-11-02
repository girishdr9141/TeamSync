// src/pages/ProjectsListPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // We still need useAuth
import { Link } from 'react-router-dom';

// Import our Shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProjectsListPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);

    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectDesc, setNewProjectDesc] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [createError, setCreateError] = useState(null);

    // --- THE FIX: We only need 'api' from useAuth() now ---
    const { api } = useAuth(); 

    // This function will now work on the *first try*
    const fetchProjects = async () => {
        setLoading(true);
        setListError(null);
        try {
            // No headers needed! The interceptor will handle it.
            const response = await api.get('/projects/');
            setProjects(response.data);
        } catch (err) {
            setListError('Failed to fetch projects.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        setCreateError(null);
        try {
            // No headers needed!
            const response = await api.post('/projects/', 
                { name: newProjectName, description: newProjectDesc }
            );
            
            setIsDialogOpen(false);
            setNewProjectName("");
            setNewProjectDesc("");
            
            // This is our professional state update
            setProjects(currentProjects => [...currentProjects, response.data]);
            
        } catch (err) {
            setCreateError('Failed to create project. Please try again.');
        }
    };

    // This useEffect hook runs ONCE when the component first loads
    useEffect(() => {
        // Now this will run *after* the interceptor is set
        fetchProjects();
    }, []); 

    // --- (The rest of your file is 100% correct, no changes needed) ---

    const renderProjectList = () => {
        if (loading) {
            return <p className="text-gray-400">Loading projects...</p>;
        }
        
        if (listError) {
            return <p className="text-red-500">{listError}</p>;
        }

        if (projects.length === 0) {
            return <p className="text-gray-400">You are not part of any projects yet. Click "+ Create Project" to start one!</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Card key={project.id} className="bg-gray-900 border-gray-800 text-white shadow-lg">
                        <CardHeader>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription className="text-gray-400">
                                {project.members.length} member(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-300 line-clamp-2">
                                {project.description || "No description provided."}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link to={`/project/${project.id}`} className="w-full">
                                <Button variant="outline" className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300">
                                    Open Project
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div>
            {/* Page Header with "Create" button */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Projects</h2>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            + Create Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Create a New Project</DialogTitle>
                            <DialogDescription>
                                Give your project a name and description to get started.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-300">Project Name</Label>
                                <Input
                                    id="name"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="bg-gray-800 border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-gray-300">Description</Label>
                                <Input
                                    id="description"
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="bg-gray-800 border-gray-700"
                                />
                            </div>
                        </div>
                        {createError && <p className="text-sm text-red-500">{createError}</p>}
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700">Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Project List Area */}
            {renderProjectList()}
        </div>
    );
}