import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, LogOut, MapPin, Phone, Bed, AlertCircle, Save, Plus, Trash2, Edit2, Activity, DollarSign, Settings, X, Check, Loader2, Droplet, Heart, Pill, ShoppingCart, Package, Store, Search, Minus, Eye, Clock, TrendingUp, Filter, Sparkles, FileText as FileIcon, BarChart3, Copy } from 'lucide-react';
import api, { generateDischargeSummary, forecastCapacity, estimateTreatmentCost } from '../services/api';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showPricingForm, setShowPricingForm] = useState(false);
    const [pricingForm, setPricingForm] = useState({
        serviceType: 'Test',
        name: '',
        description: '',
        price: '',
        category: ''
    });
    
    // Tab State
    const [activeTab, setActiveTab] = useState('overview');
    
    // Emergency Services State
    const [emergencyData, setEmergencyData] = useState(null);
    const [loadingEmergency, setLoadingEmergency] = useState(false);
    const [editingBlood, setEditingBlood] = useState(false);
    const [editingBeds, setEditingBeds] = useState(false);
    const [bloodStock, setBloodStock] = useState({
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
    });
    const [bedAvailability, setBedAvailability] = useState({
        general: 0, icu: 0, pediatric: 0, maternity: 0, emergency: 0, 
        surgical: 0, cardiac: 0, orthopedic: 0, isolation: 0
    });
    
    // Pharmacy Ordering State
    const [pharmacies, setPharmacies] = useState([]);
    const [loadingPharmacies, setLoadingPharmacies] = useState(false);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
    const [loadingMedicines, setLoadingMedicines] = useState(false);
    const [cart, setCart] = useState([]);
    const [bulkOrders, setBulkOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderPriority, setOrderPriority] = useState('Normal');
    const [orderNotes, setOrderNotes] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [pharmacySearch, setPharmacySearch] = useState('');
    const [medicineSearch, setMedicineSearch] = useState('');

    // AI Tools State
    const [aiLoading, setAiLoading] = useState(false);
    const [dischargeForm, setDischargeForm] = useState({ patientName: '', age: '', gender: '', diagnosis: '', treatmentSummary: '', stayDuration: '' });
    const [dischargeResult, setDischargeResult] = useState(null);
    const [capacityResult, setCapacityResult] = useState(null);
    const [costForm, setCostForm] = useState({ treatmentType: '', diagnosis: '' });
    const [costResult, setCostResult] = useState(null);

    useEffect(() => {
        fetchHospitalProfile();
        fetchEmergencyServices();
    }, []);
    
    useEffect(() => {
        if (activeTab === 'pharmacy') {
            fetchPharmacies();
            fetchBulkOrders();
        }
    }, [activeTab]);

    const fetchHospitalProfile = async () => {
        try {
            const response = await api.get('/hospital-auth/profile');
            setHospital(response.data);
            setFormData(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            localStorage.clear();
            navigate('/hospital/login');
        }
    };

    const fetchEmergencyServices = async () => {
        try {
            setLoadingEmergency(true);
            const response = await api.get('/emergency/hospital/services');
            setEmergencyData(response.data);
            if (response.data.bloodBank?.stocks) {
                const stock = {};
                response.data.bloodBank.stocks.forEach(item => {
                    stock[item.bloodType] = item.units;
                });
                setBloodStock(prev => ({ ...prev, ...stock }));
            }
            if (response.data.bedAvailability) {
                const beds = {};
                response.data.bedAvailability.forEach(item => {
                    beds[item.type.toLowerCase()] = item.available;
                });
                setBedAvailability(prev => ({ ...prev, ...beds }));
            }
        } catch (err) {
            console.error('Failed to fetch emergency services:', err);
        } finally {
            setLoadingEmergency(false);
        }
    };

    // Pharmacy Functions
    const fetchPharmacies = async () => {
        try {
            setLoadingPharmacies(true);
            const response = await api.get('/hospitals/pharmacies');
            setPharmacies(Array.isArray(response.data) ? response.data : response.data.pharmacies || []);
        } catch (err) {
            console.error('Failed to fetch pharmacies:', err);
        } finally {
            setLoadingPharmacies(false);
        }
    };

    const fetchPharmacyMedicines = async (pharmacyId) => {
        try {
            setLoadingMedicines(true);
            const response = await api.get(`/hospitals/pharmacies/${pharmacyId}/medicines`);
            setPharmacyMedicines(response.data.medicines || response.data || []);
        } catch (err) {
            console.error('Failed to fetch medicines:', err);
            setPharmacyMedicines([]);
        } finally {
            setLoadingMedicines(false);
        }
    };

    const fetchBulkOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await api.get('/hospitals/bulk-orders');
            setBulkOrders(Array.isArray(response.data) ? response.data : response.data.orders || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleSelectPharmacy = (pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setCart([]);
        fetchPharmacyMedicines(pharmacy._id);
    };

    const addToCart = (medicine) => {
        const existing = cart.find(item => item.medicineId === medicine._id);
        if (existing) {
            setCart(cart.map(item => 
                item.medicineId === medicine._id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                medicineId: medicine._id,
                name: medicine.name,
                unitPrice: medicine.price,
                quantity: 1,
                maxStock: medicine.stock
            }]);
        }
    };

    const updateCartQuantity = (medicineId, quantity) => {
        if (quantity <= 0) {
            setCart(cart.filter(item => item.medicineId !== medicineId));
        } else {
            setCart(cart.map(item => 
                item.medicineId === medicineId 
                    ? { ...item, quantity: Math.min(quantity, item.maxStock) }
                    : item
            ));
        }
    };

    const removeFromCart = (medicineId) => {
        setCart(cart.filter(item => item.medicineId !== medicineId));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
    };

    const handlePlaceOrder = async () => {
        if (!selectedPharmacy || cart.length === 0) return;
        
        try {
            setSaving(true);
            const orderItems = cart.map(item => ({
                medicineId: item.medicineId,
                medicineName: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }));

            await api.post('/hospitals/bulk-order', {
                pharmacyId: selectedPharmacy._id,
                items: orderItems,
                priority: orderPriority,
                notes: orderNotes
            });

            setMessage({ text: 'Bulk order placed successfully!', type: 'success' });
            setCart([]);
            setOrderPriority('Normal');
            setOrderNotes('');
            setSelectedPharmacy(null);
            setPharmacyMedicines([]);
            fetchBulkOrders();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to place order', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            setSaving(true);
            await api.put(`/hospitals/bulk-orders/${orderId}/cancel`);
            setMessage({ text: 'Order cancelled successfully!', type: 'success' });
            fetchBulkOrders();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to cancel order', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-amber-100 text-amber-700',
            'Confirmed': 'bg-blue-100 text-blue-700',
            'Processing': 'bg-teal-100 text-teal-700',
            'Dispatched': 'bg-sky-100 text-sky-700',
            'Delivered': 'bg-emerald-100 text-emerald-700',
            'Cancelled': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'Normal': 'bg-gray-100 text-gray-700',
            'Urgent': 'bg-orange-100 text-orange-700',
            'Emergency': 'bg-red-100 text-red-700'
        };
        return colors[priority] || 'bg-gray-100 text-gray-700';
    };

    const handleUpdateBloodStock = async () => {
        try {
            setSaving(true);
            const stocks = Object.entries(bloodStock).map(([type, units]) => ({
                bloodType: type,
                units: parseInt(units) || 0
            }));
            
            await api.put('/emergency/hospital/blood-stock', 
                { stocks, available: stocks.some(s => s.units > 0) }
            );
            
            setEditingBlood(false);
            setMessage({ text: 'Blood stock updated successfully!', type: 'success' });
            fetchEmergencyServices();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to update blood stock', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateBeds = async () => {
        try {
            setSaving(true);
            const bedAvailabilityData = Object.entries(bedAvailability).map(([type, available]) => ({
                type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
                available: parseInt(available) || 0,
                total: parseInt(available) || 0
            }));
            
            await api.put('/emergency/hospital/beds', 
                { bedAvailability: bedAvailabilityData }
            );
            
            setEditingBeds(false);
            setMessage({ text: 'Bed availability updated successfully!', type: 'success' });
            fetchEmergencyServices();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to update bed availability', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updateData = {
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                beds: formData.beds,
                emergencyServices: formData.emergencyServices,
                latitude: formData.location?.coordinates?.[1] || 0,
                longitude: formData.location?.coordinates?.[0] || 0
            };

            const response = await api.put('/hospital-auth/update', updateData);

            setHospital(response.data.hospital);
            setFormData(response.data.hospital);
            setEditing(false);
            setMessage({ text: 'Hospital details updated successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to update hospital details', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleAddPricing = async () => {
        try {
            if (!pricingForm.name || !pricingForm.price) {
                setMessage({ text: 'Please fill in service name and price', type: 'error' });
                return;
            }

            const response = await api.post('/hospital-auth/pricing', pricingForm);

            setHospital(prev => ({ ...prev, pricing: response.data.pricing }));
            setPricingForm({
                serviceType: 'Test',
                name: '',
                description: '',
                price: '',
                category: ''
            });
            setShowPricingForm(false);
            setMessage({ text: 'Pricing added successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to add pricing', type: 'error' });
        }
    };

    const handleDeletePricing = async (pricingId) => {
        try {
            const response = await api.delete(`/hospital-auth/pricing/${pricingId}`);

            setHospital(prev => ({ ...prev, pricing: response.data.pricing }));
            setMessage({ text: 'Pricing deleted successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to delete pricing', type: 'error' });
        }
    };

    // AI Handlers
    const handleGenerateDischarge = async () => {
        if (!dischargeForm.patientName || !dischargeForm.diagnosis) return;
        setAiLoading(true);
        try {
            const res = await generateDischargeSummary(dischargeForm);
            setDischargeResult(typeof res.data.dischargeSummary === 'string' ? res.data.dischargeSummary : JSON.stringify(res.data.dischargeSummary, null, 2));
        } catch { setDischargeResult('Failed to generate discharge summary.'); }
        finally { setAiLoading(false); }
    };

    const handleForecastCapacity = async () => {
        setAiLoading(true);
        try {
            const bedData = Object.entries(bedAvailability).map(([type, avail]) => ({ type, available: avail }));
            const totalBeds = bedData.reduce((sum, b) => sum + (b.available || 0), 0);
            const res = await forecastCapacity({ currentOccupancy: Math.round(totalBeds * 0.7), totalBeds, emergencyAdmissions: 'Unknown', seasonalTrend: 'Normal' });
            setCapacityResult(typeof res.data.forecast === 'string' ? res.data.forecast : JSON.stringify(res.data.forecast, null, 2));
        } catch { setCapacityResult('Failed to forecast capacity.'); }
        finally { setAiLoading(false); }
    };

    const handleEstimateCost = async () => {
        if (!costForm.treatmentType) return;
        setAiLoading(true);
        try {
            const res = await estimateTreatmentCost({ treatment: costForm.treatmentType, location: hospital?.address || 'Metro city, India', insuranceType: costForm.diagnosis || 'No insurance' });
            setCostResult(typeof res.data.estimate === 'string' ? res.data.estimate : JSON.stringify(res.data.estimate, null, 2));
        } catch { setCostResult('Failed to estimate cost.'); }
        finally { setAiLoading(false); }
    };

    if (loading && !hospital) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50/30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-rose-600 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50/30 p-4 md:p-8">
            {/* Decorative Elements */}
            <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl -z-10"></div>
            <div className="fixed bottom-0 left-0 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white p-8 rounded-3xl shadow-xl shadow-rose-500/20 mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{hospital?.name || 'Hospital Control Panel'}</h1>
                                <p className="text-rose-100 flex items-center gap-2 mt-1">
                                    <MapPin className="w-4 h-4" />
                                    {hospital?.address || 'Location not set'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/" className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-medium">
                                Home
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 rounded-xl hover:bg-rose-50 transition-all font-semibold shadow-lg"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Message Toast */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
                        message.type === 'success' 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                        {message.type === 'success' ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        {message.text}
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-rose-100 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center">
                                <Bed className="w-7 h-7 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Beds</p>
                                <p className="text-3xl font-bold text-gray-900">{hospital?.beds || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
                                <Activity className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Emergency</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {hospital?.emergencyServices ? (
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <Check className="w-5 h-5" /> Available
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Not Available</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-cyan-100 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-2xl flex items-center justify-center">
                                <DollarSign className="w-7 h-7 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Services Listed</p>
                                <p className="text-3xl font-bold text-gray-900">{hospital?.pricing?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-100 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                                <Package className="w-7 h-7 text-teal-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Bulk Orders</p>
                                <p className="text-3xl font-bold text-gray-900">{bulkOrders.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8">
                    <div className="flex gap-2">
                        {[
                            { id: 'overview', label: 'Hospital Overview', icon: Building2 },
                            { id: 'pharmacy', label: 'Order Medicines', icon: Pill },
                            { id: 'emergency', label: 'Emergency Services', icon: Heart },
                            { id: 'ai-tools', label: 'AI Tools', icon: Sparkles }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Main Card - Hospital Details */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Hospital Details</h2>
                                </div>
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
                                        editing 
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                            : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl'
                                    }`}
                                >
                                    {editing ? (
                                        <><X className="w-4 h-4" /> Cancel</>
                                    ) : (
                                        <><Edit2 className="w-4 h-4" /> Edit Details</>
                                    )}
                                </button>
                            </div>

                            {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all outline-none"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email (Read-only)</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                disabled
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-500"
                            />
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all outline-none"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all outline-none"
                            />
                        </div>

                        {/* Beds */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Beds</label>
                            <input
                                type="number"
                                name="beds"
                                value={formData.beds || 0}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all outline-none"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                            <input
                                type="number"
                                name="latitude"
                                value={formData.location?.coordinates?.[1] || 0}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    location: {
                                        type: 'Point',
                                        ...prev.location,
                                        coordinates: [prev.location?.coordinates?.[0] || 0, parseFloat(e.target.value)]
                                    }
                                }))}
                                disabled={!editing}
                                step="0.0001"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                            <input
                                type="number"
                                name="longitude"
                                value={formData.location?.coordinates?.[0] || 0}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    location: {
                                        type: 'Point',
                                        ...prev.location,
                                        coordinates: [parseFloat(e.target.value), prev.location?.coordinates?.[1] || 0]
                                    }
                                }))}
                                disabled={!editing}
                                step="0.0001"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all outline-none"
                            />
                        </div>

                        {/* Emergency Services */}
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="emergencyServices"
                                    checked={formData.emergencyServices || false}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    className="w-5 h-5 text-rose-600 rounded-lg focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed"
                                />
                                <span className="text-gray-700 font-medium">Emergency Services Available</span>
                            </label>
                        </div>
                    </div>

                    {/* Save Button */}
                    {editing && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="mt-8 w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-5 h-5" /> Save Changes</>
                            )}
                        </button>
                    )}

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-rose-800">
                            Your hospital details are displayed on the patient Route Finder map. Make sure all information is accurate for patients to find you.
                        </div>
                    </div>
                </div>

                {/* Pricing Catalog Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-cyan-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Services & Pricing</h2>
                        </div>
                        <button
                            onClick={() => setShowPricingForm(!showPricingForm)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
                        >
                            {showPricingForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showPricingForm ? 'Cancel' : 'Add Service'}
                        </button>
                    </div>

                    {/* Add Pricing Form */}
                    {showPricingForm && (
                        <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-6 rounded-2xl mb-8 border border-cyan-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Add New Service</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                                    <select
                                        name="serviceType"
                                        value={pricingForm.serviceType}
                                        onChange={(e) => setPricingForm(prev => ({ ...prev, serviceType: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none bg-white"
                                    >
                                        <option value="Disease Treatment">Disease Treatment</option>
                                        <option value="Test">Test</option>
                                        <option value="Consultation">Consultation</option>
                                        <option value="Surgery">Surgery</option>
                                        <option value="Admission">Admission</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ( )</label>
                                    <input
                                        type="number"
                                        value={pricingForm.price}
                                        onChange={(e) => setPricingForm(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="Enter price"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                                <input
                                    type="text"
                                    value={pricingForm.name}
                                    onChange={(e) => setPricingForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Blood Test, X-Ray, Consultation"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                                <textarea
                                    value={pricingForm.description}
                                    onChange={(e) => setPricingForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Add details about this service"
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={handleAddPricing}
                                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-xl transition-all"
                            >
                                Add Service
                            </button>
                        </div>
                    )}

                    {/* Pricing List */}
                    <div className="space-y-4">
                        {hospital?.pricing && hospital.pricing.length > 0 ? (
                            hospital.pricing.map((item, idx) => (
                                <div key={idx} className="flex items-start justify-between p-5 bg-gradient-to-r from-gray-50 to-cyan-50/30 rounded-2xl border border-gray-100 hover:shadow-md hover:border-cyan-100 transition-all duration-300 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs rounded-full font-semibold">
                                                {item.serviceType}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                                        {item.description && (
                                            <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 ml-4">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-emerald-600"> {item.price}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePricing(item._id)}
                                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">No services added yet</p>
                                <p className="text-gray-400 text-sm mt-1">Click "Add Service" to get started</p>
                            </div>
                        )}
                    </div>
                </div>
                    </>
                )}

                {/* Pharmacy Tab - Order Medicines */}
                {activeTab === 'pharmacy' && (
                    <div className="space-y-8">
                        {/* Pharmacy Selection */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                                        <Store className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Available Pharmacies</h2>
                                        <p className="text-sm text-gray-500">Select a pharmacy to order medicines</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search pharmacies..."
                                        value={pharmacySearch}
                                        onChange={(e) => setPharmacySearch(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-teal-500 outline-none w-64"
                                    />
                                </div>
                            </div>

                            {loadingPharmacies ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-500">Loading pharmacies...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pharmacies
                                        .filter(p => p.pharmacyName?.toLowerCase().includes(pharmacySearch.toLowerCase()) || 
                                                    p.address?.toLowerCase().includes(pharmacySearch.toLowerCase()))
                                        .map(pharmacy => (
                                            <div 
                                                key={pharmacy._id}
                                                onClick={() => handleSelectPharmacy(pharmacy)}
                                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                                                    selectedPharmacy?._id === pharmacy._id 
                                                        ? 'border-teal-500 bg-teal-50 shadow-lg' 
                                                        : 'border-gray-100 hover:border-teal-200 hover:shadow-md'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Store className="w-6 h-6 text-teal-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 truncate">{pharmacy.pharmacyName}</h3>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                                            <span className="truncate">{pharmacy.address || 'Address not set'}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                            <Phone className="w-4 h-4 flex-shrink-0" />
                                                            {pharmacy.phone || 'Phone not set'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedPharmacy?._id === pharmacy._id && (
                                                    <div className="mt-3 pt-3 border-t border-teal-200">
                                                        <span className="text-sm font-semibold text-teal-600 flex items-center gap-1">
                                                            <Check className="w-4 h-4" /> Selected
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    {pharmacies.length === 0 && (
                                        <div className="col-span-full text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Store className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No pharmacies available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Medicine Selection & Cart */}
                        {selectedPharmacy && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Medicines List */}
                                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                                <Pill className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Available Medicines</h2>
                                                <p className="text-sm text-gray-500">From {selectedPharmacy.pharmacyName}</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search medicines..."
                                                value={medicineSearch}
                                                onChange={(e) => setMedicineSearch(e.target.value)}
                                                className="pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none w-56"
                                            />
                                        </div>
                                    </div>

                                    {loadingMedicines ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                                            <p className="text-gray-500">Loading medicines...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                            {pharmacyMedicines
                                                .filter(m => m.name?.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                                                            m.manufacturer?.toLowerCase().includes(medicineSearch.toLowerCase()))
                                                .map(medicine => {
                                                    const inCart = cart.find(item => item.medicineId === medicine._id);
                                                    return (
                                                        <div key={medicine._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-emerald-50/50 transition-all group">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900">{medicine.name}</h4>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-sm text-gray-500">{medicine.manufacturer}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                        medicine.stock > 50 ? 'bg-emerald-100 text-emerald-700' :
                                                                        medicine.stock > 10 ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                        Stock: {medicine.stock}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-lg font-bold text-emerald-600"> {medicine.price}</span>
                                                                {inCart ? (
                                                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-emerald-200 p-1">
                                                                        <button 
                                                                            onClick={() => updateCartQuantity(medicine._id, inCart.quantity - 1)}
                                                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </button>
                                                                        <span className="w-8 text-center font-bold">{inCart.quantity}</span>
                                                                        <button 
                                                                            onClick={() => updateCartQuantity(medicine._id, inCart.quantity + 1)}
                                                                            disabled={inCart.quantity >= medicine.stock}
                                                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => addToCart(medicine)}
                                                                        disabled={medicine.stock === 0}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                        Add
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            {pharmacyMedicines.length === 0 && (
                                                <div className="text-center py-12">
                                                    <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500">No medicines available from this pharmacy</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Cart & Order */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-fit sticky top-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Order Cart</h2>
                                            <p className="text-sm text-gray-500">{cart.length} items</p>
                                        </div>
                                    </div>

                                    {cart.length === 0 ? (
                                        <div className="text-center py-8">
                                            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 text-sm">Your cart is empty</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto">
                                                {cart.map(item => (
                                                    <div key={item.medicineId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                                                            <p className="text-xs text-gray-500"> {item.unitPrice} Ã— {item.quantity}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900"> {item.unitPrice * item.quantity}</span>
                                                            <button
                                                                onClick={() => removeFromCart(item.medicineId)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Order Options */}
                                            <div className="space-y-4 mb-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                                    <select
                                                        value={orderPriority}
                                                        onChange={(e) => setOrderPriority(e.target.value)}
                                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 outline-none"
                                                    >
                                                        <option value="Normal">Normal</option>
                                                        <option value="Urgent">Urgent</option>
                                                        <option value="Emergency">Emergency</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                                    <textarea
                                                        value={orderNotes}
                                                        onChange={(e) => setOrderNotes(e.target.value)}
                                                        placeholder="Any special instructions..."
                                                        rows="2"
                                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 outline-none resize-none text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Total & Place Order */}
                                            <div className="border-t border-gray-200 pt-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-gray-600 font-medium">Total Amount</span>
                                                    <span className="text-2xl font-bold text-gray-900"> {calculateTotal()}</span>
                                                </div>
                                                <button
                                                    onClick={handlePlaceOrder}
                                                    disabled={saving}
                                                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {saving ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Package className="w-5 h-5" />
                                                            Place Bulk Order
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bulk Orders History */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                                    <Package className="w-5 h-5 text-sky-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                                    <p className="text-sm text-gray-500">Track your bulk medicine orders</p>
                                </div>
                            </div>

                            {loadingOrders ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-500">Loading orders...</p>
                                </div>
                            ) : bulkOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No orders yet</p>
                                    <p className="text-gray-400 text-sm">Select a pharmacy and add medicines to place your first order</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bulkOrders.map(order => (
                                        <div key={order._id} className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Store className="w-6 h-6 text-sky-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">
                                                            {order.pharmacyId?.pharmacyName || 'Pharmacy'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                            <Clock className="w-4 h-4" />
                                                            {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(order.priority)}`}>
                                                        {order.priority}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                    <span className="text-xl font-bold text-gray-900"> {order.totalAmount}</span>
                                                </div>
                                            </div>

                                            {/* Order Items Preview */}
                                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Items ({order.items?.length})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.items?.slice(0, 4).map((item, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-white rounded-lg text-sm text-gray-600 border">
                                                            {item.medicineId?.name || 'Medicine'} Ã— {item.quantity}
                                                        </span>
                                                    ))}
                                                    {order.items?.length > 4 && (
                                                        <span className="px-3 py-1 bg-gray-200 rounded-lg text-sm text-gray-600">
                                                            +{order.items.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">
                                                    Invoice: <span className="font-mono font-medium">{order.invoiceNumber}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                                                        className="px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-xl font-medium text-sm transition-all flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Details
                                                    </button>
                                                    {order.status === 'Pending' && (
                                                        <button
                                                            onClick={() => handleCancelOrder(order._id)}
                                                            disabled={saving}
                                                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Emergency Tab */}
                {activeTab === 'emergency' && (
                    <>
                        {/* Emergency Services Management Section */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Emergency Services</h2>
                                    <p className="text-sm text-gray-500">Manage blood bank, bed availability & equipment</p>
                                </div>
                            </div>

                            {loadingEmergency ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-500">Loading emergency services...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Blood Bank Section */}
                                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-2xl border border-red-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <Droplet className="w-6 h-6 text-red-600" />
                                                <h3 className="text-lg font-bold text-gray-900">Blood Bank Inventory</h3>
                                            </div>
                                            <button
                                                onClick={() => editingBlood ? handleUpdateBloodStock() : setEditingBlood(true)}
                                                disabled={saving}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                                                    editingBlood 
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                                        : 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                                }`}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBlood ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                                {editingBlood ? 'Save Stock' : 'Update Stock'}
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Object.entries(bloodStock).map(([type, units]) => (
                                                <div key={type} className="bg-white p-4 rounded-xl border border-red-100 hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-2xl font-black text-red-600">{type}</span>
                                                        <Droplet className={`w-5 h-5 ${units > 0 ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                                                    </div>
                                                    {editingBlood ? (
                                                        <input
                                                            type="number"
                                                            value={units}
                                                            onChange={(e) => setBloodStock(prev => ({ ...prev, [type]: e.target.value }))}
                                                            min="0"
                                                            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-500 outline-none text-center font-bold"
                                                        />
                                                    ) : (
                                                        <p className="text-center">
                                                            <span className="text-3xl font-black text-gray-900">{units}</span>
                                                            <span className="text-gray-500 text-sm ml-1">units</span>
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {editingBlood && (
                                            <button
                                                onClick={() => setEditingBlood(false)}
                                                className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>

                                    {/* Bed Availability Section */}
                                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl border border-blue-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <Bed className="w-6 h-6 text-blue-600" />
                                                <h3 className="text-lg font-bold text-gray-900">Bed Availability</h3>
                                            </div>
                                            <button
                                                onClick={() => editingBeds ? handleUpdateBeds() : setEditingBeds(true)}
                                                disabled={saving}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                                                    editingBeds 
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                                        : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                }`}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBeds ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                                {editingBeds ? 'Save Beds' : 'Update Beds'}
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {Object.entries(bedAvailability).map(([type, available]) => (
                                                <div key={type} className="bg-white p-4 rounded-xl border border-blue-100 hover:shadow-md transition-all">
                                                    <p className="text-xs font-bold text-gray-500 capitalize tracking-wide mb-2">{type.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                    {editingBeds ? (
                                                        <input
                                                            type="number"
                                                            value={available}
                                                            onChange={(e) => setBedAvailability(prev => ({ ...prev, [type]: e.target.value }))}
                                                            min="0"
                                                            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none text-center font-bold"
                                                        />
                                                    ) : (
                                                        <p className="flex items-center justify-between">
                                                            <span className="text-2xl font-black text-gray-900">{available}</span>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                available > 5 ? 'bg-emerald-100 text-emerald-700' : 
                                                                available > 0 ? 'bg-amber-100 text-amber-700' : 
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {available > 5 ? 'Available' : available > 0 ? 'Low' : 'Full'}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {editingBeds && (
                                            <button
                                                onClick={() => setEditingBeds(false)}
                                                className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>

                                    {/* Info Box */}
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <strong>Important:</strong> Keep your blood bank and bed availability updated regularly. Patients in emergency situations rely on this data to find the nearest hospital with available resources.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* === AI TOOLS TAB === */}
                {activeTab === 'ai-tools' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Sparkles className="w-6 h-6 text-rose-500" /> Smart Hospital Toolkit</h2>
                            <p className="text-gray-500">Assistive tools for capacity planning, summaries, and cost estimates</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Discharge Summary Generator */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><FileIcon className="w-5 h-5" /></div>
                                        <div><h3 className="font-bold text-sm">Discharge Summary</h3><p className="text-xs text-white/70">Auto-generate patient discharge docs</p></div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" placeholder="Patient Name *" value={dischargeForm.patientName} onChange={e => setDischargeForm({...dischargeForm, patientName: e.target.value})} className="p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200" />
                                        <input type="number" placeholder="Age" value={dischargeForm.age} onChange={e => setDischargeForm({...dischargeForm, age: e.target.value})} className="p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200" />
                                    </div>
                                    <input type="text" placeholder="Diagnosis *" value={dischargeForm.diagnosis} onChange={e => setDischargeForm({...dischargeForm, diagnosis: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200" />
                                    <textarea placeholder="Treatment summary" value={dischargeForm.treatmentSummary} onChange={e => setDischargeForm({...dischargeForm, treatmentSummary: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200 h-16 resize-none" />
                                    <input type="text" placeholder="Stay duration (e.g. 5 days)" value={dischargeForm.stayDuration} onChange={e => setDischargeForm({...dischargeForm, stayDuration: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200" />
                                    <button onClick={handleGenerateDischarge} disabled={aiLoading || !dischargeForm.patientName || !dischargeForm.diagnosis} className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                        {aiLoading && !capacityResult && !costResult ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate</>}
                                    </button>
                                    {dischargeResult && (
                                        <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                            {dischargeResult}
                                            <div className="flex gap-2 mt-2"><button onClick={() => navigator.clipboard.writeText(dischargeResult)} className="text-xs bg-white border px-2 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button><button onClick={() => setDischargeResult(null)} className="text-xs text-rose-600 font-medium hover:underline">Clear</button></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Capacity Forecasting */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-4 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5" /></div>
                                        <div><h3 className="font-bold text-sm">Capacity Forecasting</h3><p className="text-xs text-white/70">AI predicts bed & resource demands</p></div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
                                        <p className="text-xs text-gray-600">AI will analyze your current bed availability and predict upcoming demand patterns, helping you plan staffing and resources.</p>
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2"><Bed className="w-4 h-4" /> {Object.values(bedAvailability).reduce((a, b) => a + parseInt(b || 0), 0)} beds currently available</div>
                                    <button onClick={handleForecastCapacity} disabled={aiLoading} className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                        {aiLoading && !dischargeResult && !costResult ? <><Loader2 className="w-4 h-4 animate-spin" /> Forecasting...</> : <><Sparkles className="w-4 h-4" /> Run Forecast</>}
                                    </button>
                                    {capacityResult && (
                                        <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                            {capacityResult}
                                            <div className="flex gap-2 mt-2"><button onClick={() => navigator.clipboard.writeText(capacityResult)} className="text-xs bg-white border px-2 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button><button onClick={() => setCapacityResult(null)} className="text-xs text-sky-600 font-medium hover:underline">Clear</button></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Treatment Cost Estimator */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
                                        <div><h3 className="font-bold text-sm">Cost Estimator</h3><p className="text-xs text-white/70">AI-powered treatment cost estimation</p></div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <select value={costForm.treatmentType} onChange={e => setCostForm({...costForm, treatmentType: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none bg-white">
                                        <option value="">Select treatment type *</option>
                                        <option value="Surgery">Surgery</option>
                                        <option value="ICU Stay">ICU Stay</option>
                                        <option value="General Admission">General Admission</option>
                                        <option value="Diagnostics">Diagnostics</option>
                                        <option value="Chemotherapy">Chemotherapy</option>
                                        <option value="Dialysis">Dialysis</option>
                                        <option value="Maternity">Maternity / Delivery</option>
                                        <option value="Rehabilitation">Rehabilitation</option>
                                    </select>
                                    <input type="text" placeholder="Specific diagnosis or procedure" value={costForm.diagnosis} onChange={e => setCostForm({...costForm, diagnosis: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                                    <button onClick={handleEstimateCost} disabled={aiLoading || !costForm.treatmentType} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                        {aiLoading && !dischargeResult && !capacityResult ? <><Loader2 className="w-4 h-4 animate-spin" /> Estimating...</> : <><Sparkles className="w-4 h-4" /> Get Estimate</>}
                                    </button>
                                    {costResult && (
                                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                            {costResult}
                                            <div className="flex gap-2 mt-2"><button onClick={() => navigator.clipboard.writeText(costResult)} className="text-xs bg-white border px-2 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button><button onClick={() => setCostResult(null)} className="text-xs text-emerald-600 font-medium hover:underline">Clear</button></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {showOrderModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                    <p className="text-sm text-gray-500 font-mono">{selectedOrder.invoiceNumber}</p>
                                </div>
                                <button
                                    onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Status & Priority */}
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                    <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getPriorityColor(selectedOrder.priority)}`}>
                                        {selectedOrder.priority} Priority
                                    </span>
                                </div>

                                {/* Pharmacy Info */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500 mb-1">Pharmacy</p>
                                    <p className="font-bold text-gray-900">{selectedOrder.pharmacyId?.pharmacyName}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.pharmacyId?.address}</p>
                                </div>

                                {/* Items */}
                                <div>
                                    <p className="font-bold text-gray-900 mb-3">Order Items</p>
                                    <div className="space-y-2">
                                        {selectedOrder.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.medicineId?.name || 'Medicine'}</p>
                                                    <p className="text-sm text-gray-500"> {item.unitPrice} Ã— {item.quantity}</p>
                                                </div>
                                                <p className="font-bold text-gray-900"> {item.totalPrice}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedOrder.notes && (
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <p className="text-sm text-amber-800 font-medium mb-1">Notes</p>
                                        <p className="text-amber-900">{selectedOrder.notes}</p>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200">
                                    <span className="text-lg font-bold text-gray-700">Total Amount</span>
                                    <span className="text-2xl font-black text-rose-600"> {selectedOrder.totalAmount}</span>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <p className="font-bold text-gray-900 mb-3">Order Timeline</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Order Placed</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedOrder.updatedAt !== selectedOrder.createdAt && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Last Updated</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(selectedOrder.updatedAt).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalDashboard;

