/**
 * NotificationBell Component
 * Real-time notification dropdown for all dashboards
 */
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Clock, AlertTriangle, FileText, Calendar, Pill, MessageSquare, Heart } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../services/api';

const iconMap = {
    appointment_booked: Calendar,
    appointment_confirmed: Calendar,
    appointment_cancelled: Calendar,
    appointment_reminder: Clock,
    appointment_completed: CheckCheck,
    prescription_created: FileText,
    prescription_sent: FileText,
    prescription_ready: Pill,
    prescription_dispensed: Pill,
    order_placed: Pill,
    order_confirmed: Pill,
    order_ready: Pill,
    order_delivered: Pill,
    feedback_received: Heart,
    feedback_reminder: Heart,
    emergency_alert: AlertTriangle,
    emergency_sos: AlertTriangle,
    health_goal_achieved: Heart,
    chat_message: MessageSquare,
    system_alert: Bell,
    medicine_expiry_alert: AlertTriangle,
    low_stock_alert: AlertTriangle
};

const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600'
};

const NotificationBell = ({ onNavigate, variant = 'light' }) => {
    // variant='light' = bell on dark bg (white icon), variant='dark' = bell on light bg (dark icon)
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadNotificationCount();
            setUnreadCount(res.data.count || 0);
        } catch {}
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await getNotifications({ limit: 15 });
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {}
    };

    const handleClearAll = async () => {
        try {
            await clearAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
        } catch {}
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) handleMarkRead(notification._id);
        if (notification.actionUrl && onNavigate) {
            onNavigate(notification.actionUrl);
        }
        setIsOpen(false);
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-200 group ${variant === 'dark' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'}`}
            >
                <Bell className={`w-5 h-5 group-hover:scale-110 transition-transform ${variant === 'dark' ? 'text-gray-700' : 'text-white'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="px-5 py-4 bg-white border-b border-gray-200 flex items-center justify-between rounded-t-2xl">
                        <h3 className="text-gray-900 font-bold text-lg">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-sky-500 hover:text-sky-700 text-xs flex items-center gap-1 transition" title="Mark all as read">
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={handleClearAll} className="text-gray-400 hover:text-red-500 text-xs flex items-center gap-1 transition" title="Clear all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-400 font-medium">No notifications yet</p>
                                <p className="text-gray-300 text-sm">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const Icon = iconMap[notif.type] || Bell;
                                return (
                                    <button
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full text-left px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-all flex items-start gap-3 ${!notif.isRead ? 'bg-sky-50/50' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${priorityColors[notif.priority] || priorityColors.medium}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-semibold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.isRead && (
                                                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full shrink-0 ml-2"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

