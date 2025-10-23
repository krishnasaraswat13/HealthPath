/**
 * HealthAnalytics Page
 * Patient health trends, medication adherence, goals progress, appointment stats
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity, Heart, TrendingUp, Calendar, Pill, Target, BarChart3, Brain, Moon, Droplets, Flame, Award, Zap } from 'lucide-react';
import api from '../services/api';

const HealthAnalytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [goals, setGoals] = useState([]);
    const [goalAnalytics, setGoalAnalytics] = useState(null);
    const [symptoms, setSymptoms] = useState([]);
    const [symptomTrends, setSymptomTrends] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [apptRes, goalsRes, goalAnalRes, symptomRes, trendRes, rxRes] = await Promise.all([
                api.get('/appointments/patient').catch(() => ({ data: { appointments: [] } })),
                api.get('/health-goals').catch(() => ({ data: { goals: [] } })),
                api.get('/health-goals/analytics').catch(() => ({ data: {} })),
                api.get('/symptoms/history').catch(() => ({ data: { entries: [] } })),
                api.get('/symptoms/trends').catch(() => ({ data: {} })),
                api.get('/prescriptions/patient').catch(() => ({ data: { prescriptions: [] } }))
            ]);
            setAppointments(apptRes.data.appointments || apptRes.data || []);
            setGoals(goalsRes.data.goals || []);
            setGoalAnalytics(goalAnalRes.data);
            setSymptoms(symptomRes.data.entries || []);
            setSymptomTrends(trendRes.data);
            setPrescriptions(rxRes.data.prescriptions || []);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Compute stats
    const totalAppts = Array.isArray(appointments) ? appointments.length : 0;
    const completedAppts = Array.isArray(appointments) ? appointments.filter(a => a.status === 'completed').length : 0;
    const upcomingAppts = Array.isArray(appointments) ? appointments.filter(a => a.status === 'scheduled' && new Date(a.date) >= new Date()).length : 0;

    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const goalCompletionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

    const totalRx = prescriptions.length;
    const dispensedRx = prescriptions.filter(p => p.status === 'dispensed').length;

    const avgSleep = symptomTrends?.averageSleep || 0;
    const moodData = symptomTrends?.moodDistribution || {};
    const topSymptoms = symptomTrends?.symptomFrequency?.slice(0, 5) || [];

    // Unique doctors seen
    const uniqueDoctors = new Set(
        (Array.isArray(appointments) ? appointments : [])
            .filter(a => a.doctorId)
            .map(a => typeof a.doctorId === 'object' ? a.doctorId._id : a.doctorId)
    ).size;

    // Monthly appointment trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const count = (Array.isArray(appointments) ? appointments : []).filter(a => {
            const ad = new Date(a.date);
            return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
        }).length;
        monthlyTrend.push({ month: monthLabel, count });
    }
    const maxMonthly = Math.max(...monthlyTrend.map(m => m.count), 1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2 text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">Health Analytics</h1>
                    <p className="text-gray-500 mt-1">Your personalized health overview and trends</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    {[
                        { label: 'Total Visits', value: totalAppts, icon: Calendar, color: 'from-blue-500 to-sky-600' },
                        { label: 'Completed', value: completedAppts, icon: Activity, color: 'from-green-500 to-emerald-600' },
                        { label: 'Upcoming', value: upcomingAppts, icon: Zap, color: 'from-amber-500 to-orange-600' },
                        { label: 'Doctors Seen', value: uniqueDoctors, icon: Heart, color: 'from-pink-500 to-rose-600' },
                        { label: 'Active Goals', value: activeGoals, icon: Target, color: 'from-cyan-500 to-teal-600' },
                        { label: 'Prescriptions', value: totalRx, icon: Pill, color: 'from-teal-500 to-cyan-600' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3 shadow`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointment Trend Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-sky-500" /> Appointment Trend
                        </h3>
                        <div className="flex items-end gap-3 h-40">
                            {monthlyTrend.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold text-gray-600">{m.count}</span>
                                    <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden" style={{ height: '120px' }}>
                                        <div
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-sky-600 to-cyan-500 rounded-t-lg transition-all duration-700"
                                            style={{ height: `${(m.count / maxMonthly) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400">{m.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Goal Progress */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-cyan-500" /> Health Goals
                        </h3>
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="url(#gradient)" strokeWidth="3"
                                        strokeDasharray={`${goalCompletionRate}, 100`}
                                        strokeLinecap="round" />
                                    <defs><linearGradient id="gradient"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-2xl font-bold text-gray-800">{goalCompletionRate}%</span>
                                    <span className="text-xs text-gray-400">Complete</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-cyan-50 rounded-xl">
                                <p className="text-lg font-bold text-cyan-600">{activeGoals}</p>
                                <p className="text-xs text-gray-500">Active</p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded-xl">
                                <p className="text-lg font-bold text-green-600">{completedGoals}</p>
                                <p className="text-xs text-gray-500">Done</p>
                            </div>
                            <div className="text-center p-2 bg-sky-50 rounded-xl">
                                <p className="text-lg font-bold text-sky-600">{goalAnalytics?.bestStreak || 0}</p>
                                <p className="text-xs text-gray-500">Best Streak</p>
                            </div>
                        </div>
                    </div>

                    {/* Sleep & Wellness */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Moon className="w-5 h-5 text-sky-500" /> Wellness Snapshot
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-sky-50 rounded-xl text-center">
                                <Moon className="w-8 h-8 text-sky-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gray-800">{avgSleep.toFixed ? avgSleep.toFixed(1) : avgSleep}h</p>
                                <p className="text-xs text-gray-500">Avg Sleep</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl text-center">
                                <Droplets className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gray-800">{symptoms.length}</p>
                                <p className="text-xs text-gray-500">Journal Entries</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl text-center">
                                <Flame className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gray-800">{dispensedRx}/{totalRx}</p>
                                <p className="text-xs text-gray-500">Rx Fulfilled</p>
                            </div>
                            <div className="p-4 bg-cyan-50 rounded-xl text-center">
                                <Award className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gray-800">{goalAnalytics?.longestStreak || 0}</p>
                                <p className="text-xs text-gray-500">Longest Streak</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Symptoms */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-rose-500" /> Symptom Frequency
                        </h3>
                        {topSymptoms.length === 0 ? (
                            <div className="text-center p-6">
                                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No symptom data yet</p>
                                <button onClick={() => navigate('/patient/symptom-journal')} className="mt-3 text-sky-600 text-sm font-medium hover:underline">Start logging â†’</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {topSymptoms.map((s, i) => {
                                    const maxFreq = topSymptoms[0]?.count || 1;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-700 w-28 truncate">{s.symptom || s._id}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-rose-400 to-pink-600 rounded-full transition-all"
                                                    style={{ width: `${(s.count / maxFreq) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 w-8 text-right">{s.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Mood Distribution */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-pink-500" /> Mood Trends
                        </h3>
                        {Object.keys(moodData).length === 0 ? (
                            <p className="text-gray-400 text-sm text-center p-4">Start logging symptoms to see mood trends</p>
                        ) : (
                            <div className="flex items-end gap-4 h-32 justify-center">
                                {Object.entries(moodData).map(([mood, count], i) => {
                                    const maxMood = Math.max(...Object.values(moodData), 1);
                                    const moodEmojis = { great: 'ðŸ˜Š', good: 'ðŸ™‚', okay: 'ðŸ˜', bad: 'ðŸ˜”', terrible: 'ðŸ˜¢' };
                                    const moodColors = { great: 'from-green-400 to-emerald-500', good: 'from-blue-400 to-sky-500', okay: 'from-yellow-400 to-amber-500', bad: 'from-orange-400 to-red-500', terrible: 'from-red-400 to-rose-500' };
                                    return (
                                        <div key={mood} className="flex flex-col items-center gap-1 flex-1 max-w-20">
                                            <span className="text-xs font-bold text-gray-600">{count}</span>
                                            <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden" style={{ height: '80px' }}>
                                                <div className={`absolute bottom-0 w-full bg-gradient-to-t ${moodColors[mood] || 'from-gray-400 to-gray-500'} rounded-t-lg transition-all`}
                                                    style={{ height: `${(count / maxMood) * 100}%` }} />
                                            </div>
                                            <span className="text-lg">{moodEmojis[mood] || 'ðŸ˜'}</span>
                                            <span className="text-xs text-gray-400 capitalize">{mood}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthAnalytics;

