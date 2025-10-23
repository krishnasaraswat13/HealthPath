import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Heart, Activity, Brain, Dumbbell, Shield, TrendingUp, 
    TrendingDown, Minus, Sparkles, Loader2, RefreshCw, Target, Zap, Award
} from 'lucide-react';
import { getWellnessScore } from '../services/api';

const WellnessScore = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchScore = async () => {
        setLoading(true);
        try {
            const res = await getWellnessScore();
            setData(res.data.wellness);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchScore(); }, []);

    const getScoreColor = (score) => {
        if (score >= 80) return { ring: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent' };
        if (score >= 60) return { ring: 'stroke-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Good' };
        if (score >= 40) return { ring: 'stroke-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Fair' };
        return { ring: 'stroke-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Needs Attention' };
    };

    const trendIcon = (trend) => {
        if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-emerald-500" />;
        if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
        return <Minus className="w-5 h-5 text-gray-400" />;
    };

    const categoryIcons = { physical: Heart, mental: Brain, lifestyle: Dumbbell, preventive: Shield };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-fuchsia-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Calculating your wellness score...</p>
                    <p className="text-gray-400 text-sm mt-1">Analyzing health data with AI</p>
                </div>
            </div>
        );
    }

    const score = data?.overallScore || 0;
    const colors = getScoreColor(score);
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-fuchsia-50">
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-fuchsia-600 bg-clip-text text-transparent">
                                AI Wellness Score
                            </h1>
                            <p className="text-sm text-gray-500">Comprehensive health assessment powered by AI</p>
                        </div>
                    </div>
                    <button onClick={fetchScore} className="p-2.5 bg-teal-50 hover:bg-teal-100 rounded-xl transition">
                        <RefreshCw className="w-5 h-5 text-teal-600" />
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {/* Main Score Card */}
                <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-fuchsia-700 rounded-3xl p-8 text-white shadow-2xl shadow-teal-300/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />
                    
                    <div className="relative flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-teal-200" />
                                <span className="text-teal-200 text-sm font-medium">Overall Wellness</span>
                            </div>
                            <h2 className="text-5xl font-black mb-2">{score}<span className="text-2xl text-teal-200">/100</span></h2>
                            <p className="text-lg font-medium text-teal-100">{colors.label}</p>
                            <div className="flex items-center gap-2 mt-3">
                                {trendIcon(data?.trend)}
                                <span className="capitalize text-sm text-teal-200">{data?.trend || 'stable'} trend</span>
                            </div>
                        </div>
                        
                        {/* Circular Progress */}
                        <div className="relative">
                            <svg width="180" height="180" className="-rotate-90">
                                <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                                <circle cx="90" cy="90" r="80" fill="none" stroke="white" strokeWidth="12" 
                                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                                    className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Award className="w-12 h-12 text-white/80" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data?.breakdown && Object.entries(data.breakdown).map(([key, value]) => {
                        const IconComp = categoryIcons[key] || Activity;
                        const c = getScoreColor(value);
                        return (
                            <div key={key} className={`${c.bg} rounded-2xl p-5 border border-gray-100`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <IconComp className={`w-5 h-5 ${c.text}`} />
                                    <span className="font-bold text-gray-700 capitalize text-sm">{key}</span>
                                </div>
                                <p className={`text-3xl font-black ${c.text}`}>{value}</p>
                                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${
                                        value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                    }`} style={{ width: `${value}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    {data?.topStrengths?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Your Strengths
                            </h3>
                            <div className="space-y-3">
                                {data.topStrengths.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 bg-emerald-50 p-3 rounded-xl">
                                        <Zap className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                        <p className="text-sm text-emerald-800">{s}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Areas to Improve */}
                    {data?.areasToImprove?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                <Target className="w-5 h-5 text-amber-500" /> Areas to Improve
                            </h3>
                            <div className="space-y-3">
                                {data.areasToImprove.map((a, i) => (
                                    <div key={i} className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl">
                                        <Target className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                        <p className="text-sm text-amber-800">{a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Personalized Tips */}
                {data?.personalizedTips?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                            <Sparkles className="w-5 h-5 text-teal-500" /> AI Personalized Tips
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {data.personalizedTips.map((tip, i) => (
                                <div key={i} className="bg-gradient-to-br from-teal-50 to-fuchsia-50 p-4 rounded-xl border border-teal-100">
                                    <p className="text-sm text-teal-800 font-medium">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weekly Challenge */}
                {data?.weeklyChallenge && (
                    <div className="bg-gradient-to-r from-sky-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sky-100 text-xs font-bold uppercase tracking-wider">This Week's Challenge</p>
                                <p className="font-bold text-lg mt-1">{data.weeklyChallenge}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WellnessScore;

