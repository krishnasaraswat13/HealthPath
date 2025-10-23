const mongoose = require('mongoose');

const bulkOrderItemSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    medicineName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    }
});

const bulkOrderSchema = new mongoose.Schema({
    // Who is ordering
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HospitalAccount',
        required: true
    },
    hospitalName: {
        type: String,
        required: true
    },
    hospitalContact: {
        phone: String,
        email: String,
        address: String
    },
    
    // Who is fulfilling
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PharmacyUser',
        required: true
    },
    pharmacyName: {
        type: String,
        required: true
    },
    
    // Order details
    items: [bulkOrderItemSchema],
    
    totalAmount: {
        type: Number,
        required: true
    },
    
    // Priority levels for hospitals
    priority: {
        type: String,
        enum: ['Normal', 'Urgent', 'Emergency'],
        default: 'Normal'
    },
    
    // Special notes from hospital
    notes: {
        type: String,
        default: ''
    },
    
    // Order status tracking
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    
    // Timestamps for tracking
    orderDate: {
        type: Date,
        default: Date.now
    },
    confirmedAt: Date,
    dispatchedAt: Date,
    deliveredAt: Date,
    
    // Delivery information
    estimatedDelivery: Date,
    deliveryNotes: String,
    
    // Invoice/Payment
    invoiceNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Partial', 'Refunded'],
        default: 'Pending'
    }
}, { timestamps: true });

// Generate invoice number before saving
bulkOrderSchema.pre('save', async function(next) {
    if (!this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const count = await this.constructor.countDocuments() + 1;
        this.invoiceNumber = `INV-${year}${month}-${count.toString().padStart(5, '0')}-${random}`;
    }
    next();
});

// Index for efficient queries
bulkOrderSchema.index({ hospitalId: 1, orderDate: -1 });
bulkOrderSchema.index({ pharmacyId: 1, orderDate: -1 });
bulkOrderSchema.index({ status: 1 });

module.exports = mongoose.model('BulkOrder', bulkOrderSchema);
