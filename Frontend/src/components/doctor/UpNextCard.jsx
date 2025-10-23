import React from 'react';
import { Video, User, Clock, Calendar, ArrowRight, Sparkles } from 'lucide-react';

const UpNextCard = ({ nextPatient, onStartVideo, onViewPatient, appointments }) => {
    if (!nextPatient) {
        return (
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8 border-2 border-dashed border-gray-200">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600 mb-1">No Upcoming Appointments</h3>
                    <p className="text-sm text-gray-400">Your schedule is clear for now. Enjoy the break!</p>
                </div>
            </div>
        );
    }

    const patient = nextPatient.patientId;
    const isReturning = appointments.filter(a => 
        String(a.patientId?._id) === String(patient?._id)
    ).length > 1;

    const appointmentDate = new Date(nextPatient.date);
    const isToday = appointmentDate.toDateString() === new Date().toDateString();

    return (
        <div className="bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 rounded-2xl p-6 text-white shadow-2xl shadow-sky-500/30 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
            
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span className="text-xs font-bold text-sky-200 uppercase tracking-wider">Up Next</span>
                    </div>
                    {isReturning && (
                        <span className="bg-blue-400/30 text-blue-100 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-300/30 backdrop-blur-sm">
                            RETURNING PATIENT
                        </span>
                    )}
                </div>

                {/* Patient Info */}
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-white/30">
                                {patient?.name?.[0] || '?'}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                        </div>
                        
                        {/* Details */}
                        <div>
                            <h2 className="text-2xl font-black mb-1">{patient?.name || 'Unknown Patient'}</h2>
                            <div className="flex items-center gap-4 text-sky-200 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-bold text-white">{nextPatient.timeSlot}</span>
                                </span>
                                <span className="w-1 h-1 bg-sky-300 rounded-full" />
                                <span>{isToday ? 'Today' : appointmentDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            {nextPatient.reason && (
                                <p className="mt-2 text-sm text-sky-200 bg-white/10 px-3 py-1 rounded-lg inline-block">
                                    Reason: <span className="text-white font-medium">{nextPatient.reason}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Time Display */}
                    <div className="text-right hidden lg:block">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                            <p className="text-3xl font-black tracking-tight">{nextPatient.timeSlot}</p>
                            <p className="text-xs text-sky-200 font-medium mt-1">
                                {isToday ? 'Today' : appointmentDate.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-6">
                    <button 
                        onClick={() => onStartVideo(nextPatient)}
                        className="flex-1 bg-white text-sky-600 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-sky-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Video className="w-5 h-5" />
                        Start Video Call
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <button 
                        onClick={() => onViewPatient(patient)}
                        className="bg-white/10 backdrop-blur-sm text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all border border-white/30 flex items-center gap-2"
                    >
                        <User className="w-5 h-5" />
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpNextCard;

