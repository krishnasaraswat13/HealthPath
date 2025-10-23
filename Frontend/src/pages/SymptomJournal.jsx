import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Calendar, Activity, Droplet, Moon, Pill,
    Heart, Thermometer, TrendingUp, Trash2, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle, Save, Loader2
} from 'lucide-react';
import api from '../services/api';

// Predefined symptom suggestions
const COMMON_SYMPTOMS = [
    'Headache', 'Fatigue', 'Nausea', 'Fever', 'Cough', 'Sore Throat',
    'Body Pain', 'Dizziness', 'Shortness of Breath', 'Chest Pain',
    'Stomach Ache', 'Back Pain', 'Joint Pain', 'Anxiety', 'Insomnia'
];

const MOODS = [
    { value: 'excellent', label: 'ðŸ˜„ Excellent', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'good', label: 'ðŸ™‚ Good', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'okay', label: 'ðŸ˜ Okay', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'poor', label: 'ðŸ˜” Poor', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'terrible', label: 'ðŸ˜« Terrible', color: 'bg-red-100 text-red-700 border-red-200' }
];

const SymptomJournal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('log'); // 'log' | 'history' | 'trends'
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [entries, setEntries] = useState([]);
    const [trends, setTrends] = useState(null);
    const [expandedEntry, setExpandedEntry] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        symptoms: [],
        mood: 'okay',
        sleepHours: '',
        waterIntake: 0,
        medications: [],
        notes: '',
        vitalSigns: {
            bloodPressure: '',
            heartRate: '',
            temperature: '',
            oxygenLevel: ''
        }
    });

    const [newSymptom, setNewSymptom] = useState({ name: '', severity: 5 });
    const [newMed, setNewMed] = useState({ name: '', taken: false });

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        if (activeTab === 'trends') fetchTrends();
    }, [activeTab]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/symptoms/history?limit=30');
            setEntries(res.data.entries || []);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrends = async () => {
        setLoading(true);
        try {
            const res = await api.get('/symptoms/trends?days=30');
            setTrends(res.data.trends);
        } catch (err) {
            console.error('Failed to fetch trends:', err);
        } finally {
            setLoading(false);
        }
    };

    const addSymptom = () => {
        if (!newSymptom.name.trim()) return;
        setFormData(prev => ({
            ...prev,
            symptoms: [...prev.symptoms, { ...newSymptom }]
        }));
        setNewSymptom({ name: '', severity: 5 });
    };

    const removeSymptom = (index) => {
        setFormData(prev => ({
            ...prev,
            symptoms: prev.symptoms.filter((_, i) => i !== index)
        }));
    };

    const addMedication = () => {
        if (!newMed.name.trim()) return;
        setFormData(prev => ({
            ...prev,
            medications: [...prev.medications, { ...newMed, time: new Date().toLocaleTimeString() }]
        }));
        setNewMed({ name: '', taken: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.symptoms.length === 0) {
            alert('Please add at least one symptom');
            return;
        }

        setSaving(true);
        try {
            await api.post('/symptoms/entry', formData);
            alert('Entry saved successfully!');
            // Reset form
            setFormData({
                symptoms: [],
                mood: 'okay',
                sleepHours: '',
                waterIntake: 0,
                medications: [],
                notes: '',
                vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', oxygenLevel: '' }
            });
        } catch (err) {
            alert('Failed to save entry. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const deleteEntry = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await api.delete(`/symptoms/entry/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
        } catch (err) {
            alert('Failed to delete entry');
        }
    };

    const getSeverityColor = (severity) => {
        if (severity <= 3) return 'bg-green-500';
        if (severity <= 6) return 'bg-yellow-500';
        if (severity <= 8) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50 to-pink-50 p-6 md:p-10">
            {/* Header */}
            <header className="max-w-5xl mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                                <ArrowLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <div className="bg-sky-100 p-3 rounded-xl">
                                <Activity className="w-6 h-6 text-sky-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Symptom Journal</h1>
                                <p className="text-gray-500 text-sm">Track your health journey</p>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {['log', 'history', 'trends'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${
                                        activeTab === tab ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto">
                {/* LOG TAB */}
                {activeTab === 'log' && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4">
                        {/* Symptoms Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" /> Symptoms
                            </h3>

                            {/* Quick Add Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {COMMON_SYMPTOMS.slice(0, 8).map(symptom => (
                                    <button
                                        key={symptom}
                                        type="button"
                                        onClick={() => setNewSymptom({ ...newSymptom, name: symptom })}
                                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-sky-100 hover:text-sky-700 transition"
                                    >
                                        {symptom}
                                    </button>
                                ))}
                            </div>

                            {/* Add Symptom Form */}
                            <div className="flex gap-3 mb-4">
                                <input
                                    type="text"
                                    placeholder="Symptom name..."
                                    value={newSymptom.name}
                                    onChange={(e) => setNewSymptom({ ...newSymptom, name: e.target.value })}
                                    className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-sky-200 outline-none"
                                />
                                <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-xl">
                                    <span className="text-sm text-gray-500">Severity:</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={newSymptom.severity}
                                        onChange={(e) => setNewSymptom({ ...newSymptom, severity: parseInt(e.target.value) })}
                                        className="w-20"
                                    />
                                    <span className="font-bold text-gray-700 w-6">{newSymptom.severity}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={addSymptom}
                                    className="bg-sky-600 text-white px-4 rounded-xl hover:bg-sky-700 transition"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Added Symptoms List */}
                            <div className="space-y-2">
                                {formData.symptoms.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(s.severity)}`} />
                                            <span className="font-medium text-gray-800">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500">Severity: {s.severity}/10</span>
                                            <button type="button" onClick={() => removeSymptom(i)} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {formData.symptoms.length === 0 && (
                                    <p className="text-gray-400 text-center py-4">No symptoms added yet</p>
                                )}
                            </div>
                        </div>

                        {/* Mood & Wellness Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Mood */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-pink-500" /> How are you feeling?
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map(mood => (
                                        <button
                                            key={mood.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mood: mood.value })}
                                            className={`px-4 py-2 rounded-xl border-2 font-medium transition ${
                                                formData.mood === mood.value ? mood.color + ' border-current' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            {mood.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sleep & Hydration */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <Moon className="w-5 h-5 text-sky-500" /> Sleep Hours
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="24"
                                            value={formData.sleepHours}
                                            onChange={(e) => setFormData({ ...formData, sleepHours: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Hours"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <Droplet className="w-5 h-5 text-blue-500" /> Water (glasses)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.waterIntake}
                                            onChange={(e) => setFormData({ ...formData, waterIntake: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Glasses"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vital Signs */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Thermometer className="w-5 h-5 text-orange-500" /> Vital Signs (Optional)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-medium">Blood Pressure</label>
                                    <input
                                        type="text"
                                        placeholder="120/80"
                                        value={formData.vitalSigns.bloodPressure}
                                        onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value } })}
                                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium">Heart Rate (bpm)</label>
                                    <input
                                        type="number"
                                        placeholder="72"
                                        value={formData.vitalSigns.heartRate}
                                        onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, heartRate: e.target.value } })}
                                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium">Temperature (°F)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="98.6"
                                        value={formData.vitalSigns.temperature}
                                        onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, temperature: e.target.value } })}
                                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium">SpO2 (%)</label>
                                    <input
                                        type="number"
                                        placeholder="98"
                                        value={formData.vitalSigns.oxygenLevel}
                                        onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, oxygenLevel: e.target.value } })}
                                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Additional Notes</h3>
                            <textarea
                                rows={3}
                                placeholder="Any other details about how you're feeling today..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-sky-200 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={saving || formData.symptoms.length === 0}
                            className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Saving...' : 'Save Entry'}
                        </button>
                    </form>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        {loading ? (
                            <div className="text-center py-20">
                                <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No entries yet. Start tracking your symptoms!</p>
                            </div>
                        ) : (
                            entries.map(entry => (
                                <div key={entry._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => setExpandedEntry(expandedEntry === entry._id ? null : entry._id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-400 uppercase">
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                                                    </p>
                                                    <p className="text-2xl font-bold text-gray-800">
                                                        {new Date(entry.date).getDate()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {entry.symptoms.slice(0, 3).map((s, i) => (
                                                            <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                        {entry.symptoms.length > 3 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                                                +{entry.symptoms.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Mood: {MOODS.find(m => m.value === entry.mood)?.label || entry.mood}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteEntry(entry._id); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {expandedEntry === entry._id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedEntry === entry._id && (
                                        <div className="px-5 pb-5 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2">
                                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                                <div className="bg-gray-50 p-4 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-2">Symptoms</p>
                                                    {entry.symptoms.map((s, i) => (
                                                        <div key={i} className="flex items-center justify-between text-sm mb-1">
                                                            <span>{s.name}</span>
                                                            <span className={`font-bold ${s.severity > 7 ? 'text-red-600' : s.severity > 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {s.severity}/10
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-2">Wellness</p>
                                                    <p className="text-sm"><span className="text-gray-500">Sleep:</span> {entry.sleepHours || 'N/A'} hrs</p>
                                                    <p className="text-sm"><span className="text-gray-500">Water:</span> {entry.waterIntake || 0} glasses</p>
                                                </div>
                                                {entry.notes && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs text-gray-500 mb-2">Notes</p>
                                                        <p className="text-sm text-gray-700">{entry.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* TRENDS TAB */}
                {activeTab === 'trends' && (
                    <div className="animate-in slide-in-from-right-4">
                        {loading ? (
                            <div className="text-center py-20">
                                <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
                            </div>
                        ) : !trends ? (
                            <div className="text-center py-20 bg-white rounded-2xl">
                                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Not enough data for trends. Keep logging!</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Top Symptoms */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-sky-500" /> Most Common Symptoms
                                    </h3>
                                    <div className="space-y-3">
                                        {trends.topSymptoms?.map((s, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-gray-800">{s.name}</span>
                                                        <span className="text-sm text-gray-500">{s.count}x</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-sky-500 rounded-full transition-all"
                                                            style={{ width: `${(s.count / trends.totalEntries) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Overview */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4">30-Day Overview</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-sky-50 p-4 rounded-xl text-center">
                                            <p className="text-3xl font-bold text-sky-600">{trends.totalEntries}</p>
                                            <p className="text-sm text-sky-500">Total Entries</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                                            <p className="text-3xl font-bold text-blue-600">{trends.averageSleep || 'N/A'}</p>
                                            <p className="text-sm text-blue-500">Avg Sleep (hrs)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SymptomJournal;


