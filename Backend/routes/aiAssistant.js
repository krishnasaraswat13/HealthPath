const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');
const { aiLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/ai/ask
// @desc    General AI Health Assistant query (Chatbot)
// @access  Private (Rate Limited)
router.post('/ask', auth, aiLimiter, aiController.askAI);

// @route   POST /api/ai/summarize
// @desc    Summarize a specific consultation (chat history)
// @access  Private (Rate Limited)
router.post('/summarize', auth, aiLimiter, aiController.summarizeConsultation);

// @route   POST /api/ai/query
// @desc    Generic AI Query (Smart Doctor Search, Report Analysis)
// @access  Private (Rate Limited)
router.post('/query', auth, aiLimiter, aiController.customQuery); 

module.exports = router;