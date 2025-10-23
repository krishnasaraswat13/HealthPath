import React, { useState } from 'react';
import { 
    X, User, FileText, Brain, Clock, Loader2, 
    CheckCircle, History, StickyNote
} from 'lucide-react';
import StreamChatWindow from '../StreamChatWindow';
import PrescriptionPad from './PrescriptionPad';

const ConsultationRoom = ({ 
    chatSession, 
    doctor, 
    appointments,
    patientNotes,
    onSaveNote,
    onEndChat,
    onComplete,
    onAISummary,
    aiSummary,
    aiLoading
}) => {
    const [activeTab, setActiveTab] = useState('current');
    const [showFinalizePanel, setShowFinalizePanel] = useState(false);
    
    const patient = chatSession?.partner;
    const appointment = chatSession?.appointment;
    
    // Get patient's previous appointments
    const patientHistory = appointments
        .filter(a => 
            String(a.patientId?._id) === String(patient?._id) && 
            a.status === 'completed'
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const tabs = [
        { id: 'current', label: 'Current Visit', icon: FileText },
        { id: 'history', label: 'Patient History', icon: History },
        { id: 'ai', label: 'AI Summary', icon: Brain }
    ];

    return (
        <div className="flex-1 flex h-full overflow-hidden animate-in fade-in duration-300">
            {/* Left Pane: Communication */}
            <div className="flex-1 flex flex-col bg-white border-r border-gray-200 min-w-0">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center font-bold text-lg">
                            {patient?.name?.[0] || '?'}
                        </div>
                        <div className="text-white">
                            <h3 className="font-bold text-lg">{patient?.name || 'Unknown Patient'}</h3>
                            <div className="flex items-center gap-2 text-sky-200 text-sm">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span>Live Consultation</span>
                                <span className="opacity-50">â€¢</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {appointment?.timeSlot}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowFinalizePanel(true)}
                            className="px-4 py-2 bg-white text-sky-600 rounded-lg font-bold text-sm hover:bg-sky-50 transition flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            End & Finalize
                        </button>
                        <button 
                            onClick={onEndChat} 
                            className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                
                {/* Chat Window */}
                <div className="flex-1 relative overflow-hidden bg-gray-50">
                    <StreamChatWindow 
                        partner={patient} 
                        currentUser={doctor}
                        userType="doctor"
                        doctorId={doctor._id || doctor.id}
                        patientId={patient?._id || patient?.id}
                        onEndChat={onEndChat} 
                    />
                </div>
            </div>
            
            {/* Right Pane: Clinical Panel */}
            <div className="w-[400px] bg-white flex flex-col overflow-hidden shrink-0">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 shrink-0">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                activeTab === tab.id 
                                    ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'current' && (
                        <div className="p-5 space-y-5">
                            {/* Patient Info Card */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Patient Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">ID</span>
                                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border">
                                            #{(patient?._id || '').slice(-8)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium text-gray-700">{patient?.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Previous Visits</span>
                                        <span className="font-bold text-sky-600">{patientHistory.length}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Doctor's Notes */}
                            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <StickyNote className="w-3 h-3" /> Quick Notes
                                </h4>
                                <textarea 
                                    className="w-full bg-transparent resize-none outline-none text-sm text-yellow-900 placeholder-yellow-500/50 h-24"
                                    placeholder="Type notes here (allergies, symptoms observed)..."
                                    value={patientNotes[patient?._id] || ''}
                                    onChange={(e) => onSaveNote(patient?._id, e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'history' && (
                        <div className="p-5">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Previous Consultations
                            </h4>
                            {patientHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {patientHistory.map(apt => (
                                        <div key={apt._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-gray-500">
                                                    {new Date(apt.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-gray-400">{apt.timeSlot}</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 mb-1">
                                                {apt.diagnosis || 'No diagnosis recorded'}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono line-clamp-2">
                                                {apt.prescription || 'No prescription'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400">No previous consultations</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'ai' && (
                        <div className="p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    AI-Generated Summary
                                </h4>
                                <button 
                                    onClick={() => onAISummary(appointment)}
                                    className="text-xs text-sky-600 font-bold hover:underline"
                                >
                                    Generate
                                </button>
                            </div>
                            <div className="bg-gradient-to-br from-teal-50 to-sky-50 rounded-xl p-4 border border-teal-100 min-h-[200px]">
                                {aiLoading ? (
                                    <div className="flex flex-col items-center justify-center h-40">
                                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-2"/>
                                        <p className="text-sm text-teal-400">Analyzing conversation...</p>
                                    </div>
                                ) : aiSummary ? (
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {aiSummary}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-center">
                                        <Brain className="w-10 h-10 text-teal-200 mb-3" />
                                        <p className="text-sm text-gray-400">Click "Generate" to create an AI summary</p>
                                        <p className="text-xs text-gray-300 mt-1">Based on chat logs and patient history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Finalize Panel Overlay */}
            {showFinalizePanel && (
                <div className="absolute inset-y-0 right-0 w-[450px] bg-white shadow-2xl border-l border-gray-200 z-20 animate-in slide-in-from-right duration-300 flex flex-col">
                    <div className="bg-sky-600 text-white px-6 py-4 flex justify-between items-center shrink-0">
                        <h3 className="font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Finalize Consultation
                        </h3>
                        <button onClick={() => setShowFinalizePanel(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <PrescriptionPad 
                            appointment={appointment}
                            onComplete={(data) => {
                                onComplete(data);
                                setShowFinalizePanel(false);
                            }}
                            onCancel={() => setShowFinalizePanel(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationRoom;

