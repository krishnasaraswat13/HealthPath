const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const aiAdvanced = require('../controllers/aiAdvancedController');
const prescriptionPDF = require('../controllers/prescriptionPDFController');

// ===== DOCTOR AI TOOLS =====
router.post('/clinical-notes', auth, aiLimiter, aiAdvanced.generateClinicalNotes);
router.post('/treatment-plan', auth, aiLimiter, aiAdvanced.generateTreatmentPlan);
router.post('/medical-certificate', auth, aiLimiter, aiAdvanced.generateMedicalCertificate);
router.post('/feedback-insights', auth, aiLimiter, aiAdvanced.analyzeFeedbackInsights);

// ===== PATIENT AI TOOLS =====
router.post('/diet-plan', auth, aiLimiter, aiAdvanced.generateDietPlan);
router.post('/symptom-triage', auth, aiLimiter, aiAdvanced.triageSymptoms);
router.get('/wellness-score', auth, aiLimiter, aiAdvanced.calculateWellnessScore);
router.post('/appointment-suggestions', auth, aiLimiter, aiAdvanced.suggestAppointmentSlots);
router.post('/translate', auth, aiLimiter, aiAdvanced.translateMedical);

// ===== PHARMACY AI TOOLS =====
router.post('/drug-alternatives', auth, aiLimiter, aiAdvanced.suggestDrugAlternatives);
router.post('/smart-reorder', auth, aiLimiter, aiAdvanced.smartReorderSuggestions);

// ===== HOSPITAL AI TOOLS =====
router.post('/cost-estimate', auth, aiLimiter, aiAdvanced.estimateTreatmentCost);
router.post('/discharge-summary', auth, aiLimiter, aiAdvanced.generateDischargeSummary);
router.post('/capacity-forecast', auth, aiLimiter, aiAdvanced.forecastCapacity);

// ===== PRESCRIPTION PDF =====
router.get('/prescription-pdf/:prescriptionId', auth, prescriptionPDF.getPrescriptionPDFData);
router.get('/patient-prescriptions-detailed', auth, prescriptionPDF.getPatientPrescriptionsDetailed);

module.exports = router;
