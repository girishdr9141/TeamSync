// src/components/AddTaskSheet.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// This component needs two "props" (inputs):
// 1. projectId: Which project to add this task to.
// 2. onTaskCreated: A function to call to refresh the task list.
export default function AddTaskSheet({ projectId, onTaskCreated }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [estimatedHours, setEstimatedHours] = useState(1);
    const [requiredSkills, setRequiredSkills] = useState(""); // We'll use a simple comma-separated string
    const [taskCategory, setTaskCategory] = useState("");
    
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const { api } = useAuth();

    const handleSubmit = async () => {
        setError(null);
        
        // This is the JSON object our backend expects for the 'task_data' field
        const task_data = {
            required_skills: requiredSkills.split(',').map(s => s.trim()), // "py, js" -> ["py", "js"]
            category: taskCategory
        };

        try {
            await api.post('/tasks/', {
                project: projectId,
                title: title,
                description: description,
                estimated_hours: parseInt(estimatedHours, 10),
                task_data: task_data,
                status: 'TODO' // Default status
            });
            
            // Success!
            setIsOpen(false); // Close the sheet
            onTaskCreated(); // Tell the parent page to refresh its data
            
            // Reset the form
            setTitle("");
            setDescription("");
            setEstimatedHours(1);
            setRequiredSkills("");
            setTaskCategory("");
            
        } catch (err) {
            console.error(err);
            setError("Failed to create task. Please check all fields.");
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    + Add Task
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-gray-900 border-gray-800 text-white overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-white">Create a New Task</SheetTitle>
                    <SheetDescription>
                        Fill in the details for the new task. It will be added to the project as 'To Do'.
                    </SheetDescription>
                </SheetHeader>
                
                <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-300">Task Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-gray-800 border-gray-700"
                            placeholder="e.g., 'Implement user login API'"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-300">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-gray-800 border-gray-700"
                            placeholder="A brief description of the task..."
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-gray-300">Task Category (for preferences)</Label>
                        <Input
                            id="category"
                            value={taskCategory}
                            onChange={(e) => setTaskCategory(e.target.value)}
                            className="bg-gray-800 border-gray-700"
                            placeholder="e.g., 'Frontend', 'Backend', 'Documentation'"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="skills" className="text-gray-300">Required Skills (comma-separated)</Label>
                        <Input
                            id="skills"
                            value={requiredSkills}
                            onChange={(e) => setRequiredSkills(e.target.value)}
                            className="bg-gray-800 border-gray-700"
                            placeholder="e.g., 'Python', 'React', 'Database'"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="hours" className="text-gray-300">Estimated Hours (Workload)</Label>
                        <Input
                            id="hours"
                            type="number"
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                            className="bg-gray-800 border-gray-700"
                            min="1"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </SheetClose>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Create Task</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}