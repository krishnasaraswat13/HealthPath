const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// --- PUBLIC ROUTES ---

// 1. Get all doctors (with optional filters)
// @route GET /api/doctor
router.get('/', doctorController.getAllDoctors); 

// 2. Get specific doctor details (Now includes reviews!)
// @route GET /api/doctor/profile/:id
router.get('/profile/:id', doctorController.getDoctorProfileById);

// 3. Register a new doctor (Rate Limited)
// @route POST /api/doctor/register
router.post('/register', authLimiter, doctorController.registerDoctor);

// 4. Login doctor (Rate Limited)
// @route POST /api/doctor/login
router.post('/login', authLimiter, doctorController.loginDoctor);


// --- PROTECTED ROUTES (Requires Login) ---

// 5. Update doctor status
// @route PUT /api/doctor/status
router.put('/status', auth, doctorController.updateStatus);

// 6. NEW: Add a Review
// @route POST /api/doctor/review
router.post('/review', auth, doctorController.addReview); // <--- ADDED THIS

// 7. Get doctor's patients from appointments
// @route GET /api/doctor/my-patients
router.get('/my-patients', auth, doctorController.getMyPatients);

// 8. Update doctor profile
// @route PUT /api/doctor/update-profile
router.put('/update-profile', auth, doctorController.updateProfile);

module.exports = router;