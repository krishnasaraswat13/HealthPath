/**
 * Symptom Journal Controller
 * Allows patients to track symptoms over time for better diagnosis
 */

const SymptomEntry = require('../models/SymptomEntry');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

// @desc    Create new symptom entry
// @route   POST /api/symptoms/entry
// @access  Private (Patient)
exports.createEntry = asyncHandler(async (req, res) => {
    const { symptoms, mood, sleepHours, waterIntake, medications, notes, vitalSigns } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        throw new ValidationError('At least one symptom is required');
    }

    const entry = new SymptomEntry({
        patientId: req.user.id,
        symptoms,
        mood,
        sleepHours,
        waterIntake,
        medications,
        notes,
        vitalSigns
    });

    const savedEntry = await entry.save();

    res.status(201).json({
        success: true,
        message: 'Symptom entry logged successfully',
        entry: savedEntry
    });
});

// @desc    Get symptom history with filters
// @route   GET /api/symptoms/history
// @access  Private (Patient)
exports.getHistory = asyncHandler(async (req, res) => {
    const { startDate, endDate, symptom, limit = 30 } = req.query;
    
    const query = { patientId: req.user.id };

    // Date range filter
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    // Symptom filter
    if (symptom) {
        query['symptoms.name'] = { $regex: symptom, $options: 'i' };
    }

    const entries = await SymptomEntry.find(query)
        .sort({ date: -1 })
        .limit(parseInt(limit));

    res.json({
        success: true,
        count: entries.length,
        entries
    });
});

// @desc    Get symptom trends/analytics
// @route   GET /api/symptoms/trends
// @access  Private (Patient)
exports.getTrends = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await SymptomEntry.find({
        patientId: req.user.id,
        date: { $gte: startDate }
    }).sort({ date: 1 });

    // Calculate trends
    const symptomFrequency = {};
    const moodTrend = [];
    const avgSleep = [];
    const severityTrend = {};

    entries.forEach(entry => {
        // Track symptom frequency
        entry.symptoms.forEach(s => {
            symptomFrequency[s.name] = (symptomFrequency[s.name] || 0) + 1;
            
            // Track severity over time
            if (!severityTrend[s.name]) severityTrend[s.name] = [];
            severityTrend[s.name].push({
                date: entry.date,
                severity: s.severity
            });
        });

        // Track mood
        if (entry.mood) {
            moodTrend.push({
                date: entry.date,
                mood: entry.mood
            });
        }

        // Track sleep
        if (entry.sleepHours) {
            avgSleep.push(entry.sleepHours);
        }
    });

    // Sort symptoms by frequency
    const topSymptoms = Object.entries(symptomFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    res.json({
        success: true,
        trends: {
            totalEntries: entries.length,
            topSymptoms,
            moodTrend,
            averageSleep: avgSleep.length > 0 
                ? (avgSleep.reduce((a, b) => a + b, 0) / avgSleep.length).toFixed(1) 
                : null,
            severityTrend
        }
    });
});

// @desc    Delete a symptom entry
// @route   DELETE /api/symptoms/entry/:id
// @access  Private (Patient)
exports.deleteEntry = asyncHandler(async (req, res) => {
    const entry = await SymptomEntry.findOneAndDelete({
        _id: req.params.id,
        patientId: req.user.id
    });

    if (!entry) {
        return res.status(404).json({
            success: false,
            message: 'Entry not found or not authorized'
        });
    }

    res.json({
        success: true,
        message: 'Entry deleted successfully'
    });
});

// @desc    Get entries for doctor view (with patient permission)
// @route   GET /api/symptoms/patient/:patientId
// @access  Private (Doctor)
exports.getPatientSymptoms = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { days = 14 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await SymptomEntry.find({
        patientId,
        date: { $gte: startDate }
    }).sort({ date: -1 });

    res.json({
        success: true,
        count: entries.length,
        entries
    });
});
