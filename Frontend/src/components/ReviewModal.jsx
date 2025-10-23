import React, { useState } from 'react';
import api from '../services/api';
import { Star, X, MessageSquare, Loader2 } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, doctorId, doctorName, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await api.post('/doctor/review', 
                { doctorId, rating, comment }
            );

            if (res.data.success) {
                // Reset form
                setRating(0);
                setComment("");
                onSuccess(res.data.newRating); // Pass new rating back to parent to update UI
                onClose();
            }
        } catch (err) {
            console.error("Review Error:", err);
            setError(err.response?.data?.message || "Failed to submit review. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                
                {/* Header */}
                <div className="bg-linear-to-r from-teal-600 to-sky-600 p-6 text-white text-center relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold">Rate Your Experience</h3>
                    <p className="text-teal-100 text-sm mt-1">How was your consultation with Dr. {doctorName}?</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Star Rating Input */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={`w-10 h-10 ${
                                            star <= (hoverRating || rating) 
                                                ? 'fill-yellow-400 text-yellow-400' 
                                                : 'text-gray-300'
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            {rating === 1 && "Poor"}
                            {rating === 2 && "Fair"}
                            {rating === 3 && "Good"}
                            {rating === 4 && "Very Good"}
                            {rating === 5 && "Excellent!"}
                            {rating === 0 && "Select a rating"}
                        </p>
                    </div>

                    {/* Comment Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Share your feedback (Optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us about the diagnosis, waiting time, or doctor's behavior..."
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none h-24 text-sm"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Review"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
