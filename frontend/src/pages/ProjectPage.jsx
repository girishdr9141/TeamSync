// src/pages/ProjectPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { toast } from "sonner"; 

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Added standard Dialog
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Custom Components
import AddTaskSheet from '@/components/AddTaskSheet';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

// Icons
import { Users, FileText, Clock, Brain, Trash2, CalendarCheck } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
};

// ... (DeleteTaskButton, RemoveMemberButton, AddMemberDialog remain the same - omitting for brevity, they are fine) ...
// NOTE: If you need the full file again including those buttons, let me know, but they haven't changed.
// I will include the main export below which has the FIX.

// --- RE-INSERT THESE HELPERS IF YOU OVERWRITE THE WHOLE FILE ---
function DeleteTaskButton({ taskId, onTaskDeleted }) {
    const { api } = useAuth();
    const handleDelete = async () => {
        try { await api.delete(`/tasks/${taskId}/`); toast.success("Task deleted."); onTaskDeleted(); } 
        catch (err) { toast.error("Failed to delete."); }
    };
    return (
        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete Task?</AlertDialogTitle><AlertDialogDescription>Cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    );
}

function RemoveMemberButton({ projectId, username, onMemberRemoved }) {
    const { api } = useAuth(); 
    const handleRemove = async () => {
        try { await api.post(`/projects/${projectId}/remove_member/`, { username }); toast.success(`User removed.`); onMemberRemoved(); } 
        catch (err) { toast.error("Failed."); }
    };
    return (
        <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Remove</Button></AlertDialogTrigger><AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Remove Member?</AlertDialogTitle><AlertDialogDescription>Remove {username}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleRemove} className="bg-red-600">Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    );
}

function AddMemberDialog({ projectId, onMemberAdded }) {
    const [username, setUsername] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const { api } = useAuth();
    const handleAdd = async () => {
        try { await api.post(`/projects/${projectId}/add_member/`, { username }); toast.success(`Added!`); setIsOpen(false); onMemberAdded(); setUsername(""); } 
        catch (err) { toast.error(err.response?.data?.error || "Failed."); }
    };
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}><AlertDialogTrigger asChild><Button className="bg-slate-900 text-white">+ Member</Button></AlertDialogTrigger><AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Add Member</AlertDialogTitle></AlertDialogHeader><div className="py-4"><Label>Username</Label><Input value={username} onChange={e=>setUsername(e.target.value)} className="mt-2" placeholder="username" /></div><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleAdd} className="bg-slate-900">Add</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    );
}

