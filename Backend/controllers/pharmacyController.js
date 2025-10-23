// HealthPath/backend/controllers/pharmacyController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PharmacyUser = require('../models/PharmacyUser'); // User Auth Model
const Medicine = require('../models/Medicine');         // NEW: Inventory Model
const Order = require('../models/Order');               // NEW: Order Model
const BulkOrder = require('../models/BulkOrder');       // NEW: Hospital Bulk Orders
const { pharmacyAddValidation } = require('../validations/pharmacyValidation');

// Shared function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'pharmacy' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// ==========================================
// 1. AUTHENTICATION (Login & Register)
// ==========================================

// POST /pharmacy/register
exports.registerPharmacy = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // Check if pharmacy already exists
    const emailExists = await PharmacyUser.findOne({ email });
    if (emailExists) return res.status(400).send({ message: 'Email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new pharmacy user
    const pharmacy = new PharmacyUser({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
    });
    
    const savedPharmacy = await pharmacy.save();
    
    // Generate Token and respond
    const token = generateToken(savedPharmacy._id);
    res.header('auth-token', token).send({
      token,
      pharmacy: { id: savedPharmacy._id, name: savedPharmacy.name, email: savedPharmacy.email, address: savedPharmacy.address },
    });

  } catch (err) {
    console.error("Pharmacy Registration error:", err);
    res.status(500).send({ message: 'Server error during registration.' });
  }
};

// POST /pharmacy/login
exports.loginPharmacy = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email exists
    const pharmacy = await PharmacyUser.findOne({ email });
    if (!pharmacy) return res.status(400).send({ message: 'Invalid Credentials.' });

    // Check password
    const validPass = await bcrypt.compare(password, pharmacy.password);
    if (!validPass) return res.status(400).send({ message: 'Invalid Credentials.' });

    // Generate Token and respond
    const token = generateToken(pharmacy._id);
    res.header('auth-token', token).send({
      token,
      pharmacy: { id: pharmacy._id, name: pharmacy.name, email: pharmacy.email, address: pharmacy.address },
    });
  } catch (err) {
    console.error("Pharmacy Login error:", err);
    res.status(500).send({ message: 'Server error during login.' });
  }
};

// ==========================================
// 2. INVENTORY MANAGEMENT (Seller Dashboard)
// ==========================================

// GET /pharmacy/inventory
// Get only the medicines belonging to the logged-in pharmacy
exports.getPharmacyInventory = async (req, res) => {
    try {
        const medicines = await Medicine.find({ pharmacyId: req.user.id });
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching inventory.' });
    }
};

// POST /pharmacy/add
exports.addMedicine = async (req, res) => {
    // Validate incoming data
    const { error } = pharmacyAddValidation.validate(req.body);
    if (error) {
        return res.status(400).send({ 
            message: error.details[0].message || 'Validation error',
            details: error.details
        });
    }

    try {
        const pharmacyUser = await PharmacyUser.findById(req.user.id);
        if (!pharmacyUser) return res.status(404).send({ message: 'Pharmacy user not found.' });

        // Create new Medicine linked to this Pharmacy ID
        // Note: Mapping 'medicineName' from your validation to 'name' in our new model
        const newMedicine = new Medicine({
            pharmacyId: req.user.id, 
            name: req.body.medicineName || req.body.name, 
            price: req.body.price,
            stock: req.body.stock,
            expiryDate: req.body.expiryDate,
            category: req.body.category || 'General',
            description: req.body.description || ''
        });

        const savedMedicine = await newMedicine.save();
        res.status(201).send({ message: 'Medicine added successfully', medicine: savedMedicine });
    } catch (err) {
        console.error('Error adding medicine:', err);
        res.status(500).send({ message: 'Server error adding medicine.', error: err.message });
    }
};

// PUT /pharmacy/update/:id
exports.updateMedicine = async (req, res) => {
    try {
        // Find medicine and ensure it belongs to the logged-in pharmacy
        const medicine = await Medicine.findOne({ _id: req.params.id, pharmacyId: req.user.id });
        
        if (!medicine) {
            return res.status(404).send({ message: 'Medicine not found or unauthorized.' });
        }

        // Update fields
        const updateData = {
            name: req.body.medicineName || req.body.name,
            price: req.body.price,
            stock: req.body.stock,
            expiryDate: req.body.expiryDate,
            category: req.body.category,
            description: req.body.description
        };

        const updatedMed = await Medicine.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { new: true }
        );
        res.send({ message: 'Medicine updated successfully', medicine: updatedMed });
    } catch (err) {
        res.status(500).send({ message: 'Server error updating medicine.' });
    }
};

// DELETE /pharmacy/delete/:id
exports.deleteMedicine = async (req, res) => {
    try {
        const deletedMed = await Medicine.findOneAndDelete({ 
            _id: req.params.id, 
            pharmacyId: req.user.id // Ensure ownership
        });

        if (!deletedMed) return res.status(404).send({ message: 'Medicine not found or unauthorized.' });

        res.send({ message: 'Medicine deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Server error deleting medicine.' });
    }
};

// ==========================================
// 3. ORDER MANAGEMENT (Click & Collect)
// ==========================================

// GET /pharmacy/orders
// Get all incoming orders for this pharmacy
exports.getPharmacyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ pharmacyId: req.user.id })
            .populate('patientId', 'name email') // Show who ordered it
            .sort({ orderDate: -1 }); // Newest first
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /pharmacy/orders/:id/status
// Update order status (e.g., Mark as Ready)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body; // Expecting { "status": "Ready" }
        
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, pharmacyId: req.user.id }, // Ensure ownership
            { status },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: "Order not found" });

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ==========================================
// 4. BULK ORDER MANAGEMENT (Hospital Orders)
// ==========================================

