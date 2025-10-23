/**
 * Emergency SOS Controller
 * Handles emergency contacts and SOS alerts
 */

const EmergencyContact = require('../models/EmergencyContact');
const Patient = require('../models/Patient');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

// @desc    Add emergency contact
// @route   POST /api/emergency/contact
// @access  Private (Patient)
exports.addContact = asyncHandler(async (req, res) => {
    const { name, relationship, phone, email, isPrimary } = req.body;

    if (!name || !phone) {
        throw new ValidationError('Name and phone are required');
    }

    // If setting as primary, unset existing primary
    if (isPrimary) {
        await EmergencyContact.updateMany(
            { patientId: req.user.id, isPrimary: true },
            { isPrimary: false }
        );
    }

    const contact = new EmergencyContact({
        patientId: req.user.id,
        name,
        relationship,
        phone,
        email,
        isPrimary: isPrimary || false
    });

    const savedContact = await contact.save();

    res.status(201).json({
        success: true,
        message: 'Emergency contact added',
        contact: savedContact
    });
});

// @desc    Get all emergency contacts
// @route   GET /api/emergency/contacts
// @access  Private (Patient)
exports.getContacts = asyncHandler(async (req, res) => {
    const contacts = await EmergencyContact.find({ patientId: req.user.id })
        .sort({ isPrimary: -1, createdAt: -1 });

    res.json({
        success: true,
        count: contacts.length,
        contacts
    });
});

// @desc    Update emergency contact
// @route   PUT /api/emergency/contact/:id
// @access  Private (Patient)
exports.updateContact = asyncHandler(async (req, res) => {
    const { name, relationship, phone, email, isPrimary } = req.body;

    const contact = await EmergencyContact.findOne({
        _id: req.params.id,
        patientId: req.user.id
    });

    if (!contact) {
        throw new NotFoundError('Emergency contact');
    }

    // If setting as primary, unset existing primary
    if (isPrimary && !contact.isPrimary) {
        await EmergencyContact.updateMany(
            { patientId: req.user.id, isPrimary: true },
            { isPrimary: false }
        );
    }

    contact.name = name || contact.name;
    contact.relationship = relationship || contact.relationship;
    contact.phone = phone || contact.phone;
    contact.email = email || contact.email;
    contact.isPrimary = isPrimary !== undefined ? isPrimary : contact.isPrimary;

    await contact.save();

    res.json({
        success: true,
        message: 'Contact updated',
        contact
    });
});

// @desc    Delete emergency contact
// @route   DELETE /api/emergency/contact/:id
// @access  Private (Patient)
exports.deleteContact = asyncHandler(async (req, res) => {
    const contact = await EmergencyContact.findOneAndDelete({
        _id: req.params.id,
        patientId: req.user.id
    });

    if (!contact) {
        throw new NotFoundError('Emergency contact');
    }

    res.json({
        success: true,
        message: 'Contact deleted'
    });
});

// @desc    Trigger SOS Alert
// @route   POST /api/emergency/sos
// @access  Private (Patient)
exports.triggerSOS = asyncHandler(async (req, res) => {
    const { location, message } = req.body;
    
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
        throw new NotFoundError('Patient');
    }

    const contacts = await EmergencyContact.find({ patientId: req.user.id });
    const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];

    // In production, this would:
    // 1. Send SMS to emergency contacts
    // 2. Send email notifications
    // 3. Notify nearby hospitals
    // 4. Log the emergency event

    // For now, we'll return the emergency data for the frontend to handle
    // via WebSocket broadcast (handled in server.js)

    const sosData = {
        patientId: patient._id,
        patientName: patient.name,
        patientPhone: patient.phone || 'Not available',
        location: location || { lat: null, lng: null, address: 'Unknown' },
        message: message || 'Emergency! I need help!',
        timestamp: new Date().toISOString(),
        emergencyContacts: contacts.map(c => ({
            name: c.name,
            phone: c.phone,
            relationship: c.relationship
        })),
        primaryContact: primaryContact ? {
            name: primaryContact.name,
            phone: primaryContact.phone
        } : null
    };

    // Log the emergency (in production, save to database)
    console.log('🚨 EMERGENCY SOS TRIGGERED:', sosData);

    res.json({
        success: true,
        message: 'SOS Alert Triggered! Emergency contacts notified.',
        sosData,
        emergencyNumbers: {
            ambulance: '102',
            police: '100',
            fire: '101'
        }
    });
});

// @desc    Get emergency info for patient profile
// @route   GET /api/emergency/info
// @access  Private (Patient)
exports.getEmergencyInfo = asyncHandler(async (req, res) => {
    const contacts = await EmergencyContact.find({ patientId: req.user.id })
        .sort({ isPrimary: -1 });

    res.json({
        success: true,
        hasEmergencyContacts: contacts.length > 0,
        primaryContact: contacts.find(c => c.isPrimary) || null,
        totalContacts: contacts.length,
        emergencyNumbers: {
            ambulance: '102',
            police: '100',
            fire: '101',
            nationalEmergency: '112'
        }
    });
});
