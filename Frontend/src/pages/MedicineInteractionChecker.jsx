import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Pill, Plus, Trash2, AlertTriangle, CheckCircle,
    Loader2, Shield, Search, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../services/api';

const RISK_COLORS = {
    'none': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
    'mild': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Info },
    'moderate': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: AlertTriangle },
    'severe': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertTriangle },
    'critical': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle },
    'unknown': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Info }
};

const COMMON_MEDICINES = [
    'Aspirin', 'Ibuprofen', 'Paracetamol', 'Metformin', 'Omeprazole',
    'Amlodipine', 'Atorvastatin', 'Losartan', 'Lisinopril', 'Amoxicillin',
    'Azithromycin', 'Cetirizine', 'Pantoprazole', 'Montelukast', 'Clopidogrel'
];

const MedicineInteractionChecker = () => {
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [newMedicine, setNewMedicine] = useState('');
    const [conditions, setConditions] = useState([]);
    const [newCondition, setNewCondition] = useState('');
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [singleMedicineInfo, setSingleMedicineInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);

    const addMedicine = (name = newMedicine) => {
        const medicineName = name.trim();
        if (!medicineName || medicines.includes(medicineName)) return;
        setMedicines(prev => [...prev, medicineName]);
        setNewMedicine('');
        setShowSuggestions(false);
        setResult(null);
    };

    const removeMedicine = (name) => {
        setMedicines(prev => prev.filter(m => m !== name));
        setResult(null);
    };

    const addCondition = () => {
        const condition = newCondition.trim();
        if (!condition || conditions.includes(condition)) return;
        setConditions(prev => [...prev, condition]);
        setNewCondition('');
    };

    const removeCondition = (name) => {
        setConditions(prev => prev.filter(c => c !== name));
    };

    const checkInteractions = async () => {
        if (medicines.length < 2) {
            alert('Please add at least 2 medicines to check for interactions');
            return;
        }

        setChecking(true);
        setResult(null);

        try {
            const res = await api.post('/medicine/interaction-check', {
                medicines,
                conditions
            });
            setResult(res.data);
        } catch (err) {
            alert('Failed to check interactions. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    const getMedicineInfo = async (medicineName) => {
        setLoadingInfo(true);
        setSingleMedicineInfo(null);

        try {
            const res = await api.get(`/medicine/warnings/${encodeURIComponent(medicineName)}`);
            setSingleMedicineInfo(res.data);
        } catch (err) {
            alert('Failed to get medicine information');
        } finally {
            setLoadingInfo(false);
        }
    };

    const filteredSuggestions = COMMON_MEDICINES.filter(
        m => m.toLowerCase().includes(newMedicine.toLowerCase()) && !medicines.includes(m)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-6 md:p-10">
            {/* Header */}
            <header className="max-w-4xl mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div className="bg-teal-100 p-3 rounded-xl">
                            <Pill className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Medicine Interaction Checker</h1>
                            <p className="text-gray-500 text-sm">AI-powered drug safety analysis</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                {/* Add Medicines */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-teal-500" /> Your Medicines
                    </h3>

                    {/* Input with Suggestions */}
                    <div className="relative mb-4">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={newMedicine}
                                    onChange={(e) => {
                                        setNewMedicine(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyPress={(e) => e.key === 'Enter' && addMedicine()}
                                    placeholder="Type medicine name..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-200 outline-none"
                                />
                                
                                {/* Suggestions Dropdown */}
                                {showSuggestions && newMedicine && filteredSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-10 max-h-48 overflow-y-auto">
                                        {filteredSuggestions.map(med => (
                                            <button
                                                key={med}
                                                onClick={() => addMedicine(med)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition text-sm"
                                            >
                                                {med}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => addMedicine()}
                                className="bg-teal-600 text-white px-6 rounded-xl hover:bg-teal-700 transition flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> Add
                            </button>
                        </div>
                    </div>

                    {/* Quick Add */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {COMMON_MEDICINES.slice(0, 8).filter(m => !medicines.includes(m)).map(med => (
                            <button
                                key={med}
                                onClick={() => addMedicine(med)}
                                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-teal-100 hover:text-teal-700 transition"
                            >
                                + {med}
                            </button>
                        ))}
                    </div>

                    {/* Added Medicines */}
                    <div className="flex flex-wrap gap-3">
                        {medicines.map(med => (
                            <div
                                key={med}
                                className="flex items-center gap-2 bg-teal-50 text-teal-800 px-4 py-2 rounded-xl border border-teal-200"
                            >
                                <Pill className="w-4 h-4" />
                                <span className="font-medium">{med}</span>
                                <button
                                    onClick={() => getMedicineInfo(med)}
                                    className="p-1 hover:bg-teal-100 rounded-lg transition"
                                    title="Get medicine info"
                                >
                                    <Info className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => removeMedicine(med)}
                                    className="p-1 hover:bg-red-100 text-red-500 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {medicines.length === 0 && (
                            <p className="text-gray-400 text-sm">Add medicines to check for interactions</p>
                        )}
                    </div>
                </div>

                {/* Add Conditions (Optional) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-teal-500" /> Medical Conditions (Optional)
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Add any conditions for more accurate analysis</p>

                    <div className="flex gap-3 mb-4">
                        <input
                            type="text"
                            value={newCondition}
                            onChange={(e) => setNewCondition(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                            placeholder="e.g., Diabetes, Hypertension..."
                            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-200 outline-none"
                        />
                        <button
                            onClick={addCondition}
                            className="bg-teal-600 text-white px-6 rounded-xl hover:bg-teal-700 transition"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {conditions.map(cond => (
                            <div
                                key={cond}
                                className="flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200"
                            >
                                <span className="text-sm">{cond}</span>
                                <button onClick={() => removeCondition(cond)} className="text-teal-400 hover:text-red-500">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Check Button */}
                <button
                    onClick={checkInteractions}
                    disabled={checking || medicines.length < 2}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-teal-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-teal-200"
                >
                    {checking ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Analyzing Interactions...
                        </>
                    ) : (
                        <>
                            <Shield className="w-6 h-6" />
                            Check Drug Interactions
                        </>
                    )}
                </button>

                {/* Results */}
                {result && (
                    <div className={`rounded-2xl p-6 border-2 ${RISK_COLORS[result.riskLevel]?.bg} ${RISK_COLORS[result.riskLevel]?.border} animate-in slide-in-from-bottom-4`}>
                        <div className="flex items-start gap-4 mb-4">
                            {React.createElement(RISK_COLORS[result.riskLevel]?.icon || Info, {
                                className: `w-8 h-8 ${RISK_COLORS[result.riskLevel]?.text}`
                            })}
                            <div>
                                <h3 className={`text-xl font-bold ${RISK_COLORS[result.riskLevel]?.text} capitalize`}>
                                    {result.riskLevel} Interaction Risk
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Analysis for: {result.medicines.join(', ')}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/80 rounded-xl p-5 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                            {result.analysis}
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <p className="text-xs text-yellow-700">
                                <strong>âš ï¸ Disclaimer:</strong> {result.disclaimer}
                            </p>
                        </div>
                    </div>
                )}

                {/* Single Medicine Info Modal */}
                {(loadingInfo || singleMedicineInfo) && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Pill className="w-6 h-6 text-teal-600" />
                                    {singleMedicineInfo?.medicineName || 'Loading...'}
                                </h3>
                                <button
                                    onClick={() => setSingleMedicineInfo(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <Trash2 className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {loadingInfo ? (
                                    <div className="text-center py-10">
                                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                                        <p className="text-gray-500 mt-2">Getting medicine information...</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm max-w-none">
                                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                            {singleMedicineInfo?.warnings}
                                        </div>
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                                            {singleMedicineInfo?.disclaimer}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MedicineInteractionChecker;