// GET /pharmacy/bulk-orders
// Get all bulk orders from hospitals for this pharmacy
exports.getBulkOrders = async (req, res) => {
    try {
        const bulkOrders = await BulkOrder.find({ pharmacyId: req.user.id })
            .sort({ orderDate: -1 });
        res.json(bulkOrders);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching bulk orders.' });
    }
};

// PUT /pharmacy/bulk-orders/:id/status
// Update bulk order status
exports.updateBulkOrderStatus = async (req, res) => {
    try {
        const { status, deliveryNotes, estimatedDelivery } = req.body;
        
        const updateData = { status };
        
        // Add timestamps based on status
        if (status === 'Confirmed') updateData.confirmedAt = new Date();
        if (status === 'Dispatched') updateData.dispatchedAt = new Date();
        if (status === 'Delivered') updateData.deliveredAt = new Date();
        if (deliveryNotes) updateData.deliveryNotes = deliveryNotes;
        if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;
        
        const order = await BulkOrder.findOneAndUpdate(
            { _id: req.params.id, pharmacyId: req.user.id },
            updateData,
            { new: true }
        );

        if (!order) return res.status(404).json({ message: "Bulk order not found" });

        // Update medicine stock when order is confirmed
        if (status === 'Confirmed') {
            for (const item of order.items) {
                await Medicine.findByIdAndUpdate(item.medicineId, {
                    $inc: { stock: -item.quantity }
                });
            }
        }

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ==========================================
// 5. ANALYTICS & DASHBOARD DATA
// ==========================================

// GET /pharmacy/analytics
// Get pharmacy analytics and statistics
exports.getPharmacyAnalytics = async (req, res) => {
    try {
        const pharmacyId = req.user.id;
        
        // Get all orders
        const orders = await Order.find({ pharmacyId });
        const bulkOrders = await BulkOrder.find({ pharmacyId });
        const medicines = await Medicine.find({ pharmacyId });
        
        // Calculate stats
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        
        // Patient order stats
        const totalPatientOrders = orders.length;
        const pendingPatientOrders = orders.filter(o => o.status === 'Pending').length;
        const completedPatientOrders = orders.filter(o => o.status === 'Completed').length;
        const patientRevenue = orders.filter(o => o.status === 'Completed')
            .reduce((sum, o) => sum + (o.price * (o.quantity || 1)), 0);
        
        // Bulk order stats
        const totalBulkOrders = bulkOrders.length;
        const pendingBulkOrders = bulkOrders.filter(o => o.status === 'Pending').length;
        const bulkRevenue = bulkOrders.filter(o => o.status === 'Delivered')
            .reduce((sum, o) => sum + o.totalAmount, 0);
        
        // Inventory stats
        const totalMedicines = medicines.length;
        const lowStockItems = medicines.filter(m => m.stock <= 10).length;
        const outOfStockItems = medicines.filter(m => m.stock === 0).length;
        const expiringItems = medicines.filter(m => {
            const expiry = new Date(m.expiryDate);
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 30 && diffDays > 0;
        }).length;
        const totalInventoryValue = medicines.reduce((sum, m) => sum + (m.stock * m.price), 0);
        
        // Monthly comparison
        const thisMonthOrders = orders.filter(o => new Date(o.orderDate) >= thisMonth).length;
        const lastMonthOrders = orders.filter(o => {
            const date = new Date(o.orderDate);
            return date >= lastMonth && date < thisMonth;
        }).length;
        
        // Recent orders (last 5)
        const recentOrders = await Order.find({ pharmacyId })
            .populate('patientId', 'name')
            .sort({ orderDate: -1 })
            .limit(5);
        
        // Top selling medicines
        const medicineSales = {};
        orders.forEach(o => {
            medicineSales[o.medicineName] = (medicineSales[o.medicineName] || 0) + (o.quantity || 1);
        });
        const topSelling = Object.entries(medicineSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        
        res.json({
            patientOrders: {
                total: totalPatientOrders,
                pending: pendingPatientOrders,
                completed: completedPatientOrders,
                revenue: patientRevenue
            },
            bulkOrders: {
                total: totalBulkOrders,
                pending: pendingBulkOrders,
                revenue: bulkRevenue
            },
            inventory: {
                total: totalMedicines,
                lowStock: lowStockItems,
                outOfStock: outOfStockItems,
                expiringSoon: expiringItems,
                totalValue: totalInventoryValue
            },
            growth: {
                thisMonth: thisMonthOrders,
                lastMonth: lastMonthOrders,
                percentage: lastMonthOrders > 0 
                    ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
                    : 100
            },
            recentOrders,
            topSelling,
            totalRevenue: patientRevenue + bulkRevenue
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ message: 'Server error fetching analytics.' });
    }
};

// GET /pharmacy/list-public
// Public endpoint for hospitals to browse pharmacies
exports.getPublicPharmacyList = async (req, res) => {
    try {
        const pharmacies = await PharmacyUser.find({}, 'name email address phone')
            .sort({ name: 1 });
        res.json(pharmacies);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching pharmacies.' });
    }
};

// GET /pharmacy/:id/medicines
// Get medicines of a specific pharmacy (for hospital ordering)
exports.getPharmacyMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find({ 
            pharmacyId: req.params.id,
            stock: { $gt: 0 } // Only show in-stock items
        }).select('name price stock category expiryDate');
        
        const pharmacy = await PharmacyUser.findById(req.params.id, 'name address phone');
        
        res.json({ pharmacy, medicines });
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching pharmacy medicines.' });
    }
};
