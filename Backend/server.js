const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const dns = require('dns');
const path = require('path'); 

// Fix DNS resolution for MongoDB Atlas SRV records (use Google DNS)
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Security Middleware
const { apiLimiter, authLimiter, aiLimiter, uploadLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitize');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS (development + production)
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    //"https://health-bridge-ai-healthcare-l6s9.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// Setup Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(sanitizeInput); // Sanitize all inputs
app.use(apiLimiter); // Global rate limiting

// Serve Uploads Folder Statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// --- Route Imports ---
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const chatRoutes = require('./routes/chat');
const appointmentRoutes = require('./routes/appointment');
const pharmacyRoutes = require('./routes/pharmacy');
const hospitalRoutes = require('./routes/hospital');
const hospitalAuthRoutes = require('./routes/hospitalAuth');

// --- FIXED IMPORTS ---
// 1. Report Analysis Route
const reportAnalysisRoutes = require('./routes/reportAnalysis'); 

// 2. FIXED: Pointing to your existing 'aiAssistant.js' file
const aiRoutes = require('./routes/aiAssistant'); 

// 3. NEW FEATURE ROUTES
const symptomRoutes = require('./routes/symptoms');
const emergencyRoutes = require('./routes/emergency');
const medicineInteractionRoutes = require('./routes/medicineInteraction');
const reminderRoutes = require('./routes/reminder');
const healthGoalRoutes = require('./routes/healthGoal');
const videoRoutes = require('./routes/video'); // Stream.io Video Calls
const streamChatRoutes = require('./routes/streamChat'); // Stream.io Chat
const mapsRoutes = require('./routes/maps'); // Maps/Nearby Hospitals
const prescriptionRoutes = require('./routes/prescription'); // Digital Prescriptions
const notificationRoutes = require('./routes/notification'); // In-app Notifications
const feedbackRoutes = require('./routes/feedback'); // Patient Feedback/Surveys
const aiAdvancedRoutes = require('./routes/aiAdvanced'); // AI Advanced Features

// --- API Endpoints ---
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospital-auth', hospitalAuthRoutes);

// --- FIXED ENDPOINTS ---
app.use('/api/reports', reportAnalysisRoutes); 
app.use('/api/ai', aiRoutes);

// --- NEW FEATURE ENDPOINTS ---
app.use('/api/symptoms', symptomRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/medicine', medicineInteractionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/health-goals', healthGoalRoutes);
app.use('/api/video', videoRoutes); // Stream.io Video Calls 
app.use('/api/stream/chat', streamChatRoutes); // Stream.io Chat                  
app.use('/api/maps', mapsRoutes); // Maps/Nearby Hospitals
app.use('/api/prescriptions', prescriptionRoutes); // Digital Prescriptions
app.use('/api/notifications', notificationRoutes); // In-app Notifications
app.use('/api/feedback', feedbackRoutes); // Patient Feedback/Surveys
app.use('/api/ai-advanced', aiAdvancedRoutes); // AI Advanced Features (Groq)

// --- SOCKET.IO LOGIC ---
const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
        socket.join(userId); 
    }

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('join_user_room', (id) => {
        socket.join(id);
    });

    socket.on('disconnect', () => {
        const disconnectedUserId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        if (disconnectedUserId) {
            delete userSocketMap[disconnectedUserId];
            console.log(`User disconnected: ${disconnectedUserId}`);
        }
    });

    // 1. APPOINTMENT NOTIFICATIONS
    socket.on('new_appointment_booked', (data) => {
        io.to(data.doctorId).emit('appointment_notification', {
             message: `New Appointment Request from ${data.patientName}`,
             appointmentId: data.appointmentId
        });
    });

    // 1.5 APPOINTMENT REMINDER (Doctor to Patient)
    socket.on('send_appointment_reminder', (data) => {
        const { patientId, patientName, doctorName, date, time, appointmentId } = data;
        io.to(patientId).emit('appointment_reminder', {
            message: `Reminder: Your appointment with Dr. ${doctorName} is scheduled for ${date} at ${time}`,
            appointmentId: appointmentId,
            type: 'reminder'
        });
        // Also emit a general patient notification
        io.to(patientId).emit('patient_notification', {
            message: `Don't forget your upcoming appointment with Dr. ${doctorName}!`,
            type: 'reminder'
        });
        console.log(`Reminder sent to patient ${patientName} (${patientId})`);
    });

    // 2. LIVE SESSION ALERTS
    socket.on('start_session', (data) => {
        const { patientId, doctorId, doctorName } = data;
        io.to(patientId).emit('session_request', {
            doctorId: doctorId,
            doctorName: doctorName,
            sessionId: `${patientId}-${doctorId}`
        });
    });

    // 3. PHARMACY ORDER UPDATES
    socket.on('pharmacy_order_update', (data) => {
        const { patientId, status, medicineName } = data;
        io.to(patientId).emit('receive_order_update', {
            status: status,
            medicineName: medicineName,
            message: `Your order for ${medicineName} is now ${status}!`
        });
    });

    // 4. CHAT MESSAGING LOGIC
    // FIX: Socket only broadcasts - does NOT save to DB (HTTP route handles saving)
    // This prevents the duplicate message issue
    socket.on('sendMessage', async (data) => {
        try {
            const roomId = data.roomId;
            
            // Create a message object for broadcasting (not saved here)
            const messageToSend = {
                _id: data._id || `temp-${Date.now()}`, // Temp ID for optimistic UI
                senderId: data.senderId,
                receiverId: data.receiverId,
                senderRole: data.senderRole,
                message: data.message || '',
                attachmentUrl: data.attachmentUrl || null,
                attachmentType: data.attachmentType || 'none',
                timestamp: data.timestamp || new Date().toISOString()
            };
            
            // Only broadcast to room/receiver - DO NOT save to DB here
            if (roomId) {
                // Emit to room but exclude sender (they already added it locally)
                socket.to(roomId).emit('receiveMessage', messageToSend);
            } else {
                // Fallback: send directly to receiver socket
                const receiverSocketId = userSocketMap[data.receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receiveMessage', messageToSend);
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('messageError', { message: 'Failed to send message.' });
        }
    });

    socket.on('endConsultation', (data) => {
        const partnerSocketId = userSocketMap[data.partnerId];
        if (partnerSocketId) {
            io.to(partnerSocketId).emit('consultationEnded', { sessionId: data.sessionId });
        }
    });

    // 5. EMERGENCY SOS BROADCAST
    socket.on('emergency_sos', (data) => {
        const { patientId, patientName, location, emergencyContacts } = data;
        console.log(`🚨 EMERGENCY SOS from ${patientName}`);
        
        // Broadcast to all connected doctors
        socket.broadcast.emit('emergency_alert', {
            patientId,
            patientName,
            location,
            timestamp: new Date().toISOString(),
            message: `🚨 Emergency! Patient ${patientName} needs immediate assistance!`
        });
        
        // Could also notify specific emergency contacts here
    });

    // 6. TELEMEDICINE WAITING ROOM
    socket.on('join_waiting_room', (data) => {
        const { doctorId, patientId, patientName } = data;
        socket.join(`waiting-${doctorId}`);
        io.to(doctorId).emit('patient_waiting', {
            patientId,
            patientName,
            joinedAt: new Date().toISOString()
        });
    });

    socket.on('call_next_patient', (data) => {
        const { doctorId, patientId } = data;
        io.to(patientId).emit('your_turn', {
            doctorId,
            message: "The doctor is ready to see you now!"
        });
    });
});

// Import error handlers
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

server.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));