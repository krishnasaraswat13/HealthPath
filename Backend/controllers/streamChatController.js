/**
 * Stream Chat Controller
 * Handles Stream.io chat channel creation and token generation
 */

const { 
    generateStreamToken, 
    upsertStreamUser, 
    getOrCreateChannel,
    createVideoCall,
    apiKey 
} = require('../lib/stream');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

/**
 * Initialize a chat channel between doctor and patient
 * POST /api/stream/chat/channel
 */
const initializeChannel = async (req, res) => {
    try {
        const { doctorId, patientId } = req.body;
        
        if (!doctorId || !patientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Doctor ID and Patient ID are required' 
            });
        }
        
        // Fetch doctor and patient data
        const [doctor, patient] = await Promise.all([
            Doctor.findById(doctorId),
            Patient.findById(patientId)
        ]);
        
        if (!doctor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Doctor not found' 
            });
        }
        
        if (!patient) {
            return res.status(404).json({ 
                success: false, 
                message: 'Patient not found' 
            });
        }
        
        // Create unique channel ID
        const channelId = `health_chat_${[doctorId, patientId].sort().join('_')}`;
        
        // Prepare user data for Stream
        const doctorData = {
            id: `doctor_${doctorId}`,
            name: doctor.name,
            image: doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
            role: 'doctor'
        };
        
        const patientData = {
            id: `patient_${patientId}`,
            name: patient.name,
            image: patient.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            role: 'patient'
        };
        
        // Create channel in Stream
        await getOrCreateChannel(channelId, doctorData, patientData);
        
        // Generate tokens for both users
        const doctorToken = generateStreamToken(doctorData.id);
        const patientToken = generateStreamToken(patientData.id);
        
        res.json({
            success: true,
            apiKey,
            channelId,
            doctor: {
                ...doctorData,
                token: doctorToken
            },
            patient: {
                ...patientData,
                token: patientToken
            }
        });
        
    } catch (error) {
        console.error('Error initializing Stream channel:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initialize chat channel',
            error: error.message 
        });
    }
};

/**
 * Get Stream token and user info for authenticated user
 * GET /api/stream/chat/token
 */
const getChatToken = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const userType = req.user?.role || 'patient';
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }
        
        let userData;
        
        if (userType === 'doctor') {
            const doctor = await Doctor.findById(userId);
            if (!doctor) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Doctor not found' 
                });
            }
            userData = {
                id: `doctor_${userId}`,
                name: doctor.name,
                image: doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
                role: 'doctor'
            };
        } else {
            const patient = await Patient.findById(userId);
            if (!patient) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Patient not found' 
                });
            }
            userData = {
                id: `patient_${userId}`,
                name: patient.name,
                image: patient.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                role: 'patient'
            };
        }
        
        // Upsert user in Stream
        await upsertStreamUser(userData);
        
        // Generate token
        const token = generateStreamToken(userData.id);
        
        res.json({
            success: true,
            apiKey,
            user: userData,
            token
        });
        
    } catch (error) {
        console.error('Error generating chat token:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate chat token',
            error: error.message 
        });
    }
};

/**
 * Initialize video call within a chat channel
 * POST /api/stream/chat/video-call
 */
const initializeVideoCall = async (req, res) => {
    try {
        const { channelId, doctorId, patientId } = req.body;
        
        if (!channelId || !doctorId || !patientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Channel ID, Doctor ID, and Patient ID are required' 
            });
        }
        
        // Create unique call ID based on channel
        const callId = `call_${channelId}_${Date.now()}`;
        
        // Member IDs for the video call
        const memberIds = [`doctor_${doctorId}`, `patient_${patientId}`];
        
        // Create the video call
        await createVideoCall(callId, memberIds);
        
        res.json({
            success: true,
            callId,
            apiKey
        });
        
    } catch (error) {
        console.error('Error initializing video call:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initialize video call',
            error: error.message 
        });
    }
};

module.exports = {
    initializeChannel,
    getChatToken,
    initializeVideoCall
};
