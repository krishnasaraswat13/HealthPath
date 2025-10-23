/**
 * Video Call Routes
 * Handles Stream.io video call endpoints
 */

const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/video/token
// @desc    Get Stream token for video calls
// @access  Private
router.get('/token', videoController.getStreamToken);

// @route   POST /api/video/call/init
// @desc    Initialize a video call for an appointment
// @access  Private
router.post('/call/init', videoController.initializeCall);

// @route   POST /api/video/call/end
// @desc    End a video call
// @access  Private
router.post('/call/end', videoController.endCall);

module.exports = router;
