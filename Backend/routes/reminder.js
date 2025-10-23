const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getReminderSettings,
    updateReminderSettings,
    getUpcomingReminders,
    snoozeReminder,
    getPreparationChecklist
} = require('../controllers/reminderController');

// All routes require authentication
router.use(auth);

// Get/Update reminder settings
router.get('/settings', getReminderSettings);
router.put('/settings', updateReminderSettings);

// Get upcoming appointments as reminders
router.get('/upcoming', getUpcomingReminders);

// Snooze a reminder
router.post('/snooze/:appointmentId', snoozeReminder);

// Get preparation checklist for an appointment
router.get('/checklist/:appointmentId', getPreparationChecklist);

module.exports = router;
