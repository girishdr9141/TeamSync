// src/pages/ProjectsListPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card"; // Using standard Card now

// Icons
import { Plus, Folder, Users, ArrowRight, Search, Sparkles, LayoutGrid, Globe, Shield } from 'lucide-react';

// --- MAIN PAGE COMPONENT ---
export default function ProjectsListPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectDesc, setNewProjectDesc] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { api } = useAuth();

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            setProjects(response.data);
        } catch (err) {
            toast.error('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            toast.error("Project name is required");
            return;
        }
        try {
            const response = await api.post('/projects/', {
                name: newProjectName,
                description: newProjectDesc
            });
            setProjects([...projects, response.data]);
            toast.success("Project created successfully!");
            setNewProjectName("");
            setNewProjectDesc("");
            setIsDialogOpen(false);
        } catch (err) {
            toast.error("Failed to create project.");
        }
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Helper to assign a random icon based on project name length (Clean style icons)
    const getProjectIcon = (name) => {
        const icons = [<LayoutGrid />, <Globe />, <Shield />, <Sparkles />, <Folder />];
        return icons[name.length % icons.length];
    };

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspace</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2 text-lg">
                            Manage your active deployments and teams.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Filter projects..."
                                className="pl-9 bg-white border-slate-200 text-slate-900 w-full md:w-64 focus:ring-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all">
                                    <Plus className="mr-2 h-4 w-4" /> New Project
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white border-slate-200 text-slate-900">
                                <DialogHeader>
                                    <DialogTitle>Initialize New Project</DialogTitle>
                                    <DialogDescription className="text-slate-500">
                                        Create a centralized workspace for task allocation.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-slate-700">Project Name</Label>
                                        <Input
                                            id="name"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            className="bg-white border-slate-300 text-slate-900"
                                            placeholder="e.g. Website Redesign"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="desc" className="text-slate-700">Description</Label>
                                        <Input
                                            id="desc"
                                            value={newProjectDesc}
                                            onChange={(e) => setNewProjectDesc(e.target.value)}
                                            className="bg-white border-slate-300 text-slate-900"
                                            placeholder="Brief objectives..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-slate-700 border-slate-200 hover:bg-slate-50">Cancel</Button>
                                    <Button onClick={handleCreateProject} className="bg-slate-900 hover:bg-slate-800 text-white">Create Project</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* PROJECT GRID */}
                {loading ? (
                     <div className="flex justify-center py-20 text-slate-400">Loading workspace data...</div>
                ) : (
                    <>
                        {filteredProjects.length === 0 ? (
                             <div className="text-center py-32 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                                <Folder className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No active projects</h3>
                                <p className="text-slate-500 mt-1">Initialize a new project to begin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.map((project, idx) => (
                                    <Link to={`/projects/${project.id}`} key={project.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="h-full"
                                        >
                                            <Card className="h-full bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col">
                                                <div className="p-6 flex flex-col h-full">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-white group-hover:text-slate-900 group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                                            {getProjectIcon(project.name)}
                                                        </div>
                                                        <Badge variant="outline" className="border-slate-200 text-slate-400 font-normal">
                                                            ID: {project.id}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                        {project.name}
                                                    </h3>
                                                    <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-grow">
                                                        {project.description || "No mission brief available."}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                            <Users className="w-3.5 h-3.5" /> 
                                                            {project.members?.length || 0} Members
                                                        </div>
                                                        <div className="text-slate-400 group-hover:text-slate-900 text-sm font-medium flex items-center gap-1 transition-colors">
                                                            Enter <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}