/**
 * PatientFeedback Page
 * Post-appointment satisfaction surveys with ratings and analytics
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, ChevronLeft, Calendar, User, Clock, Send, Check, AlertCircle, TrendingUp, Heart } from 'lucide-react';
import { submitFeedback, getPendingFeedback, getPatientFeedback } from '../services/api';

const categories = [
    { key: 'communication', label: 'Communication', icon: MessageSquare },
    { key: 'professionalism', label: 'Professionalism', icon: User },
    { key: 'waitTime', label: 'Wait Time', icon: Clock },
    { key: 'treatmentEffectiveness', label: 'Treatment', icon: Heart },
    { key: 'facilityExperience', label: 'Facility', icon: TrendingUp },
];

const StarRating = ({ value, onChange, size = 'lg' }) => {
    const [hovered, setHovered] = useState(0);
    const sizeClass = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(star)}
                    className="transition-transform hover:scale-110"
                >
                    <Star className={`${sizeClass} transition-colors ${(hovered || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
            ))}
        </div>
    );
};

const PatientFeedback = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('pending');
    const [pending, setPending] = useState([]);
    const [submitted, setSubmitted] = useState([]);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form state
    const [overallRating, setOverallRating] = useState(0);
    const [ratings, setRatings] = useState({});
    const [wouldRecommend, setWouldRecommend] = useState(null);
    const [visitPurposeMet, setVisitPurposeMet] = useState(null);
    const [comments, setComments] = useState('');
    const [suggestions, setSuggestions] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pendingRes, submittedRes] = await Promise.all([
                getPendingFeedback(),
                getPatientFeedback()
            ]);
            setPending(pendingRes.data.pendingFeedback || []);
            setSubmitted(submittedRes.data.feedback || []);
        } catch (err) {
            console.error('Failed to load feedback data:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setOverallRating(0);
        setRatings({});
        setWouldRecommend(null);
        setVisitPurposeMet(null);
        setComments('');
        setSuggestions('');
        setIsAnonymous(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAppt || !overallRating) return;

        try {
            setSubmitting(true);
            await submitFeedback({
                appointmentId: selectedAppt._id,
                doctorId: selectedAppt.doctorId._id,
                overallRating,
                ratings,
                wouldRecommend,
                visitPurposeMet,
                comments,
                improvementSuggestions: suggestions,
                isAnonymous
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSelectedAppt(null);
                resetForm();
                loadData();
            }, 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Success screen
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-10 shadow-xl text-center max-w-md">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-500">Your feedback helps improve healthcare quality.</p>
                </div>
            </div>
        );
    }

    // Feedback form
    if (selectedAppt) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 p-6">
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => { setSelectedAppt(null); resetForm(); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
                        <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                    
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 p-6 text-white">
                            <h2 className="text-xl font-bold">Rate Your Visit</h2>
                            <p className="text-sky-200 mt-1">With Dr. {selectedAppt.doctorId?.name} - {new Date(selectedAppt.date).toLocaleDateString()}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Overall Rating */}
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Overall Experience</h3>
                                <StarRating value={overallRating} onChange={setOverallRating} />
                                <p className="text-sm text-gray-400 mt-2">{overallRating ? ['', 'Poor', 'Below Average', 'Good', 'Very Good', 'Excellent'][overallRating] : 'Tap to rate'}</p>
                            </div>

                            {/* Category Ratings */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Rate Specific Areas</h3>
                                <div className="space-y-4">
                                    {categories.map(cat => (
                                        <div key={cat.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center">
                                                    <cat.icon className="w-4 h-4 text-sky-600" />
                                                </div>
                                                <span className="font-medium text-gray-700 text-sm">{cat.label}</span>
                                            </div>
                                            <StarRating value={ratings[cat.key] || 0} onChange={(v) => setRatings(prev => ({ ...prev, [cat.key]: v }))} size="sm" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Yes/No Questions */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="font-medium text-gray-700 text-sm mb-3">Would you recommend this doctor?</p>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setWouldRecommend(true)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition ${wouldRecommend === true ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-white text-gray-500 border'}`}>
                                            <ThumbsUp className="w-4 h-4" /> Yes
                                        </button>
                                        <button type="button" onClick={() => setWouldRecommend(false)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition ${wouldRecommend === false ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-white text-gray-500 border'}`}>
                                            <ThumbsDown className="w-4 h-4" /> No
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="font-medium text-gray-700 text-sm mb-3">Was the visit purpose met?</p>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setVisitPurposeMet(true)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition ${visitPurposeMet === true ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-white text-gray-500 border'}`}>
                                            <ThumbsUp className="w-4 h-4" /> Yes
                                        </button>
                                        <button type="button" onClick={() => setVisitPurposeMet(false)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition ${visitPurposeMet === false ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-white text-gray-500 border'}`}>
                                            <ThumbsDown className="w-4 h-4" /> No
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="block font-medium text-gray-700 text-sm mb-2">Comments</label>
                                <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                                    placeholder="Share your experience..." maxLength={1000} />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 text-sm mb-2">Improvement Suggestions</label>
                                <textarea value={suggestions} onChange={(e) => setSuggestions(e.target.value)} rows={2}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                                    placeholder="How can we improve?" maxLength={500} />
                            </div>

                            {/* Anonymous toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="w-5 h-5 rounded-lg text-sky-600 focus:ring-sky-500" />
                                <span className="text-sm text-gray-600">Submit anonymously</span>
                            </label>

                            <button type="submit" disabled={!overallRating || submitting}
                                className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-xl hover:from-sky-700 hover:to-cyan-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg">
                                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5" /> Submit Feedback</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2 text-sm font-medium">
                            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">Patient Feedback</h1>
                        <p className="text-gray-500 mt-1">Help us improve your healthcare experience</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[{ key: 'pending', label: 'Pending', count: pending.length }, { key: 'submitted', label: 'Submitted', count: submitted.length }].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === t.key ? 'bg-sky-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                            {t.label} {t.count > 0 && <span className="ml-1.5 px-2 py-0.5 bg-white/20 rounded-full text-xs">{t.count}</span>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {tab === 'pending' ? (
                    pending.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                            <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700">All caught up!</h3>
                            <p className="text-gray-400 mt-2">No pending feedback requests</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pending.map(appt => (
                                <div key={appt._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={appt.doctorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" className="w-14 h-14 rounded-xl object-cover" />
                                        <div>
                                            <h3 className="font-bold text-gray-800">Dr. {appt.doctorId?.name}</h3>
                                            <p className="text-sm text-gray-500">{appt.doctorId?.specialization}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(appt.date).toLocaleDateString()} · {appt.timeSlot}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedAppt(appt)}
                                        className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-medium rounded-xl hover:from-sky-700 hover:to-cyan-700 transition-all shadow text-sm flex items-center gap-2">
                                        <Star className="w-4 h-4" /> Rate Visit
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    submitted.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700">No feedback yet</h3>
                            <p className="text-gray-400 mt-2">Complete an appointment to share feedback</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {submitted.map(fb => (
                                <div key={fb._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <img src={fb.doctorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                            <div>
                                                <h3 className="font-semibold text-gray-800">Dr. {fb.doctorId?.name}</h3>
                                                <p className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1,2,3,4,5].map(s => (
                                                <Star key={s} className={`w-5 h-5 ${s <= fb.overallRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {fb.comments && <p className="text-sm text-gray-600 mb-2">{fb.comments}</p>}
                                    {fb.doctorResponse && (
                                        <div className="mt-3 p-3 bg-sky-50 rounded-xl">
                                            <p className="text-xs font-semibold text-sky-600 mb-1">Doctor's Response</p>
                                            <p className="text-sm text-gray-700">{fb.doctorResponse}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default PatientFeedback;


