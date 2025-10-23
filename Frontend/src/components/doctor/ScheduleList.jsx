import React, { useState } from 'react';
import { 
    Clock, MessageSquare, Video, RefreshCw, Trash2, CheckCircle, 
    Calendar, Bell, Brain, Download, Edit3, Eye, ChevronDown, Star
} from 'lucide-react';

const ScheduleList = ({ 
    appointments, 
    activeTab, 
    setActiveTab,
    stats,
    doctor,
    onStartChat,
    onStartVideo,
    onSendReminder,
    onReschedule,
    onCancel,
    onComplete,
    onEdit,
    onAISummary,
    onDownload,
    onViewPatient
}) => {
    const [expandedId, setExpandedId] = useState(null);

    const getStatusColor = (status) => {
        switch(status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                    <button 
                        onClick={() => setActiveTab('upcoming')} 
                        className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                            activeTab === 'upcoming' 
                                ? 'bg-sky-600 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        Upcoming
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'upcoming' ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                            {stats.pendingCount}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('pending')} 
                        className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                            activeTab === 'pending' 
                                ? 'bg-sky-600 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        Pending
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                            activeTab === 'history' 
                                ? 'bg-sky-600 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        Completed
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'history' ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                            {stats.completedCount}
                        </span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {appointments.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-600 mb-1">No Appointments</h3>
                        <p className="text-sm text-gray-400">Your {activeTab} schedule is empty</p>
                    </div>
                ) : (
                    appointments.map(apt => {
                        const isExpanded = expandedId === apt._id;
                        const patient = apt.patientId;
                        const patientReview = doctor.reviews?.find(r => 
                            String(r.patientId) === String(patient?._id)
                        );
                        
                        return (
                            <div 
                                key={apt._id} 
                                className={`bg-white rounded-xl border transition-all duration-200 group ${
                                    isExpanded ? 'border-sky-200 shadow-lg' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                                }`}
                            >
                                {/* Main Row */}
                                <div className="flex items-center p-4 gap-4">
                                    {/* Time */}
                                    <div className="w-20 shrink-0 text-center">
                                        <p className="text-lg font-black text-gray-800">{apt.timeSlot}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                            {new Date(apt.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="w-px h-12 bg-gray-100" />
                                    
                                    {/* Patient Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className="w-11 h-11 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-xl flex items-center justify-center text-sky-600 font-bold text-lg">
                                                {patient?.name?.[0] || '?'}
                                            </div>
                                            {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate">{patient?.name || 'Unknown'}</h4>
                                            <p className="text-xs text-gray-400 truncate">{patient?.email}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(apt.status)}`}>
                                        {apt.status === 'completed' ? 'Completed' : apt.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
                                    </div>
                                    
                                    {/* Hover Actions (Pending) */}
                                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onViewPatient(patient)} 
                                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                                                title="View Profile"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onStartChat(apt)} 
                                                className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                                title="Chat"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onStartVideo(apt)} 
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                title="Video Call"
                                            >
                                                <Video className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onSendReminder(apt)} 
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                title="Send Reminder"
                                            >
                                                <Bell className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onReschedule(apt)} 
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                                title="Reschedule"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onCancel(apt._id)} 
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Cancel"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-6 bg-gray-200 mx-1" />
                                            <button 
                                                onClick={() => onComplete(apt)} 
                                                className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition flex items-center gap-1"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Done
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Completed Actions */}
                                    {apt.status === 'completed' && (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => onEdit(apt)} 
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onDownload(apt)} 
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onAISummary(apt)} 
                                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                                                title="AI Summary"
                                            >
                                                <Brain className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setExpandedId(isExpanded ? null : apt._id)} 
                                                className={`p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Expanded Details (Completed) */}
                                {isExpanded && apt.status === 'completed' && (
                                    <div className="px-4 pb-4 border-t border-gray-100 mt-2 pt-4 grid grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Diagnosis</p>
                                            <p className="text-sm text-gray-700">{apt.diagnosis || 'Not recorded'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Prescription</p>
                                            <p className="text-sm text-gray-700 line-clamp-2 font-mono">{apt.prescription || 'Not recorded'}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg ${patientReview ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Feedback</p>
                                                {patientReview && (
                                                    <div className="flex text-yellow-400">
                                                        {[1,2,3,4,5].map(s => (
                                                            <Star key={s} className={`w-3 h-3 ${s <= patientReview.rating ? 'fill-current' : 'text-gray-300'}`}/>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 italic">
                                                {patientReview ? `"${patientReview.comment || `Rated ${patientReview.rating} stars`}"` : 'No feedback yet'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ScheduleList;

