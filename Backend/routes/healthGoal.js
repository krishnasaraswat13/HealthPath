const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createGoal,
    getGoals,
    getGoalById,
    logProgress,
    updateGoal,
    deleteGoal,
    getGoalSuggestions,
    getGoalAnalytics
} = require('../controllers/healthGoalController');

// All routes require authentication
router.use(auth);

// Goal suggestions (before CRUD routes to avoid conflict with :goalId)
router.get('/suggestions', getGoalSuggestions);

// Goal analytics
router.get('/analytics', getGoalAnalytics);

// CRUD operations
router.post('/', createGoal);
router.get('/', getGoals);
router.get('/:goalId', getGoalById);
router.put('/:goalId', updateGoal);
router.delete('/:goalId', deleteGoal);

// Progress logging
router.post('/:goalId/progress', logProgress);

module.exports = router;
