const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');
const auth = require('../middleware/auth');

// @route   POST /api/symptoms/entry
// @desc    Create new symptom journal entry
// @access  Private (Patient)
router.post('/entry', auth, symptomController.createEntry);

// @route   GET /api/symptoms/history
// @desc    Get patient's symptom history with filters
// @access  Private (Patient)
router.get('/history', auth, symptomController.getHistory);

// @route   GET /api/symptoms/trends
// @desc    Get symptom trends and analytics
// @access  Private (Patient)
router.get('/trends', auth, symptomController.getTrends);

// @route   DELETE /api/symptoms/entry/:id
// @desc    Delete a symptom entry
// @access  Private (Patient)
router.delete('/entry/:id', auth, symptomController.deleteEntry);

// @route   GET /api/symptoms/patient/:patientId
// @desc    Get patient symptoms (for doctor view)
// @access  Private (Doctor)
router.get('/patient/:patientId', auth, symptomController.getPatientSymptoms);

module.exports = router;