// --- MAIN COMPONENT WITH FIX ---
export default function ProjectPage() {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // MEETING RESULT STATE
    const [meetingResult, setMeetingResult] = useState(null); // Stores the date string
    const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);

    const { api, user: loggedInUser } = useAuth();
    const { id } = useParams();

    const fetchProject = async () => {
        setError(null);
        try {
            const response = await api.get(`/projects/${id}/`);
            setProject(response.data);
        } catch (err) {
            setError('Failed to fetch project details.');
        } finally {
            setLoading(false);
        }
    };

    const handleRunAssignment = async () => {
        const toastId = toast.loading("Running algorithm...");
        try {
            const response = await api.post(`/projects/${id}/run_assignment/`);
            const messages = response.data.message.split('\n');
            toast.success("Assignment complete!", { id: toastId });
            fetchProject(); 
        } catch (err) {
            toast.error("Algorithm failed.", { id: toastId });
        }
    };
    
    const handleRunScheduler = async () => {
        const toastId = toast.loading("Calculating optimal time...");
        try {
            // 1. Call API
            const response = await api.post(`/projects/${id}/run_scheduler/`, { duration_hours: 1 });
            console.log("Scheduler Response:", response.data); // Debugging

            // 2. Extract Data safely
            const bestSlot = response.data.best_slot;
            
            if (bestSlot && bestSlot.start_time) {
                // 3. Format Date
                const dateObj = new Date(bestSlot.start_time);
                const formattedDate = dateObj.toLocaleString([], { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });

                // 4. Show Custom Dialog
                setMeetingResult(formattedDate);
                setIsMeetingDialogOpen(true);
                toast.dismiss(toastId);
            } else {
                toast.error("No suitable slot found.", { id: toastId });
            }

        } catch (err) {
            console.error(err);
            toast.error("Scheduler failed to run.", { id: toastId });
        }
    };

    useEffect(() => {
        if (loggedInUser) { 
            fetchProject();
        }
    }, [id, loggedInUser]);

    if (loading) return <div className="p-8 text-slate-500">Loading workspace...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!project) return null;

    const { tasks, members } = project;
    const isProjectLeader = loggedInUser.id === project.leader;
    const unassignedTasks = tasks.filter(task => !task.assigned_to);

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* MEETING RESULT DIALOG (Pop-up) */}
                <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
                    <DialogContent className="bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-indigo-600">
                                <CalendarCheck className="w-6 h-6" />
                                Optimal Meeting Time Found
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 pt-2">
                                The AI has analyzed everyone's calendar and found the best slot:
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 text-center">
                            <p className="text-2xl font-bold text-slate-900">{meetingResult}</p>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsMeetingDialogOpen(false)} className="bg-slate-900 text-white">
                                Acknowledge
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <Link to="/projects" className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                        &larr; Back to all projects
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h2>
                            <p className="text-lg text-slate-500 mt-1">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">ID: {project.id}</span>
                        </div>
                    </div>
                </div>

                {/* AI CONTROL PANEL */}
                {isProjectLeader && (
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg text-slate-900">
                                <Brain className="mr-2 h-5 w-5 text-indigo-600" />
                                Project Management AI
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleRunAssignment} className="bg-slate-900 hover:bg-slate-800 text-white">
                                Auto-Assign Tasks
                            </Button>
                            <Button onClick={handleRunScheduler} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                                <Clock className="mr-2 h-4 w-4" /> Find Meeting Time
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* TABS */}
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="bg-slate-100 border border-slate-200 p-1">
                        <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500">
                            <Users className="mr-2 h-4 w-4" />
                            Team ({members.length})
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500">
                            <FileText className="mr-2 h-4 w-4" /> Unassigned ({unassignedTasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500">
                            <Clock className="mr-2 h-4 w-4" /> Schedule
                        </TabsTrigger>
                    </TabsList>

                    {/* DASHBOARD TAB (Members) */}
                    <TabsContent value="dashboard" className="mt-6">
                        <div className="flex justify-end mb-4">
                            {isProjectLeader && (
                                <AddMemberDialog projectId={project.id} onMemberAdded={fetchProject} />
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {members.map(member => (
                                <Card key={member.id} className="bg-white border-slate-200 shadow-sm flex flex-col">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                                                    {member.username}
                                                    {project.leader === member.id && (
                                                        <span className="text-xs font-normal bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                                                            Leader
                                                        </span>
                                                    )}
                                                </CardTitle>
                                                <CardDescription>
                                                    {member.id === loggedInUser.id ? "This is you" : `ID: ${member.id}`}
                                                </CardDescription>
                                            </div>
                                            {isProjectLeader && member.id !== loggedInUser.id && (
                                                <RemoveMemberButton
                                                    projectId={project.id}
                                                    username={member.username}
                                                    onMemberRemoved={fetchProject}
                                                />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-6">
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                                                <Label className="text-xs font-medium text-slate-500 uppercase">Workload</Label>
                                                <p className="text-2xl font-bold text-slate-900">{member.remaining_workload.toFixed(1)}h</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                                                <Label className="text-xs font-medium text-slate-500 uppercase">Reliability</Label>
                                                <p className={`text-2xl font-bold ${member.strike_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {member.strike_count > 0 ? `${member.strike_count} Strikes` : 'Perfect'}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Tasks */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Assigned Tasks</h4>
                                            <div className="border border-slate-200 rounded-md max-h-48 overflow-y-auto">
                                                <Table>
                                                    <TableBody>
                                                        {member.tasks.length > 0 ? member.tasks.map(task => (
                                                            <TableRow key={task.id} className="border-slate-100">
                                                                <TableCell className="py-2 text-sm font-medium text-slate-700">{task.title}</TableCell>
                                                                <TableCell className="py-2 text-sm text-right text-slate-500">{task.progress}%</TableCell>
                                                            </TableRow>
                                                        )) : (
                                                            <TableRow>
                                                                <TableCell className="text-center text-xs text-slate-400 py-4">No active tasks</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* TASKS TAB (Unassigned) */}
                    <TabsContent value="tasks" className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Task Backlog</h3>
                            {isProjectLeader && (
                                <AddTaskSheet projectId={project.id} onTaskCreated={fetchProject} />
                            )}
                        </div>
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-100 hover:bg-slate-50 bg-slate-50/50">
                                        <TableHead className="text-slate-900">Title</TableHead>
                                        <TableHead className="text-slate-900">Status</TableHead>
                                        <TableHead className="text-slate-900">Due Date</TableHead>
                                        <TableHead className="text-slate-900">Est. Hours</TableHead>
                                        {isProjectLeader && <TableHead className="text-right text-slate-900">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.length > 0 ? tasks.map(task => (
                                        <TableRow key={task.id} className="border-slate-100 hover:bg-slate-50">
                                            <TableCell className="font-medium text-slate-900">
                                                {task.title}
                                                {!task.assigned_to && <span className="ml-2 text-xs text-slate-400 font-normal">(Unassigned)</span>}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${task.status === 'DONE' ? 'bg-green-100 text-green-700' : task.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{task.status}</span>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{formatDate(task.due_date)}</TableCell>
                                            <TableCell className="text-slate-600">{task.estimated_hours}h</TableCell>
                                            {isProjectLeader && (
                                                <TableCell className="text-right"><DeleteTaskButton taskId={task.id} onTaskDeleted={fetchProject} /></TableCell>
                                            )}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={isProjectLeader ? 5 : 4} className="text-center text-slate-400 h-32">No tasks found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="schedule" className="mt-6">
                        <AvailabilityCalendar />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}