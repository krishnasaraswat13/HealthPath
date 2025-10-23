const mongoose = require('mongoose');

const SymptomEntrySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    symptoms: [{
        name: { type: String, required: true },
        severity: { 
            type: Number, 
            min: 1, 
            max: 10, 
            required: true 
        },
        bodyPart: { type: String }
    }],
    mood: {
        type: String,
        enum: ['excellent', 'good', 'okay', 'poor', 'terrible'],
        default: 'okay'
    },
    sleepHours: {
        type: Number,
        min: 0,
        max: 24
    },
    waterIntake: {
        type: Number, // glasses
        default: 0
    },
    medications: [{
        name: { type: String },
        taken: { type: Boolean, default: false },
        time: { type: String }
    }],
    notes: {
        type: String,
        maxlength: 1000
    },
    photos: [{
        url: { type: String },
        description: { type: String }
    }],
    vitalSigns: {
        bloodPressure: { type: String }, // e.g., "120/80"
        heartRate: { type: Number },      // bpm
        temperature: { type: Number },    // Fahrenheit or Celsius
        oxygenLevel: { type: Number }     // SpO2 percentage
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for efficient patient-date queries
SymptomEntrySchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('SymptomEntry', SymptomEntrySchema);
