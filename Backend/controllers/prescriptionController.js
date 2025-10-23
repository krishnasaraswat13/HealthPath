/**
 * Prescription Controller
 * Handles digital prescriptions: create, send to pharmacy, track fulfillment
 */

const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const PharmacyUser = require('../models/PharmacyUser');
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');

// Helper to create notifications
const createNotification = async (data) => {
    try {
        await Notification.create(data);
    } catch (err) {
        console.error('Failed to create notification:', err.message);
    }
};

/**
 * Create a new prescription
 * POST /api/prescriptions
 * Auth: Doctor only
 */
const createPrescription = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { patientId, appointmentId, diagnosis, medicines, notes, validUntil, isRefillable, maxRefills } = req.body;

        if (!patientId || !diagnosis || !medicines || medicines.length === 0) {
            return res.status(400).json({ success: false, message: 'Patient ID, diagnosis, and at least one medicine are required' });
        }

        const [doctor, patient] = await Promise.all([
            Doctor.findById(doctorId),
            Patient.findById(patientId)
        ]);

        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        const prescription = await Prescription.create({
            doctorId,
            patientId,
            appointmentId,
            diagnosis,
            medicines,
            notes,
            validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            isRefillable: isRefillable || false,
            maxRefills: maxRefills || 0,
            status: 'created'
        });

        // Notify patient
        await createNotification({
            recipientId: patientId,
            recipientRole: 'patient',
            type: 'prescription_created',
            title: 'New Prescription',
            message: `Dr. ${doctor.name} has created a prescription for you: ${diagnosis}`,
            referenceId: prescription._id,
            referenceType: 'prescription',
            priority: 'high',
            actionUrl: '/patient/prescriptions'
        });

        res.status(201).json({ success: true, prescription });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ success: false, message: 'Failed to create prescription', error: error.message });
    }
};

/**
 * Send prescription to a pharmacy
 * POST /api/prescriptions/:id/send
 * Auth: Doctor only
 */
const sendToPharmacy = async (req, res) => {
    try {
        const { id } = req.params;
        const { pharmacyId } = req.body;
        const doctorId = req.user.id;

        const prescription = await Prescription.findOne({ _id: id, doctorId });
        if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });

        const pharmacy = await PharmacyUser.findById(pharmacyId);
        if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

        prescription.pharmacyId = pharmacyId;
        prescription.status = 'sent_to_pharmacy';
        await prescription.save();

        const doctor = await Doctor.findById(doctorId);

        // Notify pharmacy
        await createNotification({
            recipientId: pharmacyId,
            recipientRole: 'pharmacy',
            type: 'prescription_sent',
            title: 'New Prescription Received',
            message: `Dr. ${doctor.name} has sent a prescription for processing`,
            referenceId: prescription._id,
            referenceType: 'prescription',
            priority: 'high',
            actionUrl: '/pharmacy/dashboard'
        });

        // Notify patient
        await createNotification({
            recipientId: prescription.patientId.toString(),
            recipientRole: 'patient',
            type: 'prescription_sent',
            title: 'Prescription Sent to Pharmacy',
            message: `Your prescription has been sent to ${pharmacy.name}`,
            referenceId: prescription._id,
            referenceType: 'prescription',
            actionUrl: '/patient/prescriptions'
        });

        res.json({ success: true, message: 'Prescription sent to pharmacy', prescription });
    } catch (error) {
        console.error('Error sending prescription to pharmacy:', error);
        res.status(500).json({ success: false, message: 'Failed to send prescription', error: error.message });
    }
};

/**
 * Get prescriptions for the logged-in doctor
 * GET /api/prescriptions/doctor
 */
const getDoctorPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ doctorId: req.user.id })
            .populate('patientId', 'name email phone')
            .populate('pharmacyId', 'name address phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: error.message });
    }
};

/**
 * Get prescriptions for the logged-in patient
 * GET /api/prescriptions/patient
 */
const getPatientPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.user.id })
            .populate('doctorId', 'name specialization image')
            .populate('pharmacyId', 'name address phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: error.message });
    }
};

/**
 * Get prescriptions sent to the logged-in pharmacy
 * GET /api/prescriptions/pharmacy
 */
const getPharmacyPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ pharmacyId: req.user.id })
            .populate('doctorId', 'name specialization')
            .populate('patientId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: error.message });
    }
};

/**
 * Update prescription status (pharmacy side)
 * PUT /api/prescriptions/:id/status
 */
const updatePrescriptionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, pharmacyNotes } = req.body;
        const pharmacyId = req.user.id;

        const validTransitions = {
            'sent_to_pharmacy': ['received', 'cancelled'],
            'received': ['processing', 'cancelled'],
            'processing': ['ready', 'cancelled'],
            'ready': ['dispensed'],
        };

        const prescription = await Prescription.findOne({ _id: id, pharmacyId });
        if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });

        const allowedNext = validTransitions[prescription.status] || [];
        if (!allowedNext.includes(status)) {
            return res.status(400).json({ success: false, message: `Cannot transition from ${prescription.status} to ${status}` });
        }

        prescription.status = status;
        if (pharmacyNotes) prescription.pharmacyNotes = pharmacyNotes;
        if (status === 'dispensed') {
            prescription.dispensedAt = new Date();
            prescription.dispensedBy = req.user.id;
        }
        await prescription.save();

        // Notify patient of status changes
        const statusMessages = {
            'received': 'Your prescription has been received by the pharmacy',
            'processing': 'Your prescription is being prepared',
            'ready': 'Your prescription is ready for pickup/delivery!',
            'dispensed': 'Your prescription has been dispensed',
            'cancelled': 'Your prescription has been cancelled by the pharmacy'
        };

        await createNotification({
            recipientId: prescription.patientId.toString(),
            recipientRole: 'patient',
            type: status === 'ready' ? 'prescription_ready' : 'prescription_dispensed',
            title: 'Prescription Update',
            message: statusMessages[status] || `Prescription status updated to ${status}`,
            referenceId: prescription._id,
            referenceType: 'prescription',
            priority: status === 'ready' ? 'high' : 'medium',
            actionUrl: '/patient/prescriptions'
        });

        res.json({ success: true, prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update prescription status', error: error.message });
    }
};

/**
 * Get all pharmacies with availability for prescription medicines
 * POST /api/prescriptions/:id/check-availability
 */
const checkPharmacyAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const prescription = await Prescription.findById(id);
        if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });

        const medicineNames = prescription.medicines.map(m => m.medicineName.toLowerCase());
        
        // Find pharmacies that have these medicines in stock
        const medicines = await Medicine.find({
            name: { $regex: new RegExp(medicineNames.join('|'), 'i') },
            stock: { $gt: 0 }
        }).populate('pharmacyId', 'name address phone');

        // Group by pharmacy
        const pharmacyMap = {};
        medicines.forEach(med => {
            const pid = med.pharmacyId._id.toString();
            if (!pharmacyMap[pid]) {
                pharmacyMap[pid] = {
                    pharmacy: med.pharmacyId,
                    availableMedicines: [],
                    totalAvailable: 0
                };
            }
            pharmacyMap[pid].availableMedicines.push({
                name: med.name,
                price: med.price,
                stock: med.stock
            });
            pharmacyMap[pid].totalAvailable++;
        });

        const pharmacies = Object.values(pharmacyMap).sort((a, b) => b.totalAvailable - a.totalAvailable);
        
        res.json({ 
            success: true, 
            totalMedicines: medicineNames.length,
            pharmacies 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check availability', error: error.message });
    }
};

module.exports = {
    createPrescription,
    sendToPharmacy,
    getDoctorPrescriptions,
    getPatientPrescriptions,
    getPharmacyPrescriptions,
    updatePrescriptionStatus,
    checkPharmacyAvailability
};
