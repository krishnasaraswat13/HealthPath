const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const HospitalAccount = require('../models/HospitalAccount');
const PharmacyUser = require('../models/PharmacyUser');
const Medicine = require('../models/Medicine');
const BulkOrder = require('../models/BulkOrder');
const verifyToken = require('../middleware/auth');

// Add a new hospital
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        if (!name || !latitude || !longitude) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newHospital = new Hospital({
            name,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            addedBy: req.user.id
        });

        await newHospital.save();
        res.status(201).json({ message: 'Hospital added successfully', hospital: newHospital });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all registered hospitals (from both Hospital and HospitalAccount models)
router.get('/all', async (req, res) => {
    try {
        // Fetch hospitals added by doctors
        const doctorAddedHospitals = await Hospital.find();

        // Fetch hospital accounts registered via registration (with pricing)
        const hospitalAccounts = await HospitalAccount.find().select('name email phone address location specialties beds emergencyServices pricing');

        // Format hospital accounts to match the Hospital model structure
        const formattedAccounts = hospitalAccounts.map(hospital => ({
            _id: hospital._id,
            name: hospital.name,
            location: hospital.location,
            email: hospital.email,
            phone: hospital.phone,
            address: hospital.address,
            specialties: hospital.specialties,
            beds: hospital.beds,
            emergencyServices: hospital.emergencyServices,
            pricing: hospital.pricing || [],
            type: 'hospital_account'
        }));

        // Combine both lists
        const allHospitals = [...doctorAddedHospitals, ...formattedAccounts];

        res.status(200).json(allHospitals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===========================
// PHARMACY INTEGRATION ROUTES
// ===========================

// GET /hospital/pharmacies - Get all pharmacies for hospital to browse
router.get('/pharmacies', verifyToken, async (req, res) => {
    try {
        const pharmacies = await PharmacyUser.find({}, 'name email address phone')
            .sort({ name: 1 });
        res.json(pharmacies);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching pharmacies.' });
    }
});

// GET /hospital/pharmacies/:id/medicines - Get medicines of a specific pharmacy
router.get('/pharmacies/:id/medicines', verifyToken, async (req, res) => {
    try {
        const medicines = await Medicine.find({ 
            pharmacyId: req.params.id,
            stock: { $gt: 0 }
        }).select('name price stock category expiryDate');
        
        const pharmacy = await PharmacyUser.findById(req.params.id, 'name address phone email');
        
        res.json({ pharmacy, medicines });
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching pharmacy medicines.' });
    }
});

// POST /hospital/bulk-order - Place a bulk order to a pharmacy
router.post('/bulk-order', verifyToken, async (req, res) => {
    try {
        const { pharmacyId, items, priority, notes } = req.body;
        
        if (!pharmacyId || !items || items.length === 0) {
            return res.status(400).json({ message: 'Pharmacy and items are required' });
        }

        // Get hospital details
        const hospital = await HospitalAccount.findById(req.user.id);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        // Get pharmacy details
        const pharmacy = await PharmacyUser.findById(pharmacyId);
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        // Calculate totals and validate items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const medicine = await Medicine.findById(item.medicineId);
            if (!medicine) {
                return res.status(400).json({ message: `Medicine not found: ${item.medicineName}` });
            }
            if (medicine.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}` 
                });
            }

            const itemTotal = medicine.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                medicineId: medicine._id,
                medicineName: medicine.name,
                quantity: item.quantity,
                unitPrice: medicine.price,
                totalPrice: itemTotal
            });
        }

        // Create the bulk order
        const bulkOrder = new BulkOrder({
            hospitalId: hospital._id,
            hospitalName: hospital.name,
            hospitalContact: {
                phone: hospital.phone,
                email: hospital.email,
                address: hospital.address
            },
            pharmacyId: pharmacy._id,
            pharmacyName: pharmacy.name,
            items: orderItems,
            totalAmount,
            priority: priority || 'Normal',
            notes: notes || ''
        });

        await bulkOrder.save();

        res.status(201).json({ 
            message: 'Bulk order placed successfully', 
            order: bulkOrder 
        });
    } catch (err) {
        console.error('Bulk order error:', err);
        res.status(500).json({ message: 'Server error placing bulk order.' });
    }
});

// GET /hospital/bulk-orders - Get hospital's bulk orders
router.get('/bulk-orders', verifyToken, async (req, res) => {
    try {
        const orders = await BulkOrder.find({ hospitalId: req.user.id })
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching bulk orders.' });
    }
});

// PUT /hospital/bulk-orders/:id/cancel - Cancel a bulk order
router.put('/bulk-orders/:id/cancel', verifyToken, async (req, res) => {
    try {
        const order = await BulkOrder.findOne({ 
            _id: req.params.id, 
            hospitalId: req.user.id,
            status: 'Pending' // Can only cancel pending orders
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
        }

        order.status = 'Cancelled';
        await order.save();

        res.json({ message: 'Order cancelled successfully', order });
    } catch (err) {
        res.status(500).json({ message: 'Server error cancelling order.' });
    }
});

module.exports = router;