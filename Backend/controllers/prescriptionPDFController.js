const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// Generate prescription data suitable for PDF creation on frontend
exports.getPrescriptionPDFData = async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const prescription = await Prescription.findById(prescriptionId)
            .populate('doctorId', 'name specialization experience fees email')
            .populate('patientId', 'name age gender email phone')
            .populate('appointmentId', 'date timeSlot diagnosis');

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }

        const pdfData = {
            // Header
            clinicName: 'HealthPath Medical Center',
            prescriptionId: prescription._id,
            date: prescription.createdAt,
            validUntil: prescription.validUntil,

            // Doctor Info
            doctor: {
                name: prescription.doctorId?.name || 'Unknown',
                specialization: prescription.doctorId?.specialization || '',
                experience: prescription.doctorId?.experience || '',
                email: prescription.doctorId?.email || '',
            },

            // Patient Info
            patient: {
                name: prescription.patientId?.name || 'Unknown',
                age: prescription.patientId?.age || '',
                gender: prescription.patientId?.gender || '',
                email: prescription.patientId?.email || '',
                phone: prescription.patientId?.phone || '',
            },

            // Diagnosis
            diagnosis: prescription.diagnosis || prescription.appointmentId?.diagnosis || '',
            appointmentDate: prescription.appointmentId?.date,

            // Medications
            medicines: prescription.medicines?.map(med => ({
                name: med.medicineName,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
                instructions: med.instructions,
                quantity: med.quantity,
            })) || [],

            // Additional Info
            notes: prescription.notes || '',
            isRefillable: prescription.isRefillable,
            refillCount: prescription.refillCount,
            maxRefills: prescription.maxRefills,
            qrCode: prescription.qrCode,
            status: prescription.status,
        };

        res.json({ success: true, pdfData });
    } catch (error) {
        console.error('PDF Data Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get prescription data' });
    }
};

// Get all prescriptions with full details for a patient
exports.getPatientPrescriptionsDetailed = async (req, res) => {
    try {
        const patientId = req.user.id;

        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name specialization')
            .populate('appointmentId', 'date timeSlot diagnosis')
            .sort({ createdAt: -1 });

        res.json({ success: true, prescriptions });
    } catch (error) {
        console.error('Error fetching prescriptions:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
    }
};

