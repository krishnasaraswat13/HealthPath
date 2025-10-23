import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Stethoscope, LogOut, Settings, X, 
    Search, RefreshCw, Printer, User, Save, Loader2, Brain, FileText, Building2,
    Sparkles, ClipboardList, Heart, Award
} from 'lucide-react';
import api, { getDoctorAppointments, getDoctorById, generateClinicalNotes, generateTreatmentPlan, generateMedicalCertificate, getAIFeedbackInsights } from '../services/api'; 
import { useSocket } from '../context/SocketContext';
import NotificationBell from '../components/NotificationBell';

// Import modular components
import { 
    UpNextCard, 
    ScheduleList, 
    ContextSidebar, 
    ConsultationRoom,
    PatientDrawer,
    PrescriptionPad
} from '../components/doctor';

const DoctorDashboardNew = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const [doctor, setDoctor] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } });
    
    // Data State
    const [appointments, setAppointments] = useState([]);
    const [chatSession, setChatSession] = useState(null);
    const [notifications, setNotifications] = useState([]);
    
    // Dashboard Logic State
    const [activeTab, setActiveTab] = useState('upcoming'); 
    const [selectedDate, setSelectedDate] = useState(null); 
    const [currentMonth, setCurrentMonth] = useState(new Date()); 
    const [patientNotes, setPatientNotes] = useState(() => { try { return JSON.parse(localStorage.getItem('doc_patient_notes')) || {}; } catch { return {}; } });
    const [searchQuery, setSearchQuery] = useState('');
    
    // Drawer/Modal State
    const [showPatientDrawer, setShowPatientDrawer] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    
    // AI & Form Data
    const [aiSummary, setAiSummary] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [profileData, setProfileData] = useState({ ...doctor });
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
    
    // NEW: AI Tools State
    const [showAIToolsPanel, setShowAIToolsPanel] = useState(false);
    const [aiToolResult, setAiToolResult] = useState('');
    const [aiToolLoading, setAiToolLoading] = useState(false);
    const [activeAITool, setActiveAITool] = useState(null);
    const [treatmentPlanForm, setTreatmentPlanForm] = useState({ diagnosis: '', patientAge: '', patientGender: '', symptoms: '' });
    const [certificateForm, setCertificateForm] = useState({ patientName: '', patientAge: '', diagnosis: '', startDate: '', endDate: '', purpose: '' });
    
    // Offline mode indicator
    const [isOffline, setIsOffline] = useState(doctor.status === 'offline');

    // --- FETCH DOCTOR PROFILE ---
    const fetchDoctorProfile = async () => {
        try {
            const doctorId = doctor._id || doctor.id;
            if (!doctorId) return;
            
            const res = await getDoctorById(doctorId);
            const freshDoctorData = res.data;
            
            const updatedDoctor = {
                ...doctor,
                averageRating: freshDoctorData.averageRating,
                totalRatings: freshDoctorData.totalRatings,
                reviews: freshDoctorData.reviews
            };
            
            setDoctor(updatedDoctor);
            setProfileData(updatedDoctor);
            localStorage.setItem('user', JSON.stringify(updatedDoctor));
        } catch (err) {
            console.error("Failed to fetch doctor profile", err);
        }
    };

    // --- INITIAL FETCH ---
    useEffect(() => {
        fetchAppointments();
        fetchDoctorProfile();
        
        const handleNotification = (data) => {
            setNotifications(prev => [{ message: data.message, time: 'Just now' }, ...prev.slice(0, 9)]);
            fetchAppointments(); 
        };

        if (socket && doctor._id) {
            socket.emit('join_room', doctor._id);
            socket.on('appointment_notification', handleNotification);
        }

        return () => { 
            if (socket) socket.off('appointment_notification', handleNotification); 
        };
    }, [socket, doctor._id]);

    const fetchAppointments = async () => {
        try {
            const res = await getDoctorAppointments();
            setAppointments(res.data);
        } catch (err) { console.error("Failed to load appointments", err); }
    };

    // --- STATS & ANALYTICS ---
    const stats = useMemo(() => {
        const completed = appointments.filter(a => a.status === 'completed');
        const uniquePatients = new Set(completed.map(a => a.patientId?._id)).size;
        const totalEarnings = completed.reduce((sum, appt) => sum + (appt.price || parseInt(doctor.fees) || 0), 0);
        
        // Today's stats
        const today = new Date().toDateString();
        const todayAppointments = appointments.filter(a => new Date(a.date).toDateString() === today);
        const todayCompleted = todayAppointments.filter(a => a.status === 'completed');
        const todayPending = todayAppointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
        const todayEarnings = todayCompleted.reduce((sum, appt) => sum + (appt.price || parseInt(doctor.fees) || 0), 0);
        
        // Next patient (sorted by time)
        const pendingAll = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
        const nextPatient = pendingAll.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            const timeA = a.timeSlot?.split(':').map(Number) || [0, 0];
            const timeB = b.timeSlot?.split(':').map(Number) || [0, 0];
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        })[0] || null;
        
        // Weekly chart data
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayAppts = completed.filter(a => new Date(a.date).toDateString() === date.toDateString());
            weeklyData.push({
                day: date.toLocaleDateString('en', { weekday: 'short' }),
                count: dayAppts.length,
                earnings: dayAppts.reduce((sum, a) => sum + (a.price || parseInt(doctor.fees) || 0), 0)
            });
        }
        
        return { 
            earnings: totalEarnings, 
            patients: uniquePatients, 
            rating: doctor.averageRating || 0,
            reviews: doctor.totalRatings || 0,
            completedCount: completed.length, 
            pendingCount: pendingAll.length, 
            chart: weeklyData,
            todayTotal: todayAppointments.length,
            todayCompleted: todayCompleted.length,
            todayPending: todayPending.length,
            todayEarnings: todayEarnings,
            nextPatient: nextPatient
        };
    }, [appointments, doctor]);

    // --- FILTERING ---
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;
        
        if (activeTab === 'upcoming') {
            filtered = filtered.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
        } else if (activeTab === 'pending') {
            filtered = filtered.filter(a => a.status === 'pending' || a.status === 'scheduled');
        } else {
            filtered = filtered.filter(a => a.status === 'completed' || a.status === 'cancelled');
        }
        
        if (selectedDate) {
            filtered = filtered.filter(a => new Date(a.date).toDateString() === selectedDate.toDateString());
        }
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a => 
                a.patientId?.name?.toLowerCase().includes(query) ||
                a.patientId?.email?.toLowerCase().includes(query) ||
                a.diagnosis?.toLowerCase().includes(query) ||
                a.timeSlot?.includes(query)
            );
        }
        
        return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [appointments, activeTab, selectedDate, searchQuery]);

    // --- HANDLERS ---
    const handleUpdateStatus = async (newStatus) => {
        try {
            const res = await api.put('/doctor/status', { status: newStatus });
            const updatedDoctor = { ...doctor, status: res.data.status };
            setDoctor(updatedDoctor);
            setIsOffline(newStatus === 'offline');
            localStorage.setItem('user', JSON.stringify(updatedDoctor));
            if (socket) socket.emit('doctorStatusUpdate', { id: doctor._id, status: newStatus });
        } catch (err) { alert('Status update failed'); }
    };

    const handleStartChat = (appointment) => {
        if (socket) socket.emit('start_session', { patientId: appointment.patientId._id, doctorId: doctor._id, doctorName: doctor.name });
        setChatSession({ partner: appointment.patientId, sessionId: `${appointment.patientId._id}-${doctor._id}`, appointment: appointment });
    };

    const handleStartVideoCall = (appointment) => {
        navigate(`/video-call/${appointment._id}`, {
            state: {
                appointmentInfo: {
                    patientName: appointment.patientId.name,
                    timeSlot: appointment.timeSlot,
                    date: appointment.date
                }
            }
        });
    };

    const handleSendReminder = (appointment) => {
        if (socket) {
            socket.emit('send_appointment_reminder', {
                patientId: appointment.patientId._id,
                patientName: appointment.patientId.name,
                doctorId: doctor._id,
                doctorName: doctor.name,
                date: new Date(appointment.date).toLocaleDateString(),
                time: appointment.timeSlot,
                appointmentId: appointment._id
            });
            setNotifications(prev => [{ message: `Reminder sent to ${appointment.patientId.name}`, time: 'Just now' }, ...prev]);
        }
    };

    const handleReschedule = async (e) => {
        e.preventDefault();
        if (!rescheduleData.date || !rescheduleData.time) {
            alert('Please select a date and time slot');
            return;
        }
        try {
            await api.put('/appointments/reschedule', {
                appointmentId: selectedAppointment._id,
                date: rescheduleData.date,
                timeSlot: rescheduleData.time
            });
            setAppointments(prev => prev.map(a =>
                a._id === selectedAppointment._id
                    ? { ...a, date: rescheduleData.date, timeSlot: rescheduleData.time, status: 'scheduled' }
                    : a
            ));
            setShowRescheduleModal(false);
            alert('Appointment rescheduled successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reschedule appointment');
        }
    };

    const handleSaveNote = (patientId, note) => {
        const newNotes = { ...patientNotes, [patientId]: note };
        setPatientNotes(newNotes);
        localStorage.setItem('doc_patient_notes', JSON.stringify(newNotes));
    };

    const handleComplete = async (consultationData) => {
        try {
            await api.post('/appointments/complete', { 
                appointmentId: selectedAppointment._id, 
                ...consultationData 
            });
            
            setAppointments(prev => prev.map(a => 
                a._id === selectedAppointment._id 
                    ? { ...a, status: 'completed', diagnosis: consultationData.diagnosis, prescription: consultationData.prescription } 
                    : a
            ));
            setShowCompleteModal(false);
            setChatSession(null);
            fetchDoctorProfile();
        } catch (err) { alert("Failed to save."); }
    };

    const handleLogout = () => {
        handleUpdateStatus('offline');
        localStorage.clear();
        if (socket) socket.disconnect();
        navigate('/');
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/doctor/update-profile', profileData);
            setDoctor(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
            setShowProfileModal(false);
        } catch (err) {
            alert('Failed to save profile. Changes saved locally only.');
            setDoctor(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
            setShowProfileModal(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Cancel this appointment?")) return;
        try {
            await api.delete(`/appointments/${id}`);
            setAppointments(prev => prev.filter(a => a._id !== id));
        } catch(err) { alert("Failed to cancel"); }
    };

    const handleGenerateAISummary = async (appt) => {
        setSelectedAppointment(appt);
        setShowAIModal(true);
        setAiLoading(true);
        setAiSummary("");
        try {
            const validDoctorId = doctor._id || doctor.id; 
            const validPatientId = appt.patientId._id || appt.patientId.id;

            const res = await api.post('/ai/summarize', {
                patientId: validPatientId,
                doctorId: validDoctorId,
                context: "doctor_view"
            });

            setAiSummary(res.data.success ? res.data.summary : "Could not generate summary.");
        } catch (err) { setAiSummary("AI Service Unavailable."); } 
        finally { setAiLoading(false); }
    };

    const handleDownloadPrescription = () => {
        alert("Downloading Prescription PDF... (Demo Feature)");
    };

    // ===== NEW AI TOOLS HANDLERS =====
    const handleGenerateClinicalNotes = async (appointmentId) => {
        setShowAIToolsPanel(true);
        setActiveAITool('clinical-notes');
        setAiToolLoading(true);
        setAiToolResult('');
        try {
            const res = await generateClinicalNotes(appointmentId);
            setAiToolResult(res.data.clinicalNotes);
        } catch (err) { setAiToolResult('Failed to generate clinical notes.'); }
        finally { setAiToolLoading(false); }
    };

    const handleGenerateTreatmentPlan = async () => {
        setAiToolLoading(true);
        setAiToolResult('');
        try {
            const res = await generateTreatmentPlan(treatmentPlanForm);
            setAiToolResult(res.data.treatmentPlan);
        } catch (err) { setAiToolResult('Failed to generate treatment plan.'); }
        finally { setAiToolLoading(false); }
    };

    const handleGenerateCertificate = async () => {
        setAiToolLoading(true);
        setAiToolResult('');
        try {
            const res = await generateMedicalCertificate(certificateForm);
            setAiToolResult(res.data.certificate);
        } catch (err) { setAiToolResult('Failed to generate certificate.'); }
        finally { setAiToolLoading(false); }
    };

    const handleFeedbackInsights = async () => {
        setShowAIToolsPanel(true);
        setActiveAITool('feedback-insights');
        setAiToolLoading(true);
        setAiToolResult('');
        try {
            const res = await getAIFeedbackInsights();
            setAiToolResult(res.data.insights);
        } catch (err) { setAiToolResult('Failed to analyze feedback.'); }
        finally { setAiToolLoading(false); }
    };

    const handleViewPatient = (patient) => {
        setSelectedPatient(patient);
        setShowPatientDrawer(true);
    };

    const handleOpenComplete = (apt) => {
        setSelectedAppointment(apt);
        setShowCompleteModal(true);
    };

    const handleOpenReschedule = (apt) => {
        setSelectedAppointment(apt);
        setShowRescheduleModal(true);
    };

    return (
        <div className={`h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30 flex flex-col overflow-hidden font-sans text-gray-900 ${isOffline ? 'grayscale-[30%]' : ''}`}>
            
            {/* HEADER - Minimal Navigation */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 h-14 flex items-center justify-between px-6 shadow-sm z-30 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-sky-600 to-cyan-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/20">
                        <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 tracking-tight">Dr. {doctor.name}</h1>
                        <p className="text-[10px] text-gray-500">{doctor.specialization}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm w-48 focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    
                    {/* Status Toggle */}
                    <button 
                        onClick={() => handleUpdateStatus(isOffline ? 'online' : 'offline')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                            isOffline 
                                ? 'bg-gray-200 text-gray-600' 
                                : 'bg-green-100 text-green-700'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`} />
                        {isOffline ? 'Offline' : 'Online'}
                    </button>
                    
                    <button 
                        onClick={() => { fetchAppointments(); fetchDoctorProfile(); }} 
                        className="p-2 text-gray-500 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    <NotificationBell onNavigate={navigate} variant="dark" />
                    
                    <button 
                        onClick={() => navigate('/doctor/pharmacy')} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition text-xs font-semibold"
                        title="Pharmacy Network"
                    >
                        <Building2 className="w-4 h-4" /> Pharmacy
                    </button>

                    <button 
                        onClick={() => { setShowAIToolsPanel(true); setActiveAITool('menu'); setAiToolResult(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition text-xs font-semibold"
                        title="Smart Clinical Tools"
                    >
                        <Sparkles className="w-4 h-4" /> Smart Tools
                    </button>
                    
                    <button 
                        onClick={() => setShowProfileModal(true)} 
                        className="p-2 text-gray-500 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    
                    <button 
                        onClick={handleLogout} 
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT - 3-Pane Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* MAIN STAGE (65%) */}
                <main className="flex-1 flex flex-col p-6 overflow-hidden bg-gray-50/50">
                    {chatSession ? (
                        // Immersive Consultation Mode
                        <ConsultationRoom
                            chatSession={chatSession}
                            doctor={doctor}
                            appointments={appointments}
                            patientNotes={patientNotes}
                            onSaveNote={handleSaveNote}
                            onEndChat={() => setChatSession(null)}
                            onComplete={(data) => {
                                handleComplete(data);
                            }}
                            onAISummary={handleGenerateAISummary}
                            aiSummary={aiSummary}
                            aiLoading={aiLoading}
                        />
                    ) : (
                        <>
                            {/* Up Next Card */}
                            <div className="mb-6 shrink-0">
                                <UpNextCard 
                                    nextPatient={stats.nextPatient}
                                    appointments={appointments}
                                    onStartVideo={handleStartVideoCall}
                                    onViewPatient={handleViewPatient}
                                />
                            </div>
                            
                            {/* Schedule List */}
                            <ScheduleList 
                                appointments={filteredAppointments}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                stats={stats}
                                doctor={doctor}
                                onStartChat={handleStartChat}
                                onStartVideo={handleStartVideoCall}
                                onSendReminder={handleSendReminder}
                                onReschedule={handleOpenReschedule}
                                onCancel={handleCancel}
                                onComplete={handleOpenComplete}
                                onEdit={handleOpenComplete}
                                onAISummary={handleGenerateAISummary}
                                onDownload={handleDownloadPrescription}
                                onViewPatient={handleViewPatient}
                            />
                        </>
                    )}
                </main>
                
                {/* CONTEXT SIDEBAR (30%) - Hide during consultation */}
                {!chatSession && (
                    <ContextSidebar 
                        doctor={doctor}
                        stats={stats}
                        appointments={appointments}
                        notifications={notifications}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                    />
                )}
            </div>

            {/* DRAWERS & MODALS */}
            
            {/* Patient Drawer (Slide-over) */}
            <PatientDrawer 
                patient={selectedPatient}
                isOpen={showPatientDrawer}
                onClose={() => setShowPatientDrawer(false)}
                appointments={appointments}
                patientNotes={patientNotes}
                onSaveNote={handleSaveNote}
            />

            {/* Complete Appointment Modal */}
            {showCompleteModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-sky-600 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Finalize Consultation
                            </h3>
                            <button onClick={() => setShowCompleteModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
                            <PrescriptionPad 
                                appointment={selectedAppointment}
                                onComplete={handleComplete}
                                onCancel={() => setShowCompleteModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* AI Summary Modal */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Brain className="text-teal-600 w-5 h-5"/> Patient Case Summary
                            </h2>
                            <button onClick={() => setShowAIModal(false)}>
                                <X className="w-5 h-5 text-gray-500"/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-teal-50 to-sky-50 p-4 rounded-xl border border-teal-100 text-sm leading-relaxed text-gray-700">
                            {aiLoading ? (
                                <div className="flex flex-col items-center justify-center h-40">
                                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-2"/>
                                    <p className="text-gray-400">Analyzing conversation...</p>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{aiSummary}</div>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end shrink-0">
                            <button onClick={() => setShowAIModal(false)} className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Reschedule Appointment</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Select a new date and time for {selectedAppointment?.patientId?.name}.
                        </p>
                        <form onSubmit={handleReschedule} className="space-y-4">
                            <input 
                                type="date" 
                                required 
                                className="w-full p-3 bg-gray-50 border rounded-xl" 
                                onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} 
                            />
                            <input 
                                type="time" 
                                required 
                                className="w-full p-3 bg-gray-50 border rounded-xl" 
                                onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})} 
                            />
                            <div className="flex gap-2 justify-end mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowRescheduleModal(false)} 
                                    className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-2 bg-sky-600 text-white rounded-lg font-bold shadow-lg shadow-sky-200"
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <User className="text-sky-600"/> Edit Profile
                            </h2>
                            <button onClick={() => setShowProfileModal(false)}>
                                <X className="w-5 h-5 text-gray-500"/>
                            </button>
                        </div>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border rounded-lg" 
                                    value={profileData.name} 
                                    onChange={e => setProfileData({...profileData, name: e.target.value})} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Specialization</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border rounded-lg" 
                                        value={profileData.specialization} 
                                        onChange={e => setProfileData({...profileData, specialization: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Experience (Yrs)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border rounded-lg" 
                                        value={profileData.experience} 
                                        onChange={e => setProfileData({...profileData, experience: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Clinic Address</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border rounded-lg" 
                                    value={profileData.address} 
                                    onChange={e => setProfileData({...profileData, address: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Consultation Fees ($)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 border rounded-lg" 
                                    value={profileData.fees} 
                                    onChange={e => setProfileData({...profileData, fees: e.target.value})} 
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4"/> Save Profile
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* AI TOOLS PANEL */}
            {showAIToolsPanel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-600 to-sky-600 text-white px-6 py-4 flex justify-between items-center shrink-0">
                            <h3 className="font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5" /> Clinical Smart Toolkit
                            </h3>
                            <button onClick={() => setShowAIToolsPanel(false)}><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeAITool === 'menu' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setActiveAITool('treatment-plan')} className="p-5 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-200 text-left transition group">
                                        <Heart className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition" />
                                        <h4 className="font-bold text-gray-800">Treatment Plan Generator</h4>
                                        <p className="text-xs text-gray-500 mt-1">AI creates comprehensive treatment plans from diagnosis</p>
                                    </button>
                                    <button onClick={() => setActiveAITool('certificate')} className="p-5 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-200 text-left transition group">
                                        <ClipboardList className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition" />
                                        <h4 className="font-bold text-gray-800">Medical Certificate</h4>
                                        <p className="text-xs text-gray-500 mt-1">Generate official medical certificates instantly</p>
                                    </button>
                                    <button onClick={handleFeedbackInsights} className="p-5 bg-amber-50 hover:bg-amber-100 rounded-2xl border border-amber-200 text-left transition group">
                                        <Award className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition" />
                                        <h4 className="font-bold text-gray-800">Feedback Insights</h4>
                                        <p className="text-xs text-gray-500 mt-1">AI analyzes your patient feedback trends</p>
                                    </button>
                                    <button onClick={() => setActiveAITool('clinical-notes-form')} className="p-5 bg-teal-50 hover:bg-teal-100 rounded-2xl border border-teal-200 text-left transition group">
                                        <FileText className="w-8 h-8 text-teal-600 mb-2 group-hover:scale-110 transition" />
                                        <h4 className="font-bold text-gray-800">Clinical Notes (SOAP)</h4>
                                        <p className="text-xs text-gray-500 mt-1">Auto-generate SOAP notes from appointment data</p>
                                    </button>
                                </div>
                            )}

                            {activeAITool === 'treatment-plan' && !aiToolResult && (
                                <div className="space-y-4">
                                    <button onClick={() => setActiveAITool('menu')} className="text-sm text-teal-600 font-bold hover:underline">&larr; Back to tools</button>
                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Heart className="w-5 h-5 text-blue-600" /> Generate Treatment Plan</h3>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Diagnosis *" value={treatmentPlanForm.diagnosis} onChange={e => setTreatmentPlanForm({...treatmentPlanForm, diagnosis: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-200" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="number" placeholder="Patient Age" value={treatmentPlanForm.patientAge} onChange={e => setTreatmentPlanForm({...treatmentPlanForm, patientAge: e.target.value})} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-200" />
                                            <select value={treatmentPlanForm.patientGender} onChange={e => setTreatmentPlanForm({...treatmentPlanForm, patientGender: e.target.value})} className="p-3 border rounded-xl outline-none bg-white">
                                                <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <textarea placeholder="Current Symptoms" value={treatmentPlanForm.symptoms} onChange={e => setTreatmentPlanForm({...treatmentPlanForm, symptoms: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-200 h-24 resize-none" />
                                        <button onClick={handleGenerateTreatmentPlan} disabled={aiToolLoading || !treatmentPlanForm.diagnosis} className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                            {aiToolLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Plan</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeAITool === 'certificate' && !aiToolResult && (
                                <div className="space-y-4">
                                    <button onClick={() => setActiveAITool('menu')} className="text-sm text-teal-600 font-bold hover:underline">&larr; Back to tools</button>
                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-emerald-600" /> Generate Medical Certificate</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="Patient Name *" value={certificateForm.patientName} onChange={e => setCertificateForm({...certificateForm, patientName: e.target.value})} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-200" />
                                            <input type="number" placeholder="Age" value={certificateForm.patientAge} onChange={e => setCertificateForm({...certificateForm, patientAge: e.target.value})} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-200" />
                                        </div>
                                        <input type="text" placeholder="Diagnosis / Condition *" value={certificateForm.diagnosis} onChange={e => setCertificateForm({...certificateForm, diagnosis: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-200" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><label className="text-xs text-gray-500 mb-1 block">From Date</label><input type="date" value={certificateForm.startDate} onChange={e => setCertificateForm({...certificateForm, startDate: e.target.value})} className="w-full p-3 border rounded-xl outline-none" /></div>
                                            <div><label className="text-xs text-gray-500 mb-1 block">To Date</label><input type="date" value={certificateForm.endDate} onChange={e => setCertificateForm({...certificateForm, endDate: e.target.value})} className="w-full p-3 border rounded-xl outline-none" /></div>
                                        </div>
                                        <select value={certificateForm.purpose} onChange={e => setCertificateForm({...certificateForm, purpose: e.target.value})} className="w-full p-3 border rounded-xl outline-none bg-white">
                                            <option value="">Purpose</option><option value="Medical Leave">Medical Leave</option><option value="Fitness Certificate">Fitness Certificate</option><option value="Travel Fitness">Travel Fitness</option><option value="Sports Fitness">Sports Fitness</option>
                                        </select>
                                        <button onClick={handleGenerateCertificate} disabled={aiToolLoading || !certificateForm.patientName} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                            {aiToolLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Certificate</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeAITool === 'clinical-notes-form' && !aiToolResult && (
                                <div className="space-y-4">
                                    <button onClick={() => setActiveAITool('menu')} className="text-sm text-teal-600 font-bold hover:underline">&larr; Back to tools</button>
                                    <h3 className="font-bold text-lg text-gray-800">Generate Clinical Notes</h3>
                                    <p className="text-sm text-gray-500">Select a completed appointment to generate SOAP notes from:</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {appointments.filter(a => a.status === 'completed').length === 0 && <p className="text-gray-400 text-sm italic">No completed appointments.</p>}
                                        {appointments.filter(a => a.status === 'completed').map(apt => (
                                            <button key={apt._id} onClick={() => handleGenerateClinicalNotes(apt._id)} className="w-full p-3 bg-gray-50 hover:bg-teal-50 rounded-xl border text-left transition flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm">{apt.patientId?.name}</p>
                                                    <p className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString()} | {apt.diagnosis || 'No diagnosis'}</p>
                                                </div>
                                                <FileText className="w-4 h-4 text-teal-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI RESULT DISPLAY */}
                            {aiToolResult && (
                                <div className="space-y-4">
                                    <button onClick={() => { setActiveAITool('menu'); setAiToolResult(''); }} className="text-sm text-teal-600 font-bold hover:underline">&larr; Back to tools</button>
                                    <div className="bg-gradient-to-br from-teal-50 to-sky-50 p-5 rounded-xl border border-teal-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                                        {aiToolResult}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => navigator.clipboard.writeText(aiToolResult)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200">Copy to Clipboard</button>
                                        <button onClick={() => { setActiveAITool('menu'); setAiToolResult(''); }} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700">Done</button>
                                    </div>
                                </div>
                            )}

                            {aiToolLoading && !aiToolResult && (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
                                    <p className="text-gray-500 font-medium">AI is working...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboardNew;

