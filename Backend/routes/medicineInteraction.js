const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineInteractionController');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/medicine/interaction-check
// @desc    Check drug interactions between multiple medicines
// @access  Private (Patient) - Rate Limited (AI)
router.post('/interaction-check', auth, aiLimiter, medicineController.checkInteraction);

// @route   GET /api/medicine/warnings/:medicineName
// @desc    Get warnings and info for a single medicine
// @access  Private (Patient) - Rate Limited (AI)
router.get('/warnings/:medicineName', auth, aiLimiter, medicineController.getMedicineWarnings);

// @route   POST /api/medicine/prescription-qr
// @desc    Generate QR code data for prescription
// @access  Private (Doctor)
router.post('/prescription-qr', auth, medicineController.generatePrescriptionQR);

// @route   POST /api/medicine/verify-prescription
// @desc    Verify prescription QR code
// @access  Private (Pharmacy)
router.post('/verify-prescription', auth, medicineController.verifyPrescription);

module.exports = router;
