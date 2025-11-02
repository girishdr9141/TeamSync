// src/components/AvailabilityCalendar.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // <-- for clicking/dragging

export default function AvailabilityCalendar() {
    const [events, setEvents] = useState([]);
    const { api } = useAuth();

    // 1. Fetch existing availability
    const fetchAvailability = async () => {
        try {
            const response = await api.get('/availability/');
            // Convert our slots into FullCalendar "event" objects
            const formattedEvents = response.data.map(slot => ({
                id: slot.id,
                title: 'Available',
                start: slot.start_time,
                end: slot.end_time,
                backgroundColor: '#16a34a', // Green
                borderColor: '#16a34a'
            }));
            setEvents(formattedEvents);
        } catch (err) {
            console.error("Failed to fetch availability", err);
        }
    };

    // 2. Run the fetch function when the component loads
    useEffect(() => {
        fetchAvailability();
    }, []);

    // 3. Handle creating a new slot (when user drags on the calendar)
    const handleSelect = async (selectInfo) => {
        // 'selectInfo' is an object from FullCalendar with start/end times
        const newSlot = {
            start_time: selectInfo.startStr,
            end_time: selectInfo.endStr,
        };

        try {
            // Save the new slot to our backend
            const response = await api.post('/availability/', newSlot);
            
            // Add the new event to our calendar UI
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

    // 4. Handle deleting a slot (when user clicks an event)
    const handleEventClick = async (clickInfo) => {
        if (window.confirm("Are you sure you want to delete this availability slot?")) {
            try {
                await api.delete(`/availability/${clickInfo.event.id}/`);
                // Remove the event from the UI
                clickInfo.event.remove();
            } catch (err) {
                console.error("Failed to delete slot", err);
            }
        }
    }

    return (
        <Card className="bg-gray-900 border-gray-800 text-white p-4">
            <style>
                {/* This is a small hack to make FullCalendar's theme dark */}
                {`
                    .fc { background-color: #1f2937 !important; color: #e5e7eb !important; border-color: #374151 !important; }
                    .fc .fc-toolbar-title { color: #ffffff !important; }
                    .fc .fc-daygrid-day-number { color: #9ca3af !important; }
                    .fc .fc-col-header-cell { background-color: #374151 !important; border-color: #4b5563 !important; }
                    .fc .fc-day { border-color: #374151 !important; }
                    .fc .fc-button { background-color: #3b82f6 !important; border: none !important; }
                `}
            </style>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek" // Show the week view
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                selectable={true}      // Allow dragging
                select={handleSelect}     // Function to call when user drags
                eventClick={handleEventClick} // Function to call when event is clicked
                events={events}         // Our list of availability slots
            />
        </Card>
    );
}

// We need to add Card to our imports
import { Card } from '@/components/ui/card';