const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    createPrescription,
    sendToPharmacy,
    getDoctorPrescriptions,
    getPatientPrescriptions,
    getPharmacyPrescriptions,
    updatePrescriptionStatus,
    checkPharmacyAvailability
} = require('../controllers/prescriptionController');

// Doctor routes
router.post('/', auth, createPrescription);
router.post('/:id/send', auth, sendToPharmacy);
router.get('/doctor', auth, getDoctorPrescriptions);

// Patient routes
router.get('/patient', auth, getPatientPrescriptions);

// Pharmacy routes
router.get('/pharmacy', auth, getPharmacyPrescriptions);
router.put('/:id/status', auth, updatePrescriptionStatus);

// Shared routes
router.post('/:id/check-availability', auth, checkPharmacyAvailability);

module.exports = router;
