// src/pages/LoginPage.js

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // We'll use our auth hook
import { useNavigate, Link } from 'react-router-dom'; // To redirect after login

// Import our new Shadcn/ui components
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function LoginPage() {
    // State to hold the form data
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Get the 'login' function from our AuthContext
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Stop the form from refreshing the page
        setError(null);
        setLoading(true);

        try {
            const success = await login(username, password);

            if (success) {
                // On success, send them to the main dashboard
                navigate('/');
            } else {
                setError('Invalid username or password.');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false); // Stop the loading spinner
        }
    };

    return (
        // This is our main page container.
        // 'min-h-screen' = Full height
        // 'flex items-center justify-center' = Center the content
        // 'bg-gray-950' = Our new dark background
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            
            {/* This is the login form "card" */}
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-xl">
                
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">
                        CTCR
                    </h1>
                    <p className="text-gray-400">Corporate Team Conflict Resolver</p>
                </div>
                
                {/* The Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Username Field */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-300">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="walterwhite"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                    
                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                    
                    {/* Submit Button */}
                    <div>
                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading} // Disable button while loading
                        >
                            {loading ? 'Logging in...' : 'Log In'}
                        </Button>
                    </div>
                </form>

                {/* Link to Register Page */}
                <p className="text-sm text-center text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-blue-500 hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}