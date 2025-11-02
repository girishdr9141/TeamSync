// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// We can re-use the same Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { register } = useAuth(); // Get the 'register' function
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const success = await register(username, password, email); // Call the register function

            if (success) {
                navigate('/'); // On success, send them to the main dashboard
            } else {
                setError('Registration failed. Username may already exist.');
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-xl">
                
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">
                        Create Account
                    </h1>
                    <p className="text-gray-400">Join the Corporate Team Conflict Resolver</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Username Field */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-300">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="jessepinkman"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="bg-gray-800 border-gray-700 text-white"
                        />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="jesse@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-800 border-gray-700 text-white"
                        />
                    </div>
                    
                    {/* Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-300">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-gray-800 border-gray-700 text-white"
                        />
                    </div>
                    
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                    
                    <div>
                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Register'}
                        </Button>
                    </div>
                </form>

                {/* Link to Login Page */}
                <p className="text-sm text-center text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-blue-500 hover:underline">
                        Log in here
                    </Link>
                </p>
            </div>
        </div>
    );
}