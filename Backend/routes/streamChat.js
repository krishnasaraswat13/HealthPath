/**
 * Stream Chat Routes
 * Handles Stream.io chat and video call endpoints
 */

const express = require('express');
const router = express.Router();
const { 
    initializeChannel, 
    getChatToken,
    initializeVideoCall 
} = require('../controllers/streamChatController');
const authMiddleware = require('../middleware/auth');

// Initialize a chat channel between doctor and patient
router.post('/channel', authMiddleware, initializeChannel);

// Get Stream token for authenticated user
router.get('/token', authMiddleware, getChatToken);

// Initialize a video call within a chat
router.post('/video-call', authMiddleware, initializeVideoCall);

module.exports = router;
