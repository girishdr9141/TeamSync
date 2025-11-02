// src/pages/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
    const { api, user, token } = useAuth(); // We need the user to get the profile
    
    // We'll store the skills and preferences as simple strings for the inputs
    const [skills, setSkills] = useState("");
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // This hook runs ONCE when the page loads
    useEffect(() => {
        if (user && user.profile) {
            // The 'user' object from our AuthContext *already* has the profile!
            // Let's parse the JSON data and set our form state.
            const { profile_data } = user.profile;
            
            // Convert skill/preference objects back into simple strings for the form
            // e.g., {"Python": 5} -> "Python:5"
            const skillsText = Object.entries(profile_data.skills || {}).map(([k, v]) => `${k}:${v}`).join(', ');
            const prefsText = Object.entries(profile_data.preferences || {}).map(([k, v]) => `${k}:${v}`).join(', ');
            
            setSkills(skillsText);
            setPreferences(prefsText);
            setLoading(false);
        }
    }, [user]); // Re-run if the user object ever changes

    const handleSave = async () => {
        setMessage("Saving...");
        
        // --- This is the key logic ---
        // We convert the string data back into the JSON format our backend wants.
        
        // 1. Parse Skills: "Python:5, React:4" -> {"Python": 5, "React": 4}
        const skillsObj = {};
        skills.split(',').forEach(pair => {
            const [key, value] = pair.split(':');
            if (key && value) {
                skillsObj[key.trim()] = parseInt(value.trim(), 10);
            }
        });
        
        // 2. Parse Preferences: "Backend:3, Frontend:5" -> {"Backend": 3, "Frontend": 5}
        const prefsObj = {};
        preferences.split(',').forEach(pair => {
            const [key, value] = pair.split(':');
            if (key && value) {
                prefsObj[key.trim()] = parseInt(value.trim(), 10);
            }
        });

        // 3. This is the final JSON payload
        const new_profile_data = {
            skills: skillsObj,
            preferences: prefsObj
        };

        try {
            // Call our new '/auth/profile/' endpoint
            await api.put('/auth/profile/', {
                profile_data: new_profile_data
                // We don't need to send 'current_workload', the serializer will ignore it
            });
            setMessage("Profile saved successfully!");
            // Note: We'd also need to update the user in AuthContext, but we'll do that later.
        } catch (err) {
            setMessage("Error saving profile.");
            console.error(err);
        }
    };

    if (loading) {
        return <p className="text-gray-400">Loading settings...</p>;
    }

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