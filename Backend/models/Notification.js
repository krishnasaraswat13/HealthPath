const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipientId: { type: String, required: true },
    recipientRole: {
        type: String,
        enum: ['doctor', 'patient', 'pharmacy', 'hospital'],
        required: true
    },
    
    type: {
        type: String,
        enum: [
            'appointment_booked', 'appointment_confirmed', 'appointment_cancelled',
            'appointment_reminder', 'appointment_completed',
            'prescription_created', 'prescription_sent', 'prescription_ready', 'prescription_dispensed',
            'order_placed', 'order_confirmed', 'order_ready', 'order_delivered',
            'video_call_incoming', 'video_call_missed',
            'feedback_received', 'feedback_reminder',
            'emergency_alert', 'emergency_sos',
            'health_goal_achieved', 'health_goal_reminder',
            'chat_message', 'system_alert',
            'medicine_expiry_alert', 'low_stock_alert'
        ],
        required: true
    },
    
    title: { type: String, required: true },
    message: { type: String, required: true },
    
    // Reference to the related entity
    referenceId: { type: String },
    referenceType: {
        type: String,
        enum: ['appointment', 'prescription', 'order', 'feedback', 'goal', 'emergency', 'chat', 'system']
    },
    
    // Status
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    
    // Priority
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Action URL for frontend navigation
    actionUrl: { type: String },
    
    // Metadata for additional info
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, recipientRole: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
