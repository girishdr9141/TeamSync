// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Icons
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  Shield,
  Briefcase
} from 'lucide-react';

// --- INTERNAL COMPONENT: DYNAMIC GREETING ---
const Greeting = ({ username }) => {
    const hour = new Date().getHours();
    let greeting = "Welcome back";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    else greeting = "Good evening";

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {greeting}, <span className="text-slate-600">{username}</span>.
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
                Here is your overview for today.
            </p>
        </div>
    );
};

// --- INTERNAL COMPONENT: STAT CARD ---
const StatCard = ({ title, value, subtext, icon: Icon, alert = false, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
    >
        <Card className={`bg-white border-slate-200 shadow-sm ${alert ? 'border-red-200 bg-red-50' : 'hover:border-slate-300'} transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${alert ? 'text-red-500' : 'text-slate-400'}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-3xl font-bold ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
                <p className="text-xs text-slate-500 mt-1">{subtext}</p>
            </CardContent>
        </Card>
    </motion.div>
);

export default function DashboardPage() {
    const { user, api, refreshUser } = useAuth();
    const [myTasks, setMyTasks] = useState([]);
    const [projectsCount, setProjectsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // 1. Refresh user data
                await refreshUser();

                // 2. Fetch "My Tasks"
                const tasksRes = await api.get('/tasks/my_tasks/');
                setMyTasks(tasksRes.data);

                // 3. Fetch Projects count
                const projectsRes = await api.get('/projects/');
                setProjectsCount(projectsRes.data.length);

            } catch (err) {
                console.error("Failed to load dashboard", err);
                toast.error("Failed to synchronize dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadDashboardData();
        }
    }, []); 

    // --- FUNCTION TO UPDATE PROGRESS ---
    const updateTaskProgress = async (taskId, newProgress) => {
        // 1. Optimistic Update (Update UI immediately)
        setMyTasks(prevTasks => 
            prevTasks.map(t => t.id === taskId ? { ...t, progress: newProgress } : t)
        );

        // 2. API Call (Debounce could be added here if needed, but for now direct is fine for simple usage)
        try {
            await api.patch(`/tasks/${taskId}/`, { progress: newProgress });
            // Optional: toast.success("Progress updated");
        } catch (error) {
            toast.error("Failed to save progress");
            // Revert on failure
            refreshUser(); 
        }
    };

    if (loading || !user) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-500">Loading...</div>;
    }

    // Calculations
    const activeTasks = myTasks.filter(t => t.status !== 'DONE');
    const overdueTasks = myTasks.filter(t => t.status === 'OVERDUE');
    const currentWorkload = user.profile?.remaining_workload || 0;
    const strikeCount = user.profile?.strike_count || 0;
    const isDangerZone = strikeCount > 2;

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                <Greeting username={user.username} />

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Active Tasks" 
                        value={activeTasks.length} 
                        subtext={`${overdueTasks.length} overdue`}
                        icon={Zap}
                        delay={0.1}
                    />
                    <StatCard 
                        title="Current Workload" 
                        value={`${currentWorkload.toFixed(1)}h`} 
                        subtext="Estimated remaining effort"
                        icon={Clock}
                        delay={0.2}
                    />
                    <StatCard 
                        title="Active Projects" 
                        value={projectsCount} 
                        subtext="Workspaces you belong to"
                        icon={Briefcase}
                        delay={0.3}
                    />
                    <StatCard 
                        title="Strike Status" 
                        value={strikeCount} 
                        subtext={isDangerZone ? "CRITICAL LEVEL" : "Keep it at zero"}
                        icon={Shield}
                        alert={strikeCount > 0}
                        delay={0.4}
                    />
                </div>

                {/* --- MAIN CONTENT SPLIT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    
                    {/* LEFT COLUMN: MY TASK QUEUE (2/3 width) */}
                    <motion.div 
                        className="lg:col-span-2 space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-slate-500" />
                                My Tasks
                            </h2>
                            <Link to="/projects">
                                <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">View Projects</Button>
                            </Link>
                        </div>

                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            {activeTasks.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {activeTasks.map((task) => (
                                        <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
                                            
                                            {/* Task Info */}
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900">
                                                        {task.title}
                                                    </h3>
                                                    {task.status === 'OVERDUE' && (
                                                        <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>
                                                    )}
                                                    {task.status === 'IN_PROGRESS' && (
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-[10px]">IN PROGRESS</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Due: {new Date(task.due_date).toLocaleDateString()} • {task.estimated_hours}h est.
                                                </p>
                                            </div>
                                            
                                            {/* Interactive Progress Bar */}
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="flex-1 sm:w-40">
                                                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                                                        <span>Progress</span>
                                                        <span className="font-medium text-slate-900">{task.progress}%</span>
                                                    </div>
                                                    
                                                    {/* Custom Range Slider */}
                                                    <input 
                                                        type="range" 
                                                        min="0" 
                                                        max="100" 
                                                        step="10"
                                                        value={task.progress}
                                                        onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                                                    />
                                                </div>
                                                
                                                <Link to={`/projects/${task.project}`}>
                                                    <Button size="icon" variant="outline" className="h-9 w-9 border-slate-200 hover:bg-white hover:border-slate-400 text-slate-400 hover:text-slate-900">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                                    <CheckCircle2 className="w-12 h-12 mb-4 text-green-500" />
                                    <h3 className="text-lg font-medium text-slate-900">All caught up</h3>
                                    <p className="max-w-xs mx-auto mt-2">
                                        You have no active tasks. Check your projects for new assignments.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    {/* RIGHT COLUMN: ALERTS & ACTIONS (1/3 width) */}
                    <motion.div 
                        className="space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h2 className="text-xl font-bold text-slate-900">System Status</h2>
                        
                        {/* STRIKE ALERT CARD */}
                        {strikeCount > 0 ? (
                            <Card className="bg-red-50 border-red-200 border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                                        <AlertTriangle className="h-5 w-5" />
                                        Attention Needed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-red-600 mb-2">
                                        You have {strikeCount} strike(s) on your record.
                                    </p>
                                    <p className="text-xs text-red-500">
                                        Strikes affect your future task assignments score. Complete overdue tasks immediately.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                             <Card className="bg-green-50 border-green-200 border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-green-700 flex items-center gap-2 text-lg">
                                        <Shield className="h-5 w-5" />
                                        Excellent Standing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-green-600">
                                        Zero strikes. Your reliability score is optimized for high-priority assignments.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-slate-900 text-base">Quick Access</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link to="/projects">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <Briefcase className="mr-2 h-4 w-4 text-slate-500" /> All Projects
                                    </Button>
                                </Link>
                                <Link to="/settings">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <Zap className="mr-2 h-4 w-4 text-slate-500" /> Update Skills
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                    </motion.div>
                </div>
            </div>
        </div>
    );
}