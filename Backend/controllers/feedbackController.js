/**
 * Feedback Controller
 * Post-appointment patient satisfaction surveys
 */

const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');

/**
 * Submit feedback for an appointment
 * POST /api/feedback
 */
const submitFeedback = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { appointmentId, doctorId, overallRating, ratings, wouldRecommend, visitPurposeMet, comments, improvementSuggestions, isAnonymous } = req.body;

        if (!appointmentId || !doctorId || !overallRating) {
            return res.status(400).json({ success: false, message: 'Appointment ID, Doctor ID, and overall rating are required' });
        }

        // Verify appointment exists and belongs to patient
        const appointment = await Appointment.findOne({ _id: appointmentId, patientId, status: 'completed' });
        if (!appointment) return res.status(404).json({ success: false, message: 'Completed appointment not found' });

        // Check for duplicate feedback
        const existing = await Feedback.findOne({ appointmentId });
        if (existing) return res.status(400).json({ success: false, message: 'Feedback already submitted for this appointment' });

        const feedback = await Feedback.create({
            patientId, doctorId, appointmentId,
            overallRating, ratings,
            wouldRecommend, visitPurposeMet,
            comments, improvementSuggestions,
            isAnonymous: isAnonymous || false
        });

        // Update doctor's average rating
        const allFeedback = await Feedback.find({ doctorId });
        const avgRating = allFeedback.reduce((sum, f) => sum + f.overallRating, 0) / allFeedback.length;
        await Doctor.findByIdAndUpdate(doctorId, { averageRating: avgRating.toFixed(1), totalRatings: allFeedback.length });

        const patient = await Patient.findById(patientId);
        // Notify doctor
        await Notification.create({
            recipientId: doctorId,
            recipientRole: 'doctor',
            type: 'feedback_received',
            title: 'New Patient Feedback',
            message: isAnonymous ? `Anonymous patient rated you ${overallRating}/5` : `${patient.name} rated you ${overallRating}/5`,
            referenceId: feedback._id,
            referenceType: 'feedback',
            priority: 'medium'
        });

        res.status(201).json({ success: true, feedback });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to submit feedback', error: error.message });
    }
};

/**
 * Get feedback for a doctor
 * GET /api/feedback/doctor
 */
const getDoctorFeedback = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const feedback = await Feedback.find({ doctorId })
            .populate('patientId', 'name')
            .populate('appointmentId', 'date timeSlot')
            .sort({ createdAt: -1 });

        // Compute analytics
        const total = feedback.length;
        const avgOverall = total > 0 ? (feedback.reduce((s, f) => s + f.overallRating, 0) / total).toFixed(1) : 0;
        const recommendRate = total > 0 ? Math.round((feedback.filter(f => f.wouldRecommend).length / total) * 100) : 0;
        const purposeMetRate = total > 0 ? Math.round((feedback.filter(f => f.visitPurposeMet).length / total) * 100) : 0;

        const categoryAvgs = {};
        const categories = ['communication', 'professionalism', 'waitTime', 'treatmentEffectiveness', 'facilityExperience'];
        categories.forEach(cat => {
            const vals = feedback.filter(f => f.ratings && f.ratings[cat]).map(f => f.ratings[cat]);
            categoryAvgs[cat] = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : 0;
        });

        // Rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedback.forEach(f => { distribution[f.overallRating]++; });

        res.json({
            success: true,
            feedback,
            analytics: { total, avgOverall, recommendRate, purposeMetRate, categoryAvgs, distribution }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch feedback', error: error.message });
    }
};

/**
 * Get feedback by patient (their own submissions)
 * GET /api/feedback/patient
 */
const getPatientFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ patientId: req.user.id })
            .populate('doctorId', 'name specialization image')
            .populate('appointmentId', 'date timeSlot')
            .sort({ createdAt: -1 });
        res.json({ success: true, feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch feedback', error: error.message });
    }
};

/**
 * Doctor responds to feedback
 * PUT /api/feedback/:id/respond
 */
const respondToFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorResponse } = req.body;
        const doctorId = req.user.id;

        const feedback = await Feedback.findOneAndUpdate(
            { _id: id, doctorId },
            { doctorResponse, respondedAt: new Date(), status: 'responded' },
            { new: true }
        );
        if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

        res.json({ success: true, feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to respond to feedback', error: error.message });
    }
};

/**
 * Check if feedback is pending for any completed appointments
 * GET /api/feedback/pending
 */
const getPendingFeedback = async (req, res) => {
    try {
        const patientId = req.user.id;
        
        // Find completed appointments without feedback
        const completedAppts = await Appointment.find({ patientId, status: 'completed' })
            .populate('doctorId', 'name specialization image')
            .sort({ date: -1 });

        const feedbackApptIds = (await Feedback.find({ patientId }).select('appointmentId')).map(f => f.appointmentId.toString());
        
        const pendingFeedback = completedAppts.filter(appt => !feedbackApptIds.includes(appt._id.toString()));

        res.json({ success: true, pendingFeedback });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch pending feedback', error: error.message });
    }
};

module.exports = {
    submitFeedback,
    getDoctorFeedback,
    getPatientFeedback,
    respondToFeedback,
    getPendingFeedback
};
