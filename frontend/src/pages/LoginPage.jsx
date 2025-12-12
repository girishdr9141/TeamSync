// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { TeamSyncLogo } from '@/components/ui/logo'; // Assuming you have this
import { toast } from 'sonner';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            toast.success("Welcome back!");
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error("Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center flex flex-col items-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4">
                        <TeamSyncLogo className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in to your TeamSync workspace
                    </p>
                </div>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Credentials</CardTitle>
                        <CardDescription>Enter your username and password to continue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input 
                                    id="username" 
                                    placeholder="e.g. johndoe" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-white border-slate-300 focus:ring-slate-400 text-slate-900"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white border-slate-300 focus:ring-slate-400 text-slate-900"
                                    required
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white" 
                                disabled={loading}
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-slate-100 pt-6">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                                Create one
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}