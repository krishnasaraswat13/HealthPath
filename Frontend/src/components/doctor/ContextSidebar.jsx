import React, { useMemo } from 'react';
import { 
    DollarSign, Users, Star, ChevronLeft, ChevronRight, 
    TrendingUp, Bell, Clock, CheckCircle, Calendar
} from 'lucide-react';

const ContextSidebar = ({ 
    doctor,
    stats, 
    appointments,
    notifications = [],
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate
}) => {
    // Calendar Grid
    const calendarGrid = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const grid = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let i = 1; i <= days; i++) grid.push(new Date(year, month, i));
        return grid;
    }, [currentMonth]);

    const hasAppointmentOnDate = (date) => 
        date && appointments.some(a => new Date(a.date).toDateString() === date.toDateString());
    
    const completionPercentage = stats.todayTotal > 0 
        ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) 
        : 0;

    // Circular progress for appointments completed
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

    return (
        <aside className="w-80 bg-white border-l border-gray-100 flex flex-col h-full overflow-hidden">
            {/* Today's Progress */}
            <div className="p-5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Today's Progress</h3>
                <div className="flex items-center gap-5">
                    {/* Circular Progress */}
                    <div className="relative">
                        <svg className="w-24 h-24 -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="#E5E7EB"
                                strokeWidth="8"
                                fill="transparent"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="url(#gradient)"
                                strokeWidth="8"
                                fill="transparent"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-gray-800">{stats.todayCompleted}</span>
                            <span className="text-[10px] text-gray-400 font-bold">of {stats.todayTotal}</span>
                        </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending
                            </span>
                            <span className="font-bold text-gray-800">{stats.todayPending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Earned
                            </span>
                            <span className="font-bold text-green-600">${stats.todayEarnings}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="p-5 border-b border-gray-100 grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-sky-50 to-cyan-50 p-3 rounded-xl text-center">
                    <DollarSign className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                    <p className="text-lg font-black text-gray-800">${stats.earnings}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-bold">Total Earnings</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-xl text-center">
                    <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-black text-gray-800">{stats.patients}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-bold">Patients</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-xl text-center">
                    <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-gray-800">{stats.rating?.toFixed(1) || '0.0'}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-bold">Rating</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-3 rounded-xl text-center">
                    <TrendingUp className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-gray-800">{stats.reviews}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-bold">Reviews</p>
                </div>
            </div>

            {/* Calendar */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 text-sm">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} 
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-500"/>
                        </button>
                        <button 
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} 
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-500"/>
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-2 uppercase">
                    {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
                </div>
                
                <div className="grid grid-cols-7 text-center gap-1">
                    {calendarGrid.map((date, i) => {
                        const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();
                        const isToday = date && date.toDateString() === new Date().toDateString();
                        const hasEvents = hasAppointmentOnDate(date);
                        
                        return date ? (
                            <button 
                                key={i} 
                                onClick={() => setSelectedDate(date.toDateString() === selectedDate?.toDateString() ? null : date)}
                                className={`
                                    h-8 w-8 rounded-lg flex flex-col items-center justify-center text-xs relative transition-all
                                    ${isSelected ? 'bg-sky-600 text-white shadow-md' : isToday ? 'bg-sky-50 text-sky-600 font-bold' : 'hover:bg-gray-100 text-gray-600'}
                                `}
                            >
                                {date.getDate()}
                                {hasEvents && !isSelected && (
                                    <span className="w-1 h-1 bg-rose-500 rounded-full absolute bottom-1"></span>
                                )}
                            </button>
                        ) : <span key={i}></span>;
                    })}
                </div>
                
                {selectedDate && (
                    <button 
                        onClick={() => setSelectedDate(null)} 
                        className="mt-3 text-xs w-full py-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 font-bold"
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            {/* Live Activity Feed */}
            <div className="flex-1 p-5 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Bell className="w-3 h-3" /> Live Activity
                </h3>
                <div className="space-y-3">
                    {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notif, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center shrink-0">
                                    <Bell className="w-4 h-4 text-sky-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 font-medium truncate">{notif.message}</p>
                                    <p className="text-xs text-gray-400">{notif.time || 'Just now'}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bell className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-400">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="p-5 border-t border-gray-100 shrink-0">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">This Week</h3>
                <div className="h-16 flex items-end justify-between gap-1">
                    {stats.chart?.map((item, i) => {
                        const maxCount = Math.max(...(stats.chart?.map(c => c.count) || []), 1);
                        const height = item.count > 0 ? Math.max((item.count / maxCount) * 100, 15) : 8;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div 
                                    className={`w-full rounded-t transition-all ${
                                        item.count > 0 
                                            ? 'bg-gradient-to-t from-sky-500 to-cyan-400 group-hover:from-sky-600 group-hover:to-cyan-500' 
                                            : 'bg-gray-100'
                                    }`}
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-[9px] text-gray-400 mt-1">{item.day?.[0]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
};

export default ContextSidebar;

