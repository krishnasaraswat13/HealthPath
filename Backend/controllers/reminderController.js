const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// Get patient's appointment reminders preferences
exports.getReminderSettings = async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id).select('reminderSettings');
        
        res.json({
            success: true,
            settings: patient?.reminderSettings || {
                email: true,
                push: true,
                sms: false,
                reminderTimes: ['1day', '2hours', '30min']
            }
        });
    } catch (error) {
        console.error('Error fetching reminder settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reminder settings' });
    }
};

// Update reminder settings
exports.updateReminderSettings = async (req, res) => {
    try {
        const { email, push, sms, reminderTimes } = req.body;
        
        const patient = await Patient.findByIdAndUpdate(
            req.user.id,
            {
                reminderSettings: {
                    email: email !== undefined ? email : true,
                    push: push !== undefined ? push : true,
                    sms: sms !== undefined ? sms : false,
                    reminderTimes: reminderTimes || ['1day', '2hours', '30min']
                }
            },
            { new: true }
        );
        
        res.json({
            success: true,
            message: 'Reminder settings updated',
            settings: patient.reminderSettings
        });
    } catch (error) {
        console.error('Error updating reminder settings:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

// Get upcoming appointments with reminder status
exports.getUpcomingReminders = async (req, res) => {
    try {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7); // Next 7 days
        
        const appointments = await Appointment.find({
            patientId: req.user.id,
            date: { $gte: now, $lte: futureDate },
            status: { $in: ['pending', 'scheduled'] }
        })
        .populate('doctorId', 'name specialization image phone')
        .sort({ date: 1 });
        
        // Calculate time until each appointment
        const reminders = appointments.map(apt => {
            const aptDate = new Date(apt.date);
            const [hours, minutes] = apt.timeSlot.split(':');
            aptDate.setHours(parseInt(hours), parseInt(minutes || 0));
            
            const timeDiff = aptDate - now;
            const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
            const daysUntil = Math.floor(hoursUntil / 24);
            
            let urgency = 'normal';
            if (hoursUntil <= 2) urgency = 'urgent';
            else if (hoursUntil <= 24) urgency = 'soon';
            
            return {
                _id: apt._id,
                doctor: apt.doctorId,
                date: apt.date,
                timeSlot: apt.timeSlot,
                type: apt.appointmentType,
                status: apt.status,
                hoursUntil,
                daysUntil,
                urgency,
                formattedTime: hoursUntil < 24 
                    ? `${hoursUntil} hours` 
                    : `${daysUntil} days`
            };
        });
        
        res.json({
            success: true,
            reminders,
            count: reminders.length
        });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reminders' });
    }
};

// Snooze a specific reminder
exports.snoozeReminder = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { snoozeDuration } = req.body; // in minutes
        
        // In a real app, you'd store snooze info in a separate collection
        // or use a notification service. For now, we'll return success.
        
        res.json({
            success: true,
            message: `Reminder snoozed for ${snoozeDuration} minutes`,
            appointmentId,
            snoozeUntil: new Date(Date.now() + snoozeDuration * 60 * 1000)
        });
    } catch (error) {
        console.error('Error snoozing reminder:', error);
        res.status(500).json({ success: false, message: 'Failed to snooze reminder' });
    }
};

// Get appointment preparation checklist based on appointment type
exports.getPreparationChecklist = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'specialization');
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        // Generate checklist based on specialization
        const checklists = {
            'General Physician': [
                { item: 'List of current medications', checked: false },
                { item: 'Recent medical reports', checked: false },
                { item: 'Insurance card/ID', checked: false },
                { item: 'List of symptoms to discuss', checked: false },
                { item: 'Questions for the doctor', checked: false }
            ],
            'Cardiologist': [
                { item: 'Previous ECG/Echo reports', checked: false },
                { item: 'List of heart medications', checked: false },
                { item: 'Blood pressure log (if available)', checked: false },
                { item: 'Avoid caffeine 24 hours before', checked: false },
                { item: 'Wear loose, comfortable clothing', checked: false },
                { item: 'Insurance card/ID', checked: false }
            ],
            'Dermatologist': [
                { item: 'Photos of skin condition over time', checked: false },
                { item: 'List of skincare products used', checked: false },
                { item: 'Come with clean, makeup-free skin', checked: false },
                { item: 'Previous biopsy/test reports', checked: false },
                { item: 'Insurance card/ID', checked: false }
            ],
            'Orthopedic': [
                { item: 'Previous X-rays/MRI reports', checked: false },
                { item: 'Wear comfortable, easy-to-remove clothing', checked: false },
                { item: 'List of pain medications', checked: false },
                { item: 'Note when pain is worse/better', checked: false },
                { item: 'Insurance card/ID', checked: false }
            ],
            'Pediatrician': [
                { item: 'Child\'s vaccination record', checked: false },
                { item: 'Growth chart/previous measurements', checked: false },
                { item: 'List of allergies', checked: false },
                { item: 'Bring a comfort item for child', checked: false },
                { item: 'Insurance card/ID', checked: false }
            ],
            'Gynecologist': [
                { item: 'Date of last menstrual period', checked: false },
                { item: 'Previous pap smear/test results', checked: false },
                { item: 'List of contraception methods used', checked: false },
                { item: 'Avoid douching 24 hours before', checked: false },
                { item: 'Insurance card/ID', checked: false }
            ],
            'default': [
                { item: 'List of current medications', checked: false },
                { item: 'Relevant medical reports', checked: false },
                { item: 'Insurance card/ID', checked: false },
                { item: 'List of questions for the doctor', checked: false },
                { item: 'Arrive 15 minutes early', checked: false }
            ]
        };
        
        const specialization = appointment.doctorId?.specialization || 'default';
        const checklist = checklists[specialization] || checklists['default'];
        
        res.json({
            success: true,
            appointment: {
                _id: appointment._id,
                date: appointment.date,
                timeSlot: appointment.timeSlot,
                specialization
            },
            checklist
        });
    } catch (error) {
        console.error('Error fetching checklist:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch checklist' });
    }
};
