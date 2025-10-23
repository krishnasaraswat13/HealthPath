const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    
    // Overall rating
    overallRating: { type: Number, min: 1, max: 5, required: true },
    
    // Category ratings
    ratings: {
        communication: { type: Number, min: 1, max: 5 },
        professionalism: { type: Number, min: 1, max: 5 },
        waitTime: { type: Number, min: 1, max: 5 },
        treatmentEffectiveness: { type: Number, min: 1, max: 5 },
        facilityExperience: { type: Number, min: 1, max: 5 }
    },
    
    // Questionnaire
    wouldRecommend: { type: Boolean },
    visitPurposeMet: { type: Boolean },
    
    // Free text
    comments: { type: String, maxlength: 1000 },
    improvementSuggestions: { type: String, maxlength: 500 },
    
    // Response from doctor
    doctorResponse: { type: String, maxlength: 500 },
    respondedAt: { type: Date },
    
    // Status
    isAnonymous: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'responded', 'archived'],
        default: 'submitted'
    }
}, { timestamps: true });

FeedbackSchema.index({ doctorId: 1, createdAt: -1 });
FeedbackSchema.index({ patientId: 1, createdAt: -1 });
FeedbackSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
