const express = require('express');
const router = express.Router();
const { EmergencyServices, EmergencyRequest } = require('../models/EmergencyServices');
const HospitalAccount = require('../models/HospitalAccount');
const verifyToken = require('../middleware/auth');

// ==================== HOSPITAL ENDPOINTS ====================

// Initialize/Get emergency services for a hospital
router.get('/hospital/services', verifyToken, async (req, res) => {
    try {
        let services = await EmergencyServices.findOne({ hospital: req.user.id });
        
        if (!services) {
            // Initialize with default values
            services = new EmergencyServices({
                hospital: req.user.id,
                bloodBank: {
                    available: false,
                    stocks: [
                        { bloodType: 'A+', units: 0 },
                        { bloodType: 'A-', units: 0 },
                        { bloodType: 'B+', units: 0 },
                        { bloodType: 'B-', units: 0 },
                        { bloodType: 'AB+', units: 0 },
                        { bloodType: 'AB-', units: 0 },
                        { bloodType: 'O+', units: 0 },
                        { bloodType: 'O-', units: 0 }
                    ]
                },
                bedAvailability: [
                    { type: 'General', total: 0, available: 0 },
                    { type: 'ICU', total: 0, available: 0 },
                    { type: 'Emergency', total: 0, available: 0 }
                ],
                equipment: [
                    { name: 'Ventilator', total: 0, available: 0 },
                    { name: 'Oxygen Concentrator', total: 0, available: 0 }
                ],
                ambulances: []
            });
            await services.save();
        }
        
        res.json(services);
    } catch (error) {
        console.error('Error fetching emergency services:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update blood bank stocks
router.put('/hospital/blood-stock', verifyToken, async (req, res) => {
    try {
        const { stocks, available, contactNumber, operatingHours } = req.body;
        
        const services = await EmergencyServices.findOneAndUpdate(
            { hospital: req.user.id },
            {
                $set: {
                    'bloodBank.available': available,
                    'bloodBank.stocks': stocks,
                    'bloodBank.contactNumber': contactNumber,
                    'bloodBank.operatingHours': operatingHours,
                    lastUpdated: new Date()
                }
            },
            { new: true, upsert: true }
        );
        
        res.json({ message: 'Blood stock updated successfully', services });
    } catch (error) {
        console.error('Error updating blood stock:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bed availability
router.put('/hospital/beds', verifyToken, async (req, res) => {
    try {
        const { bedAvailability } = req.body;
        
        const services = await EmergencyServices.findOneAndUpdate(
            { hospital: req.user.id },
            {
                $set: {
                    bedAvailability,
                    lastUpdated: new Date()
                }
            },
            { new: true, upsert: true }
        );
        
        res.json({ message: 'Bed availability updated successfully', services });
    } catch (error) {
        console.error('Error updating beds:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update equipment availability
router.put('/hospital/equipment', verifyToken, async (req, res) => {
    try {
        const { equipment } = req.body;
        
        const services = await EmergencyServices.findOneAndUpdate(
            { hospital: req.user.id },
            {
                $set: {
                    equipment,
                    lastUpdated: new Date()
                }
            },
            { new: true, upsert: true }
        );
        
        res.json({ message: 'Equipment availability updated successfully', services });
    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update ambulance availability
router.put('/hospital/ambulances', verifyToken, async (req, res) => {
    try {
        const { ambulances } = req.body;
        
        const services = await EmergencyServices.findOneAndUpdate(
            { hospital: req.user.id },
            {
                $set: {
                    ambulances,
                    lastUpdated: new Date()
                }
            },
            { new: true, upsert: true }
        );
        
        res.json({ message: 'Ambulance availability updated successfully', services });
    } catch (error) {
        console.error('Error updating ambulances:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update emergency contacts and special services
router.put('/hospital/emergency-info', verifyToken, async (req, res) => {
    try {
        const { emergencyContact, specialServices, is24x7, acceptingEmergencies } = req.body;
        
        const services = await EmergencyServices.findOneAndUpdate(
            { hospital: req.user.id },
            {
                $set: {
                    emergencyContact,
                    specialServices,
                    is24x7,
                    acceptingEmergencies,
                    lastUpdated: new Date()
                }
            },
            { new: true, upsert: true }
        );
        
        res.json({ message: 'Emergency info updated successfully', services });
    } catch (error) {
        console.error('Error updating emergency info:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get emergency requests for hospital
router.get('/hospital/requests', verifyToken, async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({ hospital: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Respond to emergency request
router.put('/hospital/requests/:id', verifyToken, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        const request = await EmergencyRequest.findOneAndUpdate(
            { _id: req.params.id, hospital: req.user.id },
            {
                $set: {
                    status,
                    notes,
                    respondedAt: new Date()
                }
            },
            { new: true }
        );
        
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        res.json({ message: 'Request updated successfully', request });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== PUBLIC/PATIENT ENDPOINTS ====================

// Search hospitals with blood availability
router.get('/search/blood/:bloodType', async (req, res) => {
    try {
        const { bloodType } = req.params;
        const { lat, lng, maxDistance = 50000 } = req.query;
        
        const services = await EmergencyServices.find({
            'bloodBank.available': true,
            'bloodBank.stocks': {
                $elemMatch: {
                    bloodType: bloodType,
                    units: { $gt: 0 }
                }
            }
        }).populate('hospital', 'name address phone location');
        
        let results = services.map(s => {
            const stock = s.bloodBank.stocks.find(b => b.bloodType === bloodType);
            return {
                hospitalId: s.hospital._id,
                name: s.hospital.name,
                address: s.hospital.address,
                phone: s.hospital.phone,
                location: s.hospital.location,
                bloodType: bloodType,
                unitsAvailable: stock ? stock.units : 0,
                contactNumber: s.bloodBank.contactNumber,
                operatingHours: s.bloodBank.operatingHours,
                lastUpdated: stock ? stock.lastUpdated : null
            };
        });
        
        if (lat && lng) {
            results = results.map(r => {
                if (r.location && r.location.coordinates) {
                    const distance = calculateDistance(
                        parseFloat(lat), parseFloat(lng),
                        r.location.coordinates[1], r.location.coordinates[0]
                    );
                    return { ...r, distance: Math.round(distance * 10) / 10 };
                }
                return r;
            }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        
        res.json(results);
    } catch (error) {
        console.error('Error searching blood:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search hospitals with bed availability
router.get('/search/beds/:bedType', async (req, res) => {
    try {
        const { bedType } = req.params;
        const { lat, lng } = req.query;
        
        const services = await EmergencyServices.find({
            'bedAvailability': {
                $elemMatch: {
                    type: bedType,
                    available: { $gt: 0 }
                }
            }
        }).populate('hospital', 'name address phone location emergencyServices');
        
        let results = services.map(s => {
            const bed = s.bedAvailability.find(b => b.type === bedType);
            return {
                hospitalId: s.hospital._id,
                name: s.hospital.name,
                address: s.hospital.address,
                phone: s.hospital.phone,
                location: s.hospital.location,
                emergencyServices: s.hospital.emergencyServices,
                bedType: bedType,
                available: bed ? bed.available : 0,
                total: bed ? bed.total : 0,
                lastUpdated: bed ? bed.lastUpdated : null,
                is24x7: s.is24x7,
                acceptingEmergencies: s.acceptingEmergencies
            };
        });
        
        if (lat && lng) {
            results = results.map(r => {
                if (r.location && r.location.coordinates) {
                    const distance = calculateDistance(
                        parseFloat(lat), parseFloat(lng),
                        r.location.coordinates[1], r.location.coordinates[0]
                    );
                    return { ...r, distance: Math.round(distance * 10) / 10 };
                }
                return r;
            }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        
        res.json(results);
    } catch (error) {
        console.error('Error searching beds:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all nearby hospitals with emergency services
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, maxDistance = 30 } = req.query;
        
        const hospitals = await HospitalAccount.find({
            emergencyServices: true
        }).select('name address phone location beds specialties');
        
        const servicesData = await EmergencyServices.find({
            acceptingEmergencies: true
        });
        
        const servicesMap = {};
        servicesData.forEach(s => {
            servicesMap[s.hospital.toString()] = s;
        });
        
        let results = hospitals.map(h => {
            const services = servicesMap[h._id.toString()];
            
            let totalAvailableBeds = 0;
            let icuAvailable = 0;
            let hasBlood = false;
            let ventilatorAvailable = 0;
            
            if (services) {
                services.bedAvailability.forEach(b => {
                    totalAvailableBeds += b.available;
                    if (b.type === 'ICU') icuAvailable = b.available;
                });
                
                hasBlood = services.bloodBank?.available && 
                    services.bloodBank.stocks.some(s => s.units > 0);
                
                const ventilator = services.equipment?.find(e => e.name === 'Ventilator');
                ventilatorAvailable = ventilator ? ventilator.available : 0;
            }
            
            return {
                _id: h._id,
                name: h.name,
                address: h.address,
                phone: h.phone,
                location: h.location,
                totalBeds: h.beds,
                availableBeds: totalAvailableBeds,
                icuAvailable,
                hasBloodBank: hasBlood,
                ventilatorAvailable,
                specialties: h.specialties,
                is24x7: services?.is24x7 || false,
                specialServices: services?.specialServices || [],
                emergencyContact: services?.emergencyContact || {},
                lastUpdated: services?.lastUpdated
            };
        });
        
        if (lat && lng) {
            results = results.map(r => {
                if (r.location && r.location.coordinates) {
                    const distance = calculateDistance(
                        parseFloat(lat), parseFloat(lng),
                        r.location.coordinates[1], r.location.coordinates[0]
                    );
                    return { ...r, distance: Math.round(distance * 10) / 10 };
                }
                return r;
            })
            .filter(r => !maxDistance || r.distance <= parseFloat(maxDistance))
            .sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching nearby hospitals:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single hospital emergency details
router.get('/hospital/:id/details', async (req, res) => {
    try {
        const hospital = await HospitalAccount.findById(req.params.id)
            .select('name address phone location beds specialties emergencyServices pricing');
        
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        
        const services = await EmergencyServices.findOne({ hospital: req.params.id });
        
        res.json({
            hospital,
            emergencyServices: services || null
        });
    } catch (error) {
        console.error('Error fetching hospital details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create emergency request
router.post('/request', verifyToken, async (req, res) => {
    try {
        const { 
            requestType, 
            hospitalId, 
            patientName, 
            contactNumber, 
            bloodType, 
            bedType, 
            urgency, 
            notes 
        } = req.body;
        
        const request = new EmergencyRequest({
            requestType,
            patientName,
            contactNumber,
            bloodType,
            bedType,
            urgency,
            notes,
            hospital: hospitalId,
            requestedBy: req.user.id,
            requestedByModel: req.user.role === 'doctor' ? 'Doctor' : 'Patient'
        });
        
        await request.save();
        
        res.status(201).json({ 
            message: 'Emergency request submitted successfully', 
            request 
        });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's emergency requests
router.get('/my-requests', verifyToken, async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({ requestedBy: req.user.id })
            .populate('hospital', 'name address phone')
            .sort({ createdAt: -1 });
        
        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== HELPER FUNCTIONS ====================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI/180);
}

module.exports = router;
