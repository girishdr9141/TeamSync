// src/components/AvailabilityCalendar.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // <-- 1. ADD THIS IMPORT
import { Trash } from 'lucide-react';           // <-- 2. ADD THIS IMPORT

export default function AvailabilityCalendar() {
    const [events, setEvents] = useState([]);
    const { api } = useAuth();

    // Fetches existing availability
    const fetchAvailability = async () => {
        try {
            const response = await api.get('/availability/');
            const formattedEvents = response.data.map(slot => ({
                id: slot.id,
                title: 'Available',
                start: slot.start_time,
                end: slot.end_time,
                backgroundColor: '#16a34a',
                borderColor: '#16a34a'
            }));
            setEvents(formattedEvents);
        } catch (err) {
            console.error("Failed to fetch availability", err);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, []);

    // Handles creating a new slot
    const handleSelect = async (selectInfo) => {
        const newSlot = {
            start_time: selectInfo.startStr,
            end_time: selectInfo.endStr,
        };
        try {
            const response = await api.post('/availability/', newSlot);
            setEvents([...events, {
                id: response.data.id,
                title: 'Available',
                start: response.data.start_time,
                end: response.data.end_time,
                backgroundColor: '#16a34a',
                borderColor: '#16a34a'
            }]);
        } catch (err) {
            console.error("Failed to save availability", err);
        }
    };

    // Handles deleting a single slot
    const handleEventClick = async (clickInfo) => {
        if (window.confirm("Are you sure you want to delete this availability slot?")) {
            try {
                await api.delete(`/availability/${clickInfo.event.id}/`);
                clickInfo.event.remove();
            } catch (err) {
                console.error("Failed to delete slot", err);
            }
        }
    };

    // --- 3. ADD THIS NEW FUNCTION ---
    const handleClearAll = async () => {
        if (window.confirm("Are you sure you want to delete ALL your availability slots? This cannot be undone.")) {
            try {
                // Call our new backend endpoint
                await api.post('/availability/clear_all/');
                
                // On success, clear the events from the UI instantly
                setEvents([]); 
            } catch (err) {
                console.error("Failed to clear all slots", err);
                alert("Failed to clear all slots.");
            }
        }
    };

    return (
        <Card className="bg-gray-900 border-gray-800 text-white p-4">
            <style>
                {/* ... (your style tag is fine) ... */}
            </style>

            {/* --- 4. ADD THIS BUTTON --- */}
            <div className="flex justify-end mb-4">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Clear All My Slots
                </Button>
            </div>
            {/* --- END OF NEW BUTTON --- */}

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale="en-GB"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                dayHeaderFormat={{
                    day: '2-digit',
                    month: '2-digit'
                }}
                selectable={true}
                select={handleSelect}
                eventClick={handleEventClick}
                events={events}
            />
        </Card>
    );
}

// (The Card import you had at the bottom was fine, but it's cleaner at the top)