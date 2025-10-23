const mongoose = require('mongoose');

const healthGoalSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['weight', 'exercise', 'nutrition', 'sleep', 'medication', 'mental_health', 'habit', 'other'],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    targetValue: {
        type: Number
    },
    currentValue: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetDate: {
        type: Date
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'once'],
        default: 'daily'
    },
    progress: [{
        date: { type: Date, default: Date.now },
        value: Number,
        note: String
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'abandoned'],
        default: 'active'
    },
    reminders: {
        enabled: { type: Boolean, default: true },
        time: { type: String } // HH:MM format
    },
    streakCount: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastCheckin: {
        type: Date
    },
    completedCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate completion percentage
healthGoalSchema.virtual('completionPercentage').get(function() {
    if (!this.targetValue || this.targetValue === 0) return 0;
    return Math.min(Math.round((this.currentValue / this.targetValue) * 100), 100);
});

// Check if goal is overdue
healthGoalSchema.virtual('isOverdue').get(function() {
    if (!this.targetDate) return false;
    return new Date() > new Date(this.targetDate) && this.status === 'active';
});

healthGoalSchema.set('toJSON', { virtuals: true });
healthGoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('HealthGoal', healthGoalSchema);
