// src/pages/ProjectPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { toast } from "sonner"; // For notifications

// Import all the Shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Import our custom components
import AddTaskSheet from '@/components/AddTaskSheet';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

// Icons
import { Users, FileText, Clock, Brain, AlertTriangle } from 'lucide-react'; // -- V2.0: Added AlertTriangle

// --- V2.0 HELPER FUNCTION ---
// Utility to make our ISO date strings human-readable
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
};
// --- END V2.0 HELPER ---

// --- RemoveMemberButton Component (No changes) ---
function RemoveMemberButton({ projectId, username, onMemberRemoved }) {
    const { api } = useAuth(); 

    const handleRemove = async () => {
        try {
            await api.post(`/projects/${projectId}/remove_member/`, { username });
            toast.success(`User '${username}' removed from the project.`);
            onMemberRemoved();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to remove user.");
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Remove</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove <span className="font-bold text-white">{username}</span> from the project.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="ghost">Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild> 
                        <Button variant="destructive" onClick={handleRemove}>Yes, Remove</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// --- AddMemberDialog Component (No changes) ---
function AddMemberDialog({ projectId, onMemberAdded }) {
    const [username, setUsername] = useState("");
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const { api } = useAuth();

    const handleAddMember = async () => {
        setError(null);
        try {
            await api.post(`/projects/${projectId}/add_member/`, { username });
            toast.success(`User '${username}' added to the project!`);
            setIsOpen(false);
            onMemberAdded();
            setUsername("");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add user.");
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    + Add Member
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Add a Team Member</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter the username of the employee you want to add to this project.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="username-add" className="text-gray-300">Username</Label>
                    <Input
                        id="username-add"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-gray-800 border-gray-700 mt-2"
                        placeholder="e.g., jessepinkman"
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="ghost">Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild> 
                        <Button onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-700">Add Member</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


// --- Main ProjectPage Component ---
export default function ProjectPage() {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // We get the 'api' object and 'user' object (renamed to 'loggedInUser')
    const { api, user: loggedInUser } = useAuth();
    
    const { id } = useParams();

    // --- Data Fetching ---
    const fetchProject = async () => {
        // We don't set loading(true) here, to allow for background refreshes
        setError(null);
        try {
            const response = await api.get(`/projects/${id}/`);
            setProject(response.data);
        } catch (err) {
            setError('Failed to fetch project details.');
        } finally {
            setLoading(false); // Only set loading false on the *first* load
        }
    };

    // --- (handleRunAssignment and handleRunScheduler are fine) ---
        const handleRunAssignment = async () => {
        toast.info("Running Task Assignment Algorithm...");
        try {
            const response = await api.post(`/projects/${id}/run_assignment/`);
            // The response.data.message is a list of strings
            const messages = response.data.message.split('\n');
            toast.success("Assignment complete!", {
                description: (
                    <div className="flex flex-col">
                        {messages.map((msg, i) => (<span key={i}>{msg}</span>))}
                    </div>
                )
            });
            fetchProject(); // Refresh data to show new assignments
        } catch (err) {
            toast.error("Algorithm failed. Check console for details.");
        }
    };
    
    const handleRunScheduler = async () => {
        toast.info("Running Meeting Scheduler Algorithm...");
        try {
            const response = await api.post(`/projects/${id}/run_scheduler/`, {
                duration_hours: 1 
            });
            const { best_slot } = response.data;
            toast.success(`Best slot found: ${new Date(best_slot.start_time).toLocaleString()}`);
        } catch (err) {
            toast.error("Scheduler failed. Check console for details.");
        }
    };

    
    useEffect(() => {
        if (loggedInUser) { // Wait for user to be loaded
            fetchProject();
        }
    }, [id, loggedInUser]); // Re-run if user or ID changes

    // --- Render Logic ---
    if (loading) return <p className="text-gray-400">Loading project...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!project) return null;

    const { tasks, members } = project;

    // --- V2.0 PERMISSION CHECK ---
    // Check if the currently logged-in user is the project leader.
    // We check `loggedInUser.id` (a number) against `project.leader` (also a number)
    const isProjectLeader = loggedInUser.id === project.leader;
    // --- END V2.0 ---

    return (
        <div className="space-y-8">
            {/* ... (Header is fine) ... */}
            <div>
                <Link to="/projects" className="text-blue-400 hover:underline">&larr; Back to all projects</Link>
                <h2 className="text-4xl font-bold text-white mt-2">{project.name}</h2>
                <p className="text-lg text-gray-400">{project.description}</p>
            </div>

            {/* --- V2.0: AI CONTROL PANEL (LEADER ONLY) --- */}
            {isProjectLeader && (
                <Card className="bg-gray-900 border-gray-800 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl">
                            <Brain className="mr-3 h-6 w-6" />
                            AI Control Panel (Leader)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleRunAssignment} className="bg-green-600 hover:bg-green-700 text-white">
                            Run Task Assignment
                        </Button>
                        <Button onClick={handleRunScheduler} className="bg-purple-600 hover:bg-purple-700 text-white">
                            Find Meeting Time
                        </Button>
                    </CardContent>
                </Card>
            )}
            {/* --- END V2.0 --- */}


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
                        {/* --- V2.0: "ADD TASK" BUTTON (LEADER ONLY) --- */}
                        {isProjectLeader && (
                            <AddTaskSheet 
                                projectId={project.id} 
                                onTaskCreated={fetchProject} 
                            />
                        )}
                        {/* --- END V2.0 --- */}
                    </div>
                    
                    {/* --- V2.0: UPGRADED TASK TABLE --- */}
                    <Card className="bg-gray-900 border-gray-800 text-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800 hover:bg-gray-800">
                                    <TableHead className="text-white">Title</TableHead>
                                    <TableHead className="text-white">Assigned To</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-white">Progress</TableHead>
                                    <TableHead className="text-white">Due Date</TableHead>
                                    <TableHead className="text-white">Est. Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length > 0 ? tasks.map(task => (
                                    <TableRow key={task.id} className="border-gray-800">
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell>{task.assigned_to || <span className="text-gray-500">Unassigned</span>}</TableCell>
                                        <TableCell>
                                            {/* Add special styling for OVERDUE tasks */}
                                            <span 
                                                className={`
                                                    ${task.status === 'OVERDUE' ? 'text-red-500 font-bold' : ''}
                                                    ${task.status === 'DONE' ? 'text-green-500' : ''}
                                                `}
                                            >
                                                {task.status === 'OVERDUE' && <AlertTriangle className="h-4 w-4 inline-block mr-1" />}
                                                {task.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{task.progress}%</TableCell>
                                        <TableCell>{formatDate(task.due_date)}</TableCell>
                                        <TableCell>{task.estimated_hours}h</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        {/* V2.0: Updated colSpan to 6 */}
                                        <TableCell colSpan="6" className="text-center text-gray-400 h-24">
                                            No tasks have been added to this project yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                    {/* --- END V2.0 TABLE --- */}
                </TabsContent>

                {/* --- Members Tab --- */}
                <TabsContent value="members" className="mt-4">
                    <div className="flex justify-end mb-4">
                        {/* --- V2.0: "ADD MEMBER" BUTTON (LEADER ONLY) --- */}
                        {isProjectLeader && (
                            <AddMemberDialog projectId={project.id} onMemberAdded={fetchProject} />
                        )}
                        {/* --- END V2.0 --- */}
                    </div>
                    <Card className="bg-gray-900 border-gray-800 text-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800 hover:bg-gray-800">
                                    <TableHead className="text-white">Username</TableHead>
                                    <TableHead className="text-right text-white">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.length > 0 ? members.map(memberUsername => (
                                    <TableRow key={memberUsername} className="border-gray-800">
                                        <TableCell className="font-medium">
                                            {memberUsername}
                                            {/* V2.0: Add a "(Leader)" badge */}
                                            {project.leader_username === memberUsername && (
                                                <span className="ml-2 text-xs font-medium bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                                                    Leader
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            
                                            {/* V2.0: Check if leader AND if not self */}
                                            {isProjectLeader && memberUsername !== loggedInUser.username ? (
                                                <RemoveMemberButton
                                                    projectId={project.id}
                                                    username={memberUsername}
                                                    onMemberRemoved={fetchProject}
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-500">
                                                    {memberUsername === loggedInUser.username ? "You" : "N/A"}
                                                </span>
                                            )}
                                            
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan="2" className="text-center text-gray-400 h-24">
                                            You are the only member. Add more members to collaborate.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* --- Schedule Tab (No changes) --- */}
                <TabsContent value="schedule" className="mt-4">
                    <AvailabilityCalendar />
                </TabsContent>
            </Tabs>
        </div>
    );
}