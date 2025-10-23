// HealthPath/backend/routes/pharmacy.js
const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const auth = require('../middleware/auth'); 

// ===========================
// Authentication Routes
// ===========================
router.post('/register', pharmacyController.registerPharmacy);
router.post('/login', pharmacyController.loginPharmacy);

// ===========================
// Public Routes (For Hospitals to browse)
// ===========================
router.get('/list-public', pharmacyController.getPublicPharmacyList);
router.get('/:id/medicines', auth, pharmacyController.getPharmacyMedicines);

// ===========================
// Inventory Routes (Protected)
// ===========================
// Get only this pharmacy's inventory
router.get('/inventory', auth, pharmacyController.getPharmacyInventory); 

// Add/Update/Delete Medicines
router.post('/add', auth, pharmacyController.addMedicine);
router.put('/update/:id', auth, pharmacyController.updateMedicine);
router.delete('/delete/:id', auth, pharmacyController.deleteMedicine);

// ===========================
// Order Routes (Patient Orders - Click & Collect)
// ===========================
// View incoming orders from patients
router.get('/orders', auth, pharmacyController.getPharmacyOrders);

// Update order status (e.g., Mark as "Ready")
router.put('/orders/:id/status', auth, pharmacyController.updateOrderStatus);

// ===========================
// Bulk Order Routes (Hospital Orders)
// ===========================
// View bulk orders from hospitals
router.get('/bulk-orders', auth, pharmacyController.getBulkOrders);

// Update bulk order status
router.put('/bulk-orders/:id/status', auth, pharmacyController.updateBulkOrderStatus);

// ===========================
// Analytics & Dashboard
// ===========================
router.get('/analytics', auth, pharmacyController.getPharmacyAnalytics);

module.exports = router;
