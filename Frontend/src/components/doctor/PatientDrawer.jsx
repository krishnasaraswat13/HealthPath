import React from 'react';
import { 
    X, User, Calendar, CheckCircle, Clock, 
    Clipboard, StickyNote, Mail, Hash
} from 'lucide-react';

const PatientDrawer = ({ 
    patient, 
    isOpen, 
    onClose, 
    appointments,
    patientNotes,
    onSaveNote
}) => {
    if (!isOpen || !patient) return null;

    const patientAppointments = appointments.filter(
        a => String(a.patientId?._id) === String(patient._id)
    );
    
    const completedAppointments = patientAppointments.filter(a => a.status === 'completed');
    const upcomingAppointments = patientAppointments.filter(
        a => a.status !== 'completed' && a.status !== 'cancelled'
    );

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-sky-600 p-6 text-white shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-white/10 rounded-lg transition -ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold">
                            {patient.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold truncate">{patient.name}</h2>
                            <p className="text-teal-200 text-sm flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 shrink-0" />
                                {patient.email}
                            </p>
                            <p className="text-teal-200 text-xs mt-1 flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {(patient._id || '').slice(-8)}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 p-5 border-b border-gray-100 shrink-0">
                    <div className="bg-sky-50 rounded-xl p-4 text-center">
                        <Calendar className="w-5 h-5 text-sky-600 mx-auto mb-2" />
                        <p className="text-2xl font-black text-sky-600">{patientAppointments.length}</p>
                        <p className="text-[10px] text-sky-400 uppercase tracking-wider font-bold">Total Visits</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-black text-green-600">{completedAppointments.length}</p>
                        <p className="text-[10px] text-green-400 uppercase tracking-wider font-bold">Completed</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <Clock className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                        <p className="text-2xl font-black text-amber-600">{upcomingAppointments.length}</p>
                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Upcoming</p>
                    </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* Consultation History */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clipboard className="w-3 h-3" /> Consultation History
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {completedAppointments
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .slice(0, 5)
                                .map(apt => (
                                    <div key={apt._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-gray-500">
                                                {new Date(apt.date).toLocaleDateString('en', { 
                                                    month: 'short', 
                                                    day: 'numeric', 
                                                    year: 'numeric' 
                                                })}
                                            </span>
                                            <span className="text-xs text-gray-400">{apt.timeSlot}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 mb-1">
                                            {apt.diagnosis || 'No diagnosis recorded'}
                                        </p>
                                        <p className="text-xs text-gray-500 line-clamp-2 font-mono">
                                            {apt.prescription || 'No prescription'}
                                        </p>
                                    </div>
                                ))
                            }
                            {completedAppointments.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No previous consultations</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Quick Notes */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <StickyNote className="w-3 h-3" /> Quick Notes
                        </h3>
                        <textarea 
                            className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm resize-none h-32 focus:ring-2 focus:ring-yellow-300 outline-none"
                            placeholder="Add notes about this patient (allergies, preferences, etc.)..."
                            value={patientNotes[patient._id] || ''}
                            onChange={(e) => onSaveNote(patient._id, e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-5 border-t border-gray-100 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
};

export default PatientDrawer;

