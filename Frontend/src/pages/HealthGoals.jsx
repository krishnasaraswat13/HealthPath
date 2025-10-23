import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Target, Plus, ArrowLeft, TrendingUp, Award, Calendar, Check,
    Flame, Droplet, Moon, Brain, Dumbbell, Scale, Salad, Heart,
    Timer, Edit2, Trash2, ChevronRight, Sparkles, BarChart3
} from 'lucide-react';
import api from '../services/api';

const categoryIcons = {
    weight: Scale,
    exercise: Dumbbell,
    nutrition: Salad,
    sleep: Moon,
    medication: Heart,
    mental_health: Brain,
    habit: Target,
    other: Sparkles
};

const categoryColors = {
    weight: 'orange',
    exercise: 'blue',
    nutrition: 'green',
    sleep: 'teal',
    medication: 'red',
    mental_health: 'pink',
    habit: 'yellow',
    other: 'gray'
};

const HealthGoals = () => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState({});
    const [analytics, setAnalytics] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('goals');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(null);
    const [newGoal, setNewGoal] = useState({
        title: '',
        category: 'exercise',
        description: '',
        targetValue: '',
        unit: '',
        frequency: 'daily',
        targetDate: ''
    });
    const [progressValue, setProgressValue] = useState('');
    const [progressNote, setProgressNote] = useState('');

    useEffect(() => {
        fetchGoals();
        fetchSuggestions();
        fetchAnalytics();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/health-goals');
            setGoals(res.data.goals || []);
            setStats(res.data.stats || {});
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        try {
            const res = await api.get('/health-goals/suggestions');
            setSuggestions(res.data.suggestions || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/health-goals/analytics');
            setAnalytics(res.data.analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        try {
            await api.post('/health-goals', {
                ...newGoal,
                targetValue: newGoal.targetValue ? Number(newGoal.targetValue) : null
            });
            setShowCreateModal(false);
            setNewGoal({
                title: '',
                category: 'exercise',
                description: '',
                targetValue: '',
                unit: '',
                frequency: 'daily',
                targetDate: ''
            });
            fetchGoals();
            fetchAnalytics();
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Failed to create goal');
        }
    };

    const handleLogProgress = async (goalId) => {
        try {
            await api.post(`/health-goals/${goalId}/progress`, {
                value: Number(progressValue),
                note: progressNote
            });
            setShowProgressModal(null);
            setProgressValue('');
            setProgressNote('');
            fetchGoals();
            fetchAnalytics();
        } catch (error) {
            console.error('Error logging progress:', error);
            alert('Failed to log progress');
        }
    };

    const handleDeleteGoal = async (goalId) => {
        if (!confirm('Delete this goal?')) return;
        try {
            await api.delete(`/health-goals/${goalId}`);
            fetchGoals();
            fetchAnalytics();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleQuickAdd = (suggestion) => {
        setNewGoal({
            title: suggestion.title,
            category: suggestion.category,
            description: suggestion.description,
            targetValue: suggestion.targetValue || '',
            unit: suggestion.unit || '',
            frequency: suggestion.frequency,
            targetDate: ''
        });
        setShowCreateModal(true);
    };

    const getColorClasses = (color) => {
        const colors = {
            orange: 'bg-orange-100 text-orange-600 border-orange-200',
            blue: 'bg-blue-100 text-blue-600 border-blue-200',
            green: 'bg-green-100 text-green-600 border-green-200',
            teal: 'bg-teal-100 text-teal-600 border-teal-200',
            red: 'bg-red-100 text-red-600 border-red-200',
            pink: 'bg-pink-100 text-pink-600 border-pink-200',
            yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
            gray: 'bg-gray-100 text-gray-600 border-gray-200'
        };
        return colors[color] || colors.gray;
    };

    const GoalCard = ({ goal }) => {
        const Icon = categoryIcons[goal.category] || Target;
        const color = categoryColors[goal.category] || 'gray';
        const percentage = goal.completionPercentage || 0;

        return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${getColorClasses(color)}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{goal.title}</h3>
                            <p className="text-xs text-gray-500 capitalize">{goal.category.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {goal.streakCount > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                                <Flame className="w-3 h-3" /> {goal.streakCount}
                            </span>
                        )}
                    </div>
                </div>

                {goal.description && (
                    <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                )}

                {goal.targetValue && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-bold text-gray-900">
                                {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${
                                    percentage >= 100 ? 'bg-green-500' : 'bg-sky-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Timer className="w-3 h-3" />
                        <span className="capitalize">{goal.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowProgressModal(goal)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold hover:bg-sky-100 transition"
                        >
                            <Plus className="w-3 h-3" /> Log
                        </button>
                        <button
                            onClick={() => handleDeleteGoal(goal._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/patient/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Dashboard</span>
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Target className="w-8 h-8 text-sky-600" />
                            Health Goals
                        </h1>
                        <p className="text-gray-500 mt-1">Track your health journey and build healthy habits</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-sky-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-sky-700 transition shadow-lg shadow-sky-200"
                    >
                        <Plus className="w-5 h-5" />
                        New Goal
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">Active Goals</p>
                    <p className="text-3xl font-black text-sky-600">{stats.active || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">Completed</p>
                    <p className="text-3xl font-black text-green-600">{stats.completed || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">Best Streak</p>
                    <p className="text-3xl font-black text-orange-500 flex items-center gap-2">
                        {analytics?.bestStreak || 0}
                        <Flame className="w-6 h-6" />
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Check-ins</p>
                    <p className="text-3xl font-black text-teal-600">{analytics?.totalCheckins || 0}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex bg-white p-1 rounded-xl border border-gray-100 w-fit">
                    {['goals', 'suggestions', 'analytics'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition ${
                                activeTab === tab
                                    ? 'bg-sky-600 text-white'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto">
                {activeTab === 'goals' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium mb-4">No health goals yet</p>
                                <button
                                    onClick={() => setActiveTab('suggestions')}
                                    className="text-sky-600 font-bold hover:underline"
                                >
                                    Browse suggestions â†’
                                </button>
                            </div>
                        ) : (
                            goals.map(goal => <GoalCard key={goal._id} goal={goal} />)
                        )}
                    </div>
                )}

                {activeTab === 'suggestions' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suggestions.map((suggestion, idx) => {
                            const Icon = categoryIcons[suggestion.category] || Target;
                            const color = categoryColors[suggestion.category] || 'gray';
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickAdd(suggestion)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 text-left hover:shadow-lg hover:border-sky-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">{suggestion.icon}</span>
                                        <div className={`p-2 rounded-lg ${getColorClasses(color)}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-sky-600 transition">
                                        {suggestion.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-3">{suggestion.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400 capitalize">{suggestion.frequency}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-sky-600 transition" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'analytics' && analytics && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-sky-600" />
                                Goal Distribution by Category
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(analytics.categoryDistribution || {}).map(([cat, count]) => {
                                    const Icon = categoryIcons[cat] || Target;
                                    const color = categoryColors[cat] || 'gray';
                                    return (
                                        <div key={cat} className={`p-4 rounded-xl ${getColorClasses(color)}`}>
                                            <Icon className="w-6 h-6 mb-2" />
                                            <p className="font-bold text-lg">{count}</p>
                                            <p className="text-xs capitalize opacity-80">{cat.replace('_', ' ')}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {analytics.currentStreaks?.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-500" />
                                    Current Streaks
                                </h3>
                                <div className="space-y-3">
                                    {analytics.currentStreaks.map((streak, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                                            <span className="font-medium text-gray-900">{streak.title}</span>
                                            <span className="flex items-center gap-1 font-bold text-orange-600">
                                                <Flame className="w-4 h-4" /> {streak.streak} days
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-sky-600 to-teal-600 rounded-2xl p-6 text-white">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5" />
                                Completion Rate
                            </h3>
                            <div className="flex items-end gap-4">
                                <span className="text-5xl font-black">{analytics.completionRate || 0}%</span>
                                <span className="text-sky-200 pb-2">
                                    {analytics.completedGoals} of {analytics.totalGoals} goals completed
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Goal Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Goal</h2>
                        <form onSubmit={handleCreateGoal} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newGoal.title}
                                    onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                    placeholder="e.g., Daily Steps Goal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                <select
                                    value={newGoal.category}
                                    onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                >
                                    <option value="exercise">Exercise</option>
                                    <option value="nutrition">Nutrition</option>
                                    <option value="sleep">Sleep</option>
                                    <option value="weight">Weight</option>
                                    <option value="medication">Medication</option>
                                    <option value="mental_health">Mental Health</option>
                                    <option value="habit">Habit</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newGoal.description}
                                    onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none resize-none"
                                    rows={2}
                                    placeholder="What do you want to achieve?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Target</label>
                                    <input
                                        type="number"
                                        value={newGoal.targetValue}
                                        onChange={e => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                        placeholder="e.g., 10000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                    <input
                                        type="text"
                                        value={newGoal.unit}
                                        onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                        placeholder="e.g., steps"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Frequency</label>
                                <select
                                    value={newGoal.frequency}
                                    onChange={e => setNewGoal({ ...newGoal, frequency: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="once">One-time</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition"
                                >
                                    Create Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log Progress Modal */}
            {showProgressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Log Progress</h2>
                        <p className="text-gray-500 mb-6">{showProgressModal.title}</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Value {showProgressModal.unit && `(${showProgressModal.unit})`}
                                </label>
                                <input
                                    type="number"
                                    value={progressValue}
                                    onChange={e => setProgressValue(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                    placeholder="Enter value"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Note (optional)</label>
                                <input
                                    type="text"
                                    value={progressNote}
                                    onChange={e => setProgressNote(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                    placeholder="Add a note..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowProgressModal(null)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleLogProgress(showProgressModal._id)}
                                    disabled={!progressValue}
                                    className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check className="w-4 h-4 inline mr-1" /> Log
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthGoals;

