import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertTriangle, ArrowLeft, Shield, Activity, Clock, Phone,
    Heart, Loader2, Stethoscope, ChevronRight, Thermometer,
    Brain, Zap, CheckCircle
} from 'lucide-react';
import { triageSymptoms } from '../services/api';

const SymptomTriage = () => {
    const navigate = useNavigate();
    const [symptoms, setSymptoms] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState(5);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleTriage = async () => {
        if (!symptoms.trim()) return;
        setLoading(true);
        try {
            const res = await triageSymptoms({ symptoms, age, gender, duration, severity });
            setResult(res.data.triage);
        } catch (err) {
            console.error('Triage error:', err);
            alert('Failed to assess symptoms. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const urgencyConfig = {
        EMERGENCY: { color: 'from-red-500 to-red-700', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-600' },
        URGENT: { color: 'from-orange-500 to-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-600' },
        'SEMI-URGENT': { color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-600' },
        'NON-URGENT': { color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-600' },
    };

    const config = result ? (urgencyConfig[result.urgencyLevel] || urgencyConfig['SEMI-URGENT']) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-orange-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Shield className="w-6 h-6 text-rose-600" /> AI Symptom Triage
                        </h1>
                        <p className="text-sm text-gray-500">Get an AI-powered urgency assessment of your symptoms</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                        <strong>Disclaimer:</strong> This is an AI-based assessment tool for informational purposes only. 
                        It does NOT replace professional medical advice. <strong>If you're experiencing a medical emergency, call emergency services immediately.</strong>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-500" /> Describe Your Symptoms
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block">Symptoms *</label>
                                <textarea
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    placeholder="Describe your symptoms in detail (e.g., severe headache with blurred vision for 2 hours, chest pain radiating to left arm...)"
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-28 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Age</label>
                                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25"
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Gender</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none bg-white">
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block">Duration</label>
                                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} 
                                    placeholder="e.g., 2 hours, 3 days, 1 week"
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-2 flex justify-between">
                                    <span>Severity Level</span>
                                    <span className="font-bold text-rose-600">{severity}/10</span>
                                </label>
                                <input type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(e.target.value)}
                                    className="w-full h-2 bg-gradient-to-r from-green-300 via-yellow-300 to-red-500 rounded-full appearance-none cursor-pointer" />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Mild</span><span>Moderate</span><span>Severe</span>
                                </div>
                            </div>

                            <button onClick={handleTriage} disabled={loading || !symptoms.trim()}
                                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl font-bold text-sm
                                    hover:from-rose-700 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-200">
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                                ) : (
                                    <><Zap className="w-5 h-5" /> Assess Urgency</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div>
                        {!result && !loading && (
                            <div className="bg-white/50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-400">AI Assessment</h3>
                                <p className="text-sm text-gray-400 mt-2">Fill in your symptoms and click "Assess Urgency" to get an AI-powered triage assessment</p>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-4">
                                {/* Urgency Card */}
                                <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-6 text-white shadow-xl`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-6 h-6" />
                                            <span className="text-lg font-bold">Urgency Level</span>
                                        </div>
                                        <span className="text-4xl font-black">{result.urgencyScore}/10</span>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                                        <p className="text-2xl font-black">{result.urgencyLevel}</p>
                                    </div>
                                    {result.shouldCallEmergency && (
                                        <button onClick={() => window.open('tel:112')} 
                                            className="w-full mt-4 py-3 bg-white text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition">
                                            <Phone className="w-5 h-5" /> Call Emergency (112)
                                        </button>
                                    )}
                                </div>

                                {/* Recommendation */}
                                <div className={`${config.bg} border ${config.border} rounded-2xl p-4`}>
                                    <h4 className={`font-bold ${config.text} mb-2 flex items-center gap-2`}>
                                        <Activity className="w-4 h-4" /> Recommendation
                                    </h4>
                                    <p className="text-sm text-gray-700">{result.recommendation}</p>
                                </div>

                                {/* Safe Wait Time */}
                                {result.estimatedWaitSafe && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                                        <Clock className="w-8 h-8 text-blue-500" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">Safe Wait Time</p>
                                            <p className="font-bold text-gray-800">{result.estimatedWaitSafe}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Possible Conditions */}
                                {result.possibleConditions?.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                                        <h4 className="font-bold text-gray-700 mb-2 text-sm">Possible Conditions</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {result.possibleConditions.map((c, i) => (
                                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Self Care Steps */}
                                {result.selfCareSteps?.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                                        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
                                            <Heart className="w-4 h-4 text-pink-500" /> Self-Care Steps
                                        </h4>
                                        <div className="space-y-2">
                                            {result.selfCareSteps.map((step, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                    <p className="text-sm text-gray-600">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Warning Signs */}
                                {result.warningSignsToWatch?.length > 0 && (
                                    <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
                                        <h4 className="font-bold text-red-700 mb-3 text-sm flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Warning Signs to Watch
                                        </h4>
                                        <div className="space-y-2">
                                            {result.warningSignsToWatch.map((sign, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                                                    <p className="text-sm text-red-800">{sign}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button onClick={() => navigate('/patient/doctors')}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                    <Stethoscope className="w-5 h-5" /> Book Appointment with Doctor
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SymptomTriage;
