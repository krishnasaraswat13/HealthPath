/**
 * Video Call Controller
 * Handles Stream.io video call functionality for telemedicine
 */

const { generateStreamToken, upsertStreamUser, createVideoCall, apiKey } = require('../lib/stream');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

/**
 * Get Stream token for authenticated user
 * @route GET /api/video/token
 * @access Private
 */
exports.getStreamToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Get user details based on role
        let user;
        if (userRole === 'doctor') {
            user = await Doctor.findById(userId).select('name email image');
        } else if (userRole === 'patient') {
            user = await Patient.findById(userId).select('name email');
        } else {
            return res.status(400).json({ success: false, message: 'Invalid user role' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Upsert user in Stream
        const streamUserId = `${userRole}_${userId}`;
        await upsertStreamUser({
            id: streamUserId,
            name: user.name,
            image: user.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            role: userRole
        });

        // Generate token
        const token = generateStreamToken(streamUserId);

        res.json({
            success: true,
            token,
            apiKey,
            userId: streamUserId,
            userName: user.name,
            userImage: user.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
        });

    } catch (error) {
        console.error('❌ Stream Token Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate video token',
            error: error.message 
        });
    }
};

/**
 * Initialize a video call for an appointment
 * @route POST /api/video/call/init
 * @access Private
 */
exports.initializeCall = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get appointment with populated data
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'name')
            .populate('patientId', 'name');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify user is part of this appointment
        const isDoctor = userRole === 'doctor' && appointment.doctorId._id.toString() === userId;
        const isPatient = userRole === 'patient' && appointment.patientId._id.toString() === userId;

        if (!isDoctor && !isPatient) {
            return res.status(403).json({ success: false, message: 'Not authorized for this call' });
        }

        // Create call ID from appointment ID
        const callId = `appointment_${appointmentId}`;

        // Member IDs for the call
        const memberIds = [
            `doctor_${appointment.doctorId._id}`,
            `patient_${appointment.patientId._id}`
        ];

        // Create/get the video call
        await createVideoCall(callId, memberIds);

        res.json({
            success: true,
            callId,
            appointmentId,
            participants: {
                doctor: {
                    id: `doctor_${appointment.doctorId._id}`,
                    name: appointment.doctorId.name
                },
                patient: {
                    id: `patient_${appointment.patientId._id}`,
                    name: appointment.patientId.name
                }
            }
        });

    } catch (error) {
        console.error('❌ Call Init Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initialize video call',
            error: error.message 
        });
    }
};

/**
 * End a video call
 * @route POST /api/video/call/end
 * @access Private
 */
exports.endCall = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        // Could add logic here to:
        // - Update appointment status
        // - Log call duration
        // - Notify participants
        
        res.json({
            success: true,
            message: 'Call ended successfully'
        });

    } catch (error) {
        console.error('❌ End Call Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to end call',
            error: error.message 
        });
    }
};
