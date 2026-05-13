import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { suggestDrugAlternatives, getSmartReorderSuggestions } from '../services/api';
import {
    Pill, LogOut, Package, Plus, Edit, Trash2, AlertTriangle,
    Search, X, Save, Loader2, Calendar, DollarSign, RefreshCw,
    ClipboardList, CheckCircle, Clock, MapPin, FileText, User,
    Truck, TrendingUp, TrendingDown, Building2, ShoppingCart,
    BarChart3, Eye, Filter, Bell, ChevronRight, Activity,
    PackageCheck, AlertCircle, Boxes, Receipt, Phone, Mail,
    Sparkles, ArrowRightLeft, RotateCcw, Zap, Copy
} from 'lucide-react';

const PharmacyDashboard = () => {
    const navigate = useNavigate();
    const [pharmacy] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } });

    // Tabs & Data State
    const [activeTab, setActiveTab] = useState('overview');
    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [bulkOrders, setBulkOrders] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
    const [selectedBulkOrder, setSelectedBulkOrder] = useState(null);

    // AI Tools State
    const [aiLoading, setAiLoading] = useState(false);
    const [drugAltForm, setDrugAltForm] = useState({ drugName: '', reason: '' });
    const [drugAltResult, setDrugAltResult] = useState(null);
    const [reorderResult, setReorderResult] = useState(null);

    const [formData, setFormData] = useState({
        medicineName: '',
        stock: '',
        price: '',
        expiryDate: '',
        category: 'General',
        description: ''
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/pharmacy/login');
        } else {
            fetchAllData();
        }
    }, [token]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchMedicines(),
            fetchOrders(),
            fetchBulkOrders(),
            fetchAnalytics()
        ]);
        setLoading(false);
    };

    // --- API FUNCTIONS ---
    const fetchMedicines = async () => {
        try {
            const res = await api.get('/pharmacy/inventory');
            setMedicines(Array.isArray(res.data) ? res.data : res.data.medicines || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/pharmacy/orders');
            setOrders(res.data);
        } catch (err) {
            console.error("Order Fetch Error:", err);
        }
    };

    const fetchBulkOrders = async () => {
        try {
            const res = await api.get('/pharmacy/bulk-orders');
            setBulkOrders(res.data);
        } catch (err) {
            console.error("Bulk Order Fetch Error:", err);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/pharmacy/analytics');
            setAnalytics(res.data);
        } catch (err) {
            console.error("Analytics Fetch Error:", err);
        }
    };

    const addMedicineCall = async (data) => {
        return await api.post('/pharmacy/add', data);
    };

    const updateMedicineCall = async (id, data) => {
        return await api.put(`/pharmacy/update/${id}`, data);
    };

    const deleteMedicineCall = async (id) => {
        return await api.delete(`/pharmacy/delete/${id}`);
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            await api.put(`/pharmacy/orders/${orderId}/status`, { status });
            fetchOrders();
        } catch (err) {
            setError('Failed to update order status');
        }
    };

    const handleUpdateBulkOrderStatus = async (orderId, status, additionalData = {}) => {
        try {
            await api.put(`/pharmacy/bulk-orders/${orderId}/status`, { status, ...additionalData });
            fetchBulkOrders();
            fetchAnalytics();
            setShowBulkOrderModal(false);
        } catch (err) {
            setError('Failed to update bulk order status');
        }
    };

    // --- HANDLERS ---
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleAddClick = () => {
        setFormData({ medicineName: '', stock: '', price: '', expiryDate: '', category: 'General', description: '' });
        setShowAddModal(true);
        setShowEditModal(false);
        setError('');
    };

    const handleEditClick = (medicine) => {
        setSelectedMedicine(medicine);
        setFormData({
            medicineName: medicine.medicineName || medicine.name || '',
            stock: medicine.stock || '',
            price: medicine.price || '',
            expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
            category: medicine.category || 'General',
            description: medicine.description || ''
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (medicine) => {
        setSelectedMedicine(medicine);
        setShowDeleteModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const data = {
            medicineName: formData.medicineName,
            stock: parseInt(formData.stock),
            price: parseFloat(formData.price),
            expiryDate: new Date(formData.expiryDate),
            category: formData.category,
            description: formData.description
        };

        try {
            if (showEditModal && selectedMedicine) {
                await updateMedicineCall(selectedMedicine._id, data);
            } else {
                await addMedicineCall(data);
            }
            await fetchMedicines();
            await fetchAnalytics();
            setShowAddModal(false);
            setShowEditModal(false);
        } catch (err) {
            setError('Failed to save medicine.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedMedicine) return;
        setSubmitting(true);
        try {
            await deleteMedicineCall(selectedMedicine._id);
            await fetchMedicines();
            await fetchAnalytics();
            setShowDeleteModal(false);
        } catch (err) {
            setError('Failed to delete medicine');
        } finally {
            setSubmitting(false);
        }
    };

    // AI Handlers
    const handleDrugAlternatives = async () => {
        if (!drugAltForm.drugName) return;
        setAiLoading(true);
        try {
            const res = await suggestDrugAlternatives({ medicineName: drugAltForm.drugName, reason: drugAltForm.reason || 'general inquiry' });
            setDrugAltResult(typeof res.data.alternatives === 'string' ? res.data.alternatives : JSON.stringify(res.data.alternatives, null, 2));
        } catch (err) {
            setDrugAltResult('Failed to get alternatives. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSmartReorder = async () => {
        setAiLoading(true);
        try {
            const inventoryData = medicines.map(m => ({
                name: m.medicineName || m.name,
                currentStock: m.stock,
                price: m.price,
                expiryDate: m.expiryDate,
                category: m.category
            }));
            const res = await getSmartReorderSuggestions({ inventory: inventoryData });
            setReorderResult(typeof res.data.suggestions === 'string' ? res.data.suggestions : JSON.stringify(res.data.suggestions, null, 2));
        } catch (err) {
            setReorderResult('Failed to get reorder suggestions. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    // Helper functions
    const getExpiryStatus = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { status: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
        if (diffDays <= 30) return { status: 'Expiring', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
        return { status: 'Good', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    };

    const getStockStatus = (stock) => {
        if (stock === 0) return { status: 'Out', color: 'bg-red-100 text-red-700', icon: AlertCircle };
        if (stock <= 10) return { status: 'Low', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
        return { status: 'Good', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
    };

    const getBulkOrderStatusColor = (status) => {
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
            'Normal': 'bg-gray-100 text-gray-600',
            'Urgent': 'bg-orange-100 text-orange-700',
            'Emergency': 'bg-red-100 text-red-700 animate-pulse'
        };
        return colors[priority] || 'bg-gray-100 text-gray-600';
    };

    const filteredMedicines = medicines.filter(medicine => {
        const name = medicine.medicineName || medicine.name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredOrders = orders.filter(order => {
        if (filterStatus === 'All') return true;
        return order.status === filterStatus;
    });

    const categories = ['General', 'Painkillers', 'Antibiotics', 'Supplements', 'First Aid', 'Prescription'];

    // Tab configuration
    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'inventory', label: 'Inventory', icon: Package, badge: medicines.filter(m => m.stock <= 10).length },
        { id: 'orders', label: 'Patient Orders', icon: ClipboardList, badge: orders.filter(o => o.status === 'Pending').length },
        { id: 'bulk', label: 'Hospital Orders', icon: Building2, badge: bulkOrders.filter(o => o.status === 'Pending').length },
        { id: 'ai-tools', label: 'AI Tools', icon: Sparkles }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-xl z-40 hidden lg:block">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Pill className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">HealthPath</h1>
                            <p className="text-xs text-gray-500">Pharmacy Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </div>
                            {tab.badge > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                                <User className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm truncate">{pharmacy?.name || 'Pharmacy'}</p>
                                <p className="text-xs text-gray-500 truncate">{pharmacy?.email}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <Pill className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">Pharmacy</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
                {/* Mobile Tabs */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                    activeTab === tab.id ? 'bg-white/20' : 'bg-red-500 text-white'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="lg:ml-64 pt-32 lg:pt-0 p-6 lg:p-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError('')}><X className="w-5 h-5" /></button>
                    </div>
                )}

                {/* === OVERVIEW TAB === */}
                {activeTab === 'overview' && analytics && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Operations Overview</h2>
                                <p className="text-gray-500">Ready for today, {pharmacy?.name}</p>
                            </div>
                            <button onClick={fetchAllData} className="p-2 hover:bg-gray-100 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <span className={`flex items-center gap-1 text-sm font-medium ${analytics.growth.percentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {analytics.growth.percentage >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {Math.abs(analytics.growth.percentage)}%
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm">Total Revenue</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.totalRevenue?.toLocaleString()}</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                                        {analytics.patientOrders.pending} Pending
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm">Patient Orders</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.patientOrders.total}</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-lg text-xs font-bold">
                                        {analytics.bulkOrders.pending} Pending
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm">Hospital Orders</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.bulkOrders.total}</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <Package className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold">
                                        {analytics.inventory.lowStock} Low
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm">Total Products</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.inventory.total}</p>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Orders */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900">Recent Orders</h3>
                                    <button onClick={() => setActiveTab('orders')} className="text-amber-600 text-sm font-medium hover:underline flex items-center gap-1">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {analytics.recentOrders?.slice(0, 5).map(order => (
                                        <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{order.medicineName}</p>
                                                    <p className="text-xs text-gray-500">{order.patientId?.name || 'Patient'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{order.price}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    order.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!analytics.recentOrders || analytics.recentOrders.length === 0) && (
                                        <p className="text-center text-gray-400 py-8">No recent orders</p>
                                    )}
                                </div>
                            </div>

                            {/* Top Selling */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-6">Top Selling Products</h3>
                                <div className="space-y-4">
                                    {analytics.topSelling?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                                index === 0 ? 'bg-amber-100 text-amber-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-50 text-gray-500'
                                            }`}>
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                                                    <div
                                                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min((item.count / (analytics.topSelling[0]?.count || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">{item.count} sold</span>
                                        </div>
                                    ))}
                                    {(!analytics.topSelling || analytics.topSelling.length === 0) && (
                                        <p className="text-center text-gray-400 py-8">No sales data yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Inventory Alerts */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Inventory Alerts</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-red-700">Out of Stock</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">{analytics.inventory.outOfStock}</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        <span className="font-medium text-amber-700">Low Stock</span>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-600">{analytics.inventory.lowStock}</p>
                                </div>
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-5 h-5 text-orange-600" />
                                        <span className="font-medium text-orange-700">Expiring Soon</span>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-600">{analytics.inventory.expiringSoon}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                        <span className="font-medium text-emerald-700">Inventory Value</span>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-600"> {analytics.inventory.totalValue?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === INVENTORY TAB === */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                                <p className="text-gray-500">Manage your medicine stock and catalog</p>
                            </div>
                            <button
                                onClick={handleAddClick}
                                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2 font-bold"
                            >
                                <Plus className="w-5 h-5" /> Add Medicine
                            </button>
                        </div>

                        {/* Search & Filter */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search medicines..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                    />
                                </div>
                                <button onClick={fetchMedicines} className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-gray-500" />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Medicine</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Category</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Stock</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Expiry</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMedicines.map((medicine) => {
                                            const stockStatus = getStockStatus(medicine.stock);
                                            const expiryStatus = getExpiryStatus(medicine.expiryDate);
                                            return (
                                                <tr key={medicine._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                                <Pill className="w-5 h-5 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{medicine.medicineName || medicine.name}</p>
                                                                {medicine.description && (
                                                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{medicine.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                                                            {medicine.category || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${stockStatus.color}`}>
                                                            <stockStatus.icon className="w-4 h-4" />
                                                            {medicine.stock}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-gray-900"> {medicine.price?.toFixed(2)}</td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm border ${expiryStatus.color}`}>
                                                            <span className={`w-2 h-2 rounded-full ${expiryStatus.dot}`}></span>
                                                            {new Date(medicine.expiryDate).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditClick(medicine)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(medicine)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredMedicines.length === 0 && (
                                    <div className="text-center py-12">
                                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No medicines found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* === PATIENT ORDERS TAB === */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Patient Orders</h2>
                                <p className="text-gray-500">Manage medicine reservations from patients</p>
                            </div>
                            <div className="flex gap-2">
                                {['All', 'Pending', 'Ready', 'Completed'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            filterStatus === status
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                    <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No orders found</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                                                    <User className="w-7 h-7 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{order.medicineName}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-4 h-4" />
                                                            {order.patientId?.name || 'Patient'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {new Date(order.orderDate).toLocaleDateString()}
                                                        </span>
                                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            order.fulfillmentType === 'Delivery'
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {order.fulfillmentType === 'Delivery' ? <Truck className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                                                            {order.fulfillmentType || 'Pickup'}
                                                        </span>
                                                    </div>

                                                    {order.fulfillmentType === 'Delivery' && order.deliveryAddress && (
                                                        <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3 max-w-md">
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="w-4 h-4 text-orange-600 mt-0.5" />
                                                                <div>
                                                                    <span className="text-xs font-bold text-orange-700 uppercase">Deliver To:</span>
                                                                    <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {order.prescription && order.prescription !== 'No prescription attached' && (
                                                        <button
                                                            onClick={() => { setSelectedOrder(order); setShowPrescriptionModal(true); }}
                                                            className="mt-3 inline-flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            View Prescription
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 uppercase font-medium">Amount</p>
                                                    <p className="text-2xl font-bold text-emerald-600"> {order.price}</p>
                                                </div>

                                                {order.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleUpdateOrderStatus(order._id, 'Ready')}
                                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                                                    >
                                                        <PackageCheck className="w-5 h-5" />
                                                        Mark Ready
                                                    </button>
                                                )}
                                                {order.status === 'Ready' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold flex items-center gap-2">
                                                            <CheckCircle className="w-5 h-5" />
                                                            Ready
                                                        </span>
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'Completed')}
                                                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
                                                        >
                                                            Complete
                                                        </button>
                                                    </div>
                                                )}
                                                {order.status === 'Completed' && (
                                                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-2">
                                                        <CheckCircle className="w-5 h-5" />
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* === HOSPITAL BULK ORDERS TAB === */}
                {activeTab === 'bulk' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Hospital Bulk Orders</h2>
                                <p className="text-gray-500">Manage bulk medicine orders from hospitals</p>
                            </div>
                            <button onClick={fetchBulkOrders} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" />
                                Refresh
                            </button>
                        </div>

                        {bulkOrders.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No hospital orders yet</p>
                                <p className="text-gray-400 text-sm mt-2">When hospitals place bulk orders, they'll appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bulkOrders.map(order => (
                                    <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl flex items-center justify-center">
                                                        <Building2 className="w-7 h-7 text-teal-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="font-bold text-gray-900 text-lg">{order.hospitalName}</h3>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(order.priority)}`}>
                                                                {order.priority}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Receipt className="w-4 h-4" />
                                                                {order.invoiceNumber}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {new Date(order.orderDate).toLocaleDateString()}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Boxes className="w-4 h-4" />
                                                                {order.items?.length || 0} items
                                                            </span>
                                                        </div>

                                                        {order.hospitalContact && (
                                                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                                                {order.hospitalContact.phone && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Phone className="w-4 h-4" />
                                                                        {order.hospitalContact.phone}
                                                                    </span>
                                                                )}
                                                                {order.hospitalContact.email && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Mail className="w-4 h-4" />
                                                                        {order.hospitalContact.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {order.notes && (
                                                            <div className="mt-3 bg-gray-50 rounded-lg p-3 max-w-md">
                                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes:</p>
                                                                <p className="text-sm text-gray-700">{order.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 uppercase font-medium">Total Amount</p>
                                                        <p className="text-2xl font-bold text-emerald-600"> {order.totalAmount?.toLocaleString()}</p>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <span className={`px-4 py-2 rounded-lg text-sm font-bold text-center ${getBulkOrderStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                        <button
                                                            onClick={() => { setSelectedBulkOrder(order); setShowBulkOrderModal(true); }}
                                                            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-1 justify-center"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items Preview */}
                                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {order.items?.slice(0, 4).map((item, idx) => (
                                                    <span key={idx} className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm">
                                                        {item.medicineName} Ã— {item.quantity}
                                                    </span>
                                                ))}
                                                {order.items?.length > 4 && (
                                                    <span className="bg-gray-200 px-3 py-1 rounded-lg text-sm text-gray-600">
                                                        +{order.items.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* === AI TOOLS TAB === */}
                {activeTab === 'ai-tools' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Sparkles className="w-6 h-6 text-teal-500" /> Smart Pharmacy Toolkit</h2>
                            <p className="text-gray-500">Assistive tools to help planning, stock control, and decisions</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Drug Alternative Suggester */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-5 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><ArrowRightLeft className="w-5 h-5" /></div>
                                        <div><h3 className="font-bold">Drug Alternative Suggester</h3><p className="text-xs text-white/70">Find equivalent or cheaper alternatives</p></div>
                                    </div>
                                </div>
                                <div className="p-5 space-y-3">
                                    <input type="text" placeholder="Drug name (e.g. Atorvastatin)" value={drugAltForm.drugName} onChange={e => setDrugAltForm({...drugAltForm, drugName: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-200" />
                                    <select value={drugAltForm.reason} onChange={e => setDrugAltForm({...drugAltForm, reason: e.target.value})} className="w-full p-3 border rounded-xl outline-none bg-white">
                                        <option value="">Reason for alternative</option>
                                        <option value="cost">Lower Cost</option>
                                        <option value="side-effects">Fewer Side Effects</option>
                                        <option value="availability">Better Availability</option>
                                        <option value="allergy">Patient Allergy</option>
                                    </select>
                                    <button onClick={handleDrugAlternatives} disabled={aiLoading || !drugAltForm.drugName} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                        {aiLoading && !reorderResult ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</> : <><Sparkles className="w-5 h-5" /> Find Alternatives</>}
                                    </button>
                                    {drugAltResult && (
                                        <div className="mt-3 bg-teal-50 rounded-xl p-4 border border-teal-100 text-sm text-gray-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                            {drugAltResult}
                                            <div className="flex gap-2 mt-3">
                                                <button onClick={() => navigator.clipboard.writeText(drugAltResult)} className="flex items-center gap-1 text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-50"><Copy className="w-3 h-3" /> Copy</button>
                                                <button onClick={() => setDrugAltResult(null)} className="text-xs text-teal-600 font-medium hover:underline">Clear</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Smart Reorder Suggestions */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><RotateCcw className="w-5 h-5" /></div>
                                        <div><h3 className="font-bold">Smart Reorder Suggestions</h3><p className="text-xs text-white/70">AI analyzes inventory for optimal reordering</p></div>
                                    </div>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-amber-600" /><span className="text-sm font-bold text-amber-800">How it works</span></div>
                                        <p className="text-xs text-gray-600">AI analyzes your current inventory levels, expiry dates, and stock patterns to suggest what to reorder, quantities, and priority levels.</p>
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2"><Package className="w-4 h-4" /> {medicines.length} products in inventory will be analyzed</div>
                                    <button onClick={handleSmartReorder} disabled={aiLoading || medicines.length === 0} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                        {aiLoading && !drugAltResult ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-5 h-5" /> Get Reorder Suggestions</>}
                                    </button>
                                    {reorderResult && (
                                        <div className="mt-3 bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-gray-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                            {reorderResult}
                                            <div className="flex gap-2 mt-3">
                                                <button onClick={() => navigator.clipboard.writeText(reorderResult)} className="flex items-center gap-1 text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-50"><Copy className="w-3 h-3" /> Copy</button>
                                                <button onClick={() => setReorderResult(null)} className="text-xs text-amber-600 font-medium hover:underline">Clear</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick AI Insights */}
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                                <h3 className="font-bold text-lg">Quick Inventory Insights</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-amber-400 text-xs font-bold uppercase mb-1">Low Stock Alert</p>
                                    <p className="text-2xl font-bold">{medicines.filter(m => m.stock > 0 && m.stock <= 10).length}</p>
                                    <p className="text-gray-400 text-xs mt-1">items need restocking soon</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-red-400 text-xs font-bold uppercase mb-1">Expiring in 30 Days</p>
                                    <p className="text-2xl font-bold">{medicines.filter(m => { const d = Math.ceil((new Date(m.expiryDate) - new Date()) / 86400000); return d > 0 && d <= 30; }).length}</p>
                                    <p className="text-gray-400 text-xs mt-1">items expiring soon</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Healthy Stock</p>
                                    <p className="text-2xl font-bold">{medicines.filter(m => m.stock > 10).length}</p>
                                    <p className="text-gray-400 text-xs mt-1">items well-stocked</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* === MODALS === */}

            {/* Prescription Modal */}
            {showPrescriptionModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                                Patient Prescription
                            </h3>
                            <button onClick={() => setShowPrescriptionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 max-h-[60vh] overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{selectedOrder.prescription}</pre>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowPrescriptionModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Order Detail Modal */}
            {showBulkOrderModal && selectedBulkOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                                    <p className="text-gray-500 text-sm">{selectedBulkOrder.invoiceNumber}</p>
                                </div>
                                <button onClick={() => setShowBulkOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {/* Hospital Info */}
                            <div className="bg-teal-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Building2 className="w-6 h-6 text-teal-600" />
                                    <h4 className="font-bold text-gray-900">{selectedBulkOrder.hospitalName}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(selectedBulkOrder.priority)}`}>
                                        {selectedBulkOrder.priority}
                                    </span>
                                </div>
                                {selectedBulkOrder.hospitalContact && (
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        {selectedBulkOrder.hospitalContact.phone && <p>ðŸ“ž {selectedBulkOrder.hospitalContact.phone}</p>}
                                        {selectedBulkOrder.hospitalContact.email && <p>âœ‰ï¸ {selectedBulkOrder.hospitalContact.email}</p>}
                                        {selectedBulkOrder.hospitalContact.address && <p className="col-span-2">ðŸ“ {selectedBulkOrder.hospitalContact.address}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Order Items */}
                            <h4 className="font-bold text-gray-900 mb-3">Order Items</h4>
                            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Medicine</th>
                                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Qty</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Unit Price</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBulkOrder.items?.map((item, idx) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                                <td className="py-3 px-4 font-medium text-gray-900">{item.medicineName}</td>
                                                <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                                                <td className="py-3 px-4 text-right text-gray-600"> {item.unitPrice}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-gray-900"> {item.totalPrice}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                        <tr>
                                            <td colSpan="3" className="py-3 px-4 text-right font-bold text-gray-700">Grand Total:</td>
                                            <td className="py-3 px-4 text-right font-bold text-emerald-600 text-lg"> {selectedBulkOrder.totalAmount?.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {selectedBulkOrder.notes && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                                    <p className="text-xs font-bold text-amber-700 uppercase mb-1">Hospital Notes:</p>
                                    <p className="text-gray-700">{selectedBulkOrder.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <div className="flex flex-wrap gap-3 justify-end">
                                {selectedBulkOrder.status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateBulkOrderStatus(selectedBulkOrder._id, 'Cancelled')}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleUpdateBulkOrderStatus(selectedBulkOrder._id, 'Confirmed')}
                                            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
                                        >
                                            Confirm Order
                                        </button>
                                    </>
                                )}
                                {selectedBulkOrder.status === 'Confirmed' && (
                                    <button
                                        onClick={() => handleUpdateBulkOrderStatus(selectedBulkOrder._id, 'Processing')}
                                        className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium"
                                    >
                                        Start Processing
                                    </button>
                                )}
                                {selectedBulkOrder.status === 'Processing' && (
                                    <button
                                        onClick={() => handleUpdateBulkOrderStatus(selectedBulkOrder._id, 'Dispatched')}
                                        className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium flex items-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" />
                                        Mark Dispatched
                                    </button>
                                )}
                                {selectedBulkOrder.status === 'Dispatched' && (
                                    <button
                                        onClick={() => handleUpdateBulkOrderStatus(selectedBulkOrder._id, 'Delivered')}
                                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Delivered
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowBulkOrderModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Medicine Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setShowEditModal(false); } }}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{showEditModal ? 'Edit' : 'Add'} Medicine</h3>
                            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Paracetamol 500mg"
                                    required
                                    value={formData.medicineName}
                                    onChange={e => setFormData({ ...formData, medicineName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ( ) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expiryDate}
                                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    placeholder="Brief description..."
                                    rows="2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/30 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {submitting ? 'Saving...' : 'Save Medicine'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Medicine?</h3>
                            <p className="text-gray-500 mb-6">This action cannot be undone. The medicine will be permanently removed from your inventory.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyDashboard;


