import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Apple, Loader2, Sparkles, UtensilsCrossed, Salad,
    Heart, Timer, Scale, Leaf
} from 'lucide-react';
import { generateDietPlan } from '../services/api';

const AIDietPlanner = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ condition: '', age: '', gender: '', weight: '', height: '', allergies: '', preferences: '' });
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);

    const conditions = [
        'Diabetes Type 2', 'Hypertension', 'High Cholesterol', 'PCOS/PCOD',
        'Thyroid Disorder', 'Heart Disease', 'Obesity', 'Anemia',
        'Kidney Disease', 'Liver Disease', 'Gastritis/Acid Reflux', 'General Wellness'
    ];

    const handleGenerate = async () => {
        if (!form.condition) return alert('Please select a medical condition');
        setLoading(true);
        try {
            const res = await generateDietPlan(form);
            setPlan(res.data.dietPlan);
        } catch (err) {
            console.error('Error:', err);
            alert('Failed to generate diet plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Apple className="w-6 h-6 text-emerald-600" /> AI Diet Planner
                        </h1>
                        <p className="text-sm text-gray-500">Personalized nutrition plan based on your medical condition</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {!plan ? (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800">Your Health Profile</h2>
                                    <p className="text-xs text-gray-400">We'll create a personalized 7-day meal plan</p>
                                </div>
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-2 block">Medical Condition *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {conditions.map(c => (
                                        <button key={c} onClick={() => setForm({...form, condition: c})}
                                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                                                form.condition === c 
                                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700' 
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-emerald-300'
                                            }`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Body Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Age</label>
                                    <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})}
                                        placeholder="30" className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Gender</label>
                                    <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block flex items-center gap-1"><Scale className="w-3 h-3" /> Weight (kg)</label>
                                    <input type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})}
                                        placeholder="70" className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Height (cm)</label>
                                    <input type="number" value={form.height} onChange={e => setForm({...form, height: e.target.value})}
                                        placeholder="175" className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block">Food Allergies</label>
                                <input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})}
                                    placeholder="e.g., Nuts, Dairy, Gluten" className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block flex items-center gap-1"><Leaf className="w-3 h-3" /> Dietary Preferences</label>
                                <input type="text" value={form.preferences} onChange={e => setForm({...form, preferences: e.target.value})}
                                    placeholder="e.g., Vegetarian, Vegan, Non-veg, Jain" className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                            </div>

                            <button onClick={handleGenerate} disabled={loading || !form.condition}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm
                                    hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Your Plan...</> : <><UtensilsCrossed className="w-5 h-5" /> Generate 7-Day Diet Plan</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Result Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Salad className="w-6 h-6" /> Your Personalized Diet Plan
                                    </h2>
                                    <p className="text-emerald-100 text-sm mt-1">Condition: {form.condition} | Generated by AI</p>
                                </div>
                                <button onClick={() => setPlan(null)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition">
                                    Generate New Plan
                                </button>
                            </div>
                        </div>

                        {/* Plan Content */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="prose prose-sm max-w-none prose-headings:text-emerald-800 prose-strong:text-gray-800 whitespace-pre-wrap text-gray-700 leading-relaxed">
                                {plan}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIDietPlanner;
