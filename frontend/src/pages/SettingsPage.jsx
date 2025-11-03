// src/pages/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
    const { api, user, refreshUser } = useAuth();
    
    const [skills, setSkills] = useState("");
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // This hook runs when the 'user' object from context changes
    useEffect(() => {
        setLoading(false); 
        if (user && user.profile && user.profile.profile_data) {
            const { profile_data } = user.profile;
            
            // This part correctly reads data from the profile
            const skillsText = Object.entries(profile_data.skills || {}).map(([k, v]) => `${k}:${v}`).join(', '); 
            const prefsText = Object.entries(profile_data.preferences || {}).map(([k, v]) => `${k}:${v}`).join(', '); 
            
            setSkills(skillsText); 
            setPreferences(prefsText); 
        }
    }, [user]); // Re-run if the user object ever changes

    const handleSave = async () => {
        setMessage("Saving...");
        
        // --- 1. Parse Skills (from the 'skills' state) ---
        const skillsObj = {};
        skills.split(',').forEach(pair => {
            const [key, value] = pair.split(':');
            if (key && value) {
                skillsObj[key.trim()] = parseInt(value.trim(), 10);
            }
        });
        
        // --- 2. THIS IS THE FIX: Parse Preferences (from the 'preferences' state) ---
        // The bug was here. We must read from the 'preferences' state variable.
        const prefsObj = {};
        preferences.split(',').forEach(pair => {
            const [key, value] = pair.split(':');
            if (key && value) {
                prefsObj[key.trim()] = parseInt(value.trim(), 10);
            }
        });

        // 3. This is the new JSON object to save
        const new_profile_data = {
            skills: skillsObj,
            preferences: prefsObj // Now this is using the correct 'prefsObj'
        };

        try {
            // 4. Save the new data
            await api.put('/auth/profile/', {
                profile_data: new_profile_data
            });
            
            // 5. Refresh the user in our global state
            await refreshUser(); 
            
            setMessage("Profile saved successfully!");
            
        } catch (err) {
            setMessage("Error saving profile.");
            console.error(err);
        }
    };

    if (loading) {
        return <p className="text-gray-400">Loading settings...</p>;
    }
    
    // The rest of your JSX/return is 100% correct
    return (
        <div className="space-y-8 max-w-2xl">
            <h2 className="text-3xl font-bold text-white">Your Profile & Skills</h2>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="skills" className="text-lg">Your Skills (e.g., Python:5, React:3, SQL:4)</Label>
                    <p className="text-sm text-gray-400">
                        Rate your skills from 1 (Beginner) to 5 (Expert). Use comma-separated pairs.
                    </p>
                    <Input
                        id="skills"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="Python:5, React:3"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="preferences" className="text-lg">Task Preferences (e.g., Backend:5, Frontend:1)</Label>
                    <p className="text-sm text-gray-400">
                        Rate what you like from 1 (Dislike) to 5 (Love). Use comma-separated pairs.
                    </p>
                    <Input
                        id="preferences"
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="Backend:5, Documentation:1"
                    />
                </div>
                
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    Save Profile
                </Button>
                
                {message && <p className="text-green-400">{message}</p>}
            </div>
        </div>
    );
}