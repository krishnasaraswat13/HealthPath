const mongoose = require('mongoose');

// Blood Stock Schema
const BloodStockSchema = new mongoose.Schema({
    bloodType: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    units: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// ICU/Bed Availability Schema
const BedAvailabilitySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['General', 'ICU', 'NICU', 'PICU', 'CCU', 'Emergency', 'Maternity', 'Pediatric', 'Isolation']
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    available: {
        type: Number,
        required: true,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Equipment Availability Schema
const EquipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Ventilator', 'Oxygen Concentrator', 'Dialysis Machine', 'ECG Machine', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Defibrillator']
    },
    total: {
        type: Number,
        default: 0
    },
    available: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Ambulance Schema
const AmbulanceSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Basic', 'Advanced Life Support', 'Neonatal', 'Air Ambulance']
    },
    total: {
        type: Number,
        default: 0
    },
    available: {
        type: Number,
        default: 0
    },
    contactNumber: {
        type: String
    }
});

// Emergency Request Schema (for blood/bed requests)
const EmergencyRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        required: true,
        enum: ['Blood', 'Bed', 'Ambulance', 'Oxygen', 'Ventilator']
    },
    patientName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    bloodType: String, // For blood requests
    bedType: String,   // For bed requests
    urgency: {
        type: String,
        enum: ['Critical', 'Urgent', 'Normal'],
        default: 'Normal'
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'requestedByModel'
    },
    requestedByModel: {
        type: String,
        enum: ['Patient', 'Doctor']
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HospitalAccount'
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: Date
});

// Main Emergency Services Schema for Hospitals
const EmergencyServicesSchema = new mongoose.Schema({
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HospitalAccount',
        required: true,
        unique: true
    },
    bloodBank: {
        available: {
            type: Boolean,
            default: false
        },
        stocks: [BloodStockSchema],
        contactNumber: String,
        operatingHours: String
    },
    bedAvailability: [BedAvailabilitySchema],
    equipment: [EquipmentSchema],
    ambulances: [AmbulanceSchema],
    emergencyContact: {
        primary: String,
        secondary: String,
        tollFree: String
    },
    specialServices: [{
        type: String,
        enum: [
            'Trauma Center',
            'Burn Unit',
            'Poison Control',
            'Cardiac Emergency',
            'Stroke Center',
            'Pediatric Emergency',
            'Maternity Emergency',
            'Psychiatric Emergency',
            'Dialysis',
            'Organ Transplant'
        ]
    }],
    is24x7: {
        type: Boolean,
        default: true
    },
    acceptingEmergencies: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster geo queries
EmergencyServicesSchema.index({ hospital: 1 });

const EmergencyServices = mongoose.model('EmergencyServices', EmergencyServicesSchema);
const EmergencyRequest = mongoose.model('EmergencyRequest', EmergencyRequestSchema);

module.exports = { EmergencyServices, EmergencyRequest };
