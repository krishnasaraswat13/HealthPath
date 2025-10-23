const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    submitFeedback,
    getDoctorFeedback,
    getPatientFeedback,
    respondToFeedback,
    getPendingFeedback
} = require('../controllers/feedbackController');

router.post('/', auth, submitFeedback);
router.get('/doctor', auth, getDoctorFeedback);
router.get('/patient', auth, getPatientFeedback);
router.get('/pending', auth, getPendingFeedback);
router.put('/:id/respond', auth, respondToFeedback);

module.exports = router;
