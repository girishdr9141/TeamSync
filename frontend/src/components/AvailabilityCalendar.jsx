// src/components/AvailabilityCalendar.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export default function AvailabilityCalendar() {
    const [events, setEvents] = useState([]);
    const { api } = useAuth();

    const fetchAvailability = async () => {
        try {
            const response = await api.get('/availability/');
            const formattedEvents = response.data.map(slot => ({
                id: slot.id,
                title: 'Available',
                start: slot.start_time,
                end: slot.end_time,
                backgroundColor: '#ecfccb',
                borderColor: '#65a30d',
                textColor: '#14532d'
            }));
            setEvents(formattedEvents);
        } catch (err) {
            console.error("Failed to fetch availability", err);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, []);

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
                backgroundColor: '#ecfccb',
                borderColor: '#65a30d',
                textColor: '#14532d'
            }]);
        } catch (err) {
            console.error("Failed to save availability", err);
        }
    };

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

    const handleClearAll = async () => {
        if (window.confirm("Are you sure you want to delete ALL your availability slots?")) {
            try {
                await api.post('/availability/clear_all/');
                setEvents([]); 
            } catch (err) {
                console.error("Failed to clear all slots", err);
                alert("Failed to clear all slots.");
            }
        }
    };

    return (
        <Card className="bg-white border-slate-200 text-slate-900 p-4 shadow-sm">
            <style>{`
                .fc-theme-standard td, .fc-theme-standard th { border-color: #e2e8f0; }
                .fc-col-header-cell-cushion { color: #0f172a; font-weight: 600; }
                .fc-timegrid-axis-cushion, .fc-timegrid-slot-label-cushion { color: #64748b; }
                .fc-button-primary { background-color: #0f172a !important; border-color: #0f172a !important; }
                .fc-button-primary:hover { background-color: #1e293b !important; }
                .fc-today-button { background-color: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
            `}</style>

            <div className="flex justify-end mb-4">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none"
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Clear All Slots
                </Button>
            </div>

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                timeZone="Asia/Kolkata"
                locale="en-GB"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                dayHeaderFormat={{ day: '2-digit', month: '2-digit' }}
                selectable={true}
                select={handleSelect}
                eventClick={handleEventClick}
                events={events}
                height="auto"
                slotMinTime="07:00:00"
                slotMaxTime="19:00:00"
                allDaySlot={false}
            />
        </Card>
    );
}