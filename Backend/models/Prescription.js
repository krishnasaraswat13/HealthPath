const mongoose = require('mongoose');

const PrescriptionItemSchema = new mongoose.Schema({
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
    quantity: { type: Number, default: 1 }
});

const PrescriptionSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyUser' },
    
    // Prescription details
    diagnosis: { type: String, required: true },
    medicines: [PrescriptionItemSchema],
    notes: { type: String },
    
    // Status tracking
    status: {
        type: String,
        enum: ['created', 'sent_to_pharmacy', 'received', 'processing', 'ready', 'dispensed', 'cancelled'],
        default: 'created'
    },
    
    // Validity
    validUntil: { type: Date },
    isRefillable: { type: Boolean, default: false },
    refillCount: { type: Number, default: 0 },
    maxRefills: { type: Number, default: 0 },
    
    // QR code data
    qrCode: { type: String },
    
    // Pharmacy notes
    pharmacyNotes: { type: String },
    dispensedAt: { type: Date },
    dispensedBy: { type: String }
}, { timestamps: true });

PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });
PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ pharmacyId: 1, status: 1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
