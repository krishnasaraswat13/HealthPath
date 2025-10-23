const mongoose = require('mongoose');

const EmergencyContactSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    relationship: {
        type: String,
        enum: ['spouse', 'parent', 'child', 'sibling', 'friend', 'other'],
        default: 'other'
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one primary contact per patient
EmergencyContactSchema.index({ patientId: 1, isPrimary: 1 });

module.exports = mongoose.model('EmergencyContact', EmergencyContactSchema);
