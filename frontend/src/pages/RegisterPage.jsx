// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

// UI Components
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TeamSyncLogo } from '@/components/ui/logo';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const success = await register(username, password, email); 

            if (success) {
                toast.success("Account Created!", {
                    description: "Welcome to TeamSync. Redirecting...",
                });
                navigate('/'); 
            } else {
                toast.error("Registration Failed", {
                    description: "Username or email may already exist."
                });
            }
        } catch (err) {
            toast.error("An error occurred", {
                description: "Please try again later."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                
                {/* Header Section */}
                <div className="text-center flex flex-col items-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4">
                        <TeamSyncLogo className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Join your team on TeamSync
                    </p>
                </div>

                {/* Registration Card */}
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Sign Up</CardTitle>
                        <CardDescription>Enter your details below to get started.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input 
                                    id="username"
                                    placeholder="jessepinkman" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-white border-slate-300 focus:ring-slate-400 text-slate-900"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email"
                                    type="email"
                                    placeholder="jesse@example.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white border-slate-300 focus:ring-slate-400 text-slate-900"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
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
                                disabled={isLoading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-2"
                            >
                                {isLoading ? "Creating Account..." : "Create Account"}
                            </Button>
                        </form>
                    </CardContent>
                    
                    <CardFooter className="flex-col space-y-4 border-t border-slate-100 pt-6">
                        <div className="text-center text-sm text-slate-500">
                            Already have an account?{" "}
                            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                                Log in
                            </Link>
                        </div>
                        <p className="text-center text-xs text-slate-400 px-8">
                            By clicking create account, you agree to our{" "}
                            <Link to="#" className="underline hover:text-slate-500">Terms of Service</Link>{" "}
                            and{" "}
                            <Link to="#" className="underline hover:text-slate-500">Privacy Policy</Link>.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}