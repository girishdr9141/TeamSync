// src/pages/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Icons
import { User, Code2, Save, Sparkles } from 'lucide-react';

export default function SettingsPage() {
    const { api, user, refreshUser } = useAuth();
    
    const [skills, setSkills] = useState("");
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.profile) {
            const data = user.profile.profile_data || {};
            const skillsText = Object.entries(data.skills || {}).map(([k, v]) => `${k}:${v}`).join(', ');
            const prefsText = Object.entries(data.preferences || {}).map(([k, v]) => `${k}:${v}`).join(', ');
            setSkills(skillsText);
            setPreferences(prefsText);
        }
        setLoading(false);
    }, [user]);

    const handleSave = async () => {
        const parseInput = (str) => {
            const obj = {};
            if (!str) return obj;
            str.split(',').forEach(pair => {
                const [key, val] = pair.split(':');
                if (key && val) obj[key.trim()] = parseInt(val.trim(), 10);
            });
            return obj;
        };

        const toastId = toast.loading("Saving profile...");
        try {
            const new_profile_data = {
                skills: parseInput(skills),
                preferences: parseInput(preferences)
            };
            await api.put('/auth/profile/', { profile_data: new_profile_data });
            await refreshUser(); 
            toast.success("Profile updated successfully!", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Failed to save profile.", { id: toastId });
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading settings...</div>;
    
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
                <p className="text-slate-500 mt-2 text-lg">Manage your profile, skills, and work preferences.</p>
            </div>

            <Separator className="bg-slate-200" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <Card className="bg-white border-slate-200 shadow-sm sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-900">My Profile</CardTitle>
                            <CardDescription>Your account identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center text-center space-y-4">
                            <div className="h-24 w-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <User className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-900">{user?.username}</h3>
                                <p className="text-sm text-slate-500">{user?.email || "No email connected"}</p>
                            </div>
                            <div className="w-full pt-4 border-t border-slate-100 mt-2">
                                <div className="text-xs font-medium text-slate-500 uppercase mb-2">System ID</div>
                                <code className="bg-slate-100 px-2 py-1 rounded text-sm text-slate-700 font-mono">{user?.id}</code>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Forms */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                                <Code2 className="w-5 h-5 text-indigo-600" />
                                Expertise & Skills
                            </CardTitle>
                            <CardDescription>Rate your technical skills (1-5).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="skills" className="text-slate-700 font-medium">Skill Matrix</Label>
                                {/* FIXED: Explicit white background and dark text */}
                                <Input
                                    id="skills"
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Python:5, React:3, SQL:4"
                                />
                                <p className="text-xs text-slate-500">Format: SkillName:Level (Comma separated)</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                Work Preferences
                            </CardTitle>
                            <CardDescription>Rate task types (1-5).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="preferences" className="text-slate-700 font-medium">Preference Matrix</Label>
                                {/* FIXED: Explicit white background and dark text */}
                                <Input
                                    id="preferences"
                                    value={preferences}
                                    onChange={(e) => setPreferences(e.target.value)}
                                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Backend:5, Documentation:1"
                                />
                                <p className="text-xs text-slate-500">Format: Type:Rating (Comma separated)</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}