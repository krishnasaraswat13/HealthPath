import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, AlertTriangle, Phone, Plus, Trash2, Edit2, Save, X,
    MapPin, Users, Shield, Loader2, CheckCircle, PhoneCall
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const RELATIONSHIPS = [
    { value: 'spouse', label: 'Spouse' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' }
];

const EmergencySOS = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [sosTriggered, setSosTriggered] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        relationship: 'other',
        isPrimary: false
    });

    useEffect(() => {
        fetchContacts();
        getCurrentLocation();
    }, []);

    const fetchContacts = async () => {
        try {
            const res = await api.get('/emergency/contacts');
            setContacts(res.data.contacts || []);
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        setLocationLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationLoading(false);
                },
                (error) => {
                    console.error('Location error:', error);
                    setLocationLoading(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setLocationLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await api.put(`/emergency/contact/${editingContact._id}`, formData);
            } else {
                await api.post('/emergency/contact', formData);
            }
            fetchContacts();
            resetForm();
        } catch (err) {
            alert('Failed to save contact');
        }
    };

    const deleteContact = async (id) => {
        if (!window.confirm('Remove this emergency contact?')) return;
        try {
            await api.delete(`/emergency/contact/${id}`);
            setContacts(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            alert('Failed to delete contact');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', relationship: 'other', isPrimary: false });
        setShowAddForm(false);
        setEditingContact(null);
    };

    const startEdit = (contact) => {
        setFormData({
            name: contact.name,
            phone: contact.phone,
            email: contact.email || '',
            relationship: contact.relationship,
            isPrimary: contact.isPrimary
        });
        setEditingContact(contact);
        setShowAddForm(true);
    };

    const triggerSOS = async () => {
        if (!window.confirm('âš ï¸ TRIGGER EMERGENCY SOS?\n\nThis will alert your emergency contacts and nearby medical services.')) return;

        setSosTriggered(true);
        const patient = JSON.parse(localStorage.getItem('user'));

        try {
            // Send SOS via API
            const res = await api.post('/emergency/sos', {
                location: location ? {
                    lat: location.lat,
                    lng: location.lng,
                    address: 'Current Location'
                } : null,
                message: 'Emergency! I need immediate help!'
            });

            // Broadcast via Socket for real-time alerts
            if (socket) {
                socket.emit('emergency_sos', {
                    patientId: patient._id || patient.id,
                    patientName: patient.name,
                    location: location,
                    emergencyContacts: contacts
                });
            }

            // Show emergency numbers
            alert(`ðŸš¨ SOS ALERT SENT!\n\nEmergency contacts notified.\n\nEmergency Numbers:\nâ€¢ Ambulance: 102\nâ€¢ Police: 100\nâ€¢ Fire: 101\nâ€¢ National: 112`);

        } catch (err) {
            alert('Failed to send SOS. Please call emergency services directly: 112');
        }

        // Reset after 10 seconds
        setTimeout(() => setSosTriggered(false), 10000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6 md:p-10">
            {/* SOS ANIMATION OVERLAY */}
            {sosTriggered && (
                <div className="fixed inset-0 z-50 bg-red-600 flex items-center justify-center animate-pulse">
                    <div className="text-center text-white">
                        <AlertTriangle className="w-24 h-24 mx-auto mb-6 animate-bounce" />
                        <h1 className="text-4xl font-bold mb-4">SOS ALERT SENT!</h1>
                        <p className="text-xl opacity-80">Emergency contacts are being notified...</p>
                        <div className="mt-8 flex gap-4 justify-center">
                            <a href="tel:102" className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                                <Phone className="w-5 h-5" /> Call Ambulance
                            </a>
                            <a href="tel:112" className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                                <PhoneCall className="w-5 h-5" /> Call 112
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="max-w-4xl mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div className="bg-red-100 p-3 rounded-xl">
                            <Shield className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Emergency SOS</h1>
                            <p className="text-gray-500 text-sm">Manage contacts & emergency alerts</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                {/* BIG SOS BUTTON */}
                <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-8 text-center text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                    
                    <h2 className="text-xl font-bold mb-2 relative z-10">Emergency Alert</h2>
                    <p className="text-red-100 mb-6 relative z-10">Press and hold to send SOS to all emergency contacts</p>
                    
                    <button
                        onClick={triggerSOS}
                        className="w-40 h-40 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl transform hover:scale-105 active:scale-95 transition-transform relative z-10 group"
                    >
                        <div className="text-center">
                            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto group-hover:animate-bounce" />
                            <span className="text-red-600 font-black text-xl mt-2 block">SOS</span>
                        </div>
                    </button>

                    {/* Location Status */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-red-100 relative z-10">
                        <MapPin className="w-4 h-4" />
                        {locationLoading ? (
                            <span className="text-sm">Getting location...</span>
                        ) : location ? (
                            <span className="text-sm">Location available for emergency services</span>
                        ) : (
                            <span className="text-sm">Location unavailable - enable for better response</span>
                        )}
                    </div>
                </div>

                {/* Quick Call Buttons */}
                <div className="grid grid-cols-3 gap-4">
                    <a href="tel:102" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition group">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-red-200 transition">
                            <Phone className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="font-bold text-gray-800">Ambulance</p>
                        <p className="text-2xl font-black text-red-600">102</p>
                    </a>
                    <a href="tel:100" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition group">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition">
                            <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="font-bold text-gray-800">Police</p>
                        <p className="text-2xl font-black text-blue-600">100</p>
                    </a>
                    <a href="tel:112" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition group">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition">
                            <PhoneCall className="w-6 h-6 text-orange-600" />
                        </div>
                        <p className="font-bold text-gray-800">National</p>
                        <p className="text-2xl font-black text-orange-600">112</p>
                    </a>
                </div>

                {/* Emergency Contacts Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-sky-500" /> Emergency Contacts
                        </h3>
                        <button
                            onClick={() => { resetForm(); setShowAddForm(true); }}
                            className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-sky-700 transition"
                        >
                            <Plus className="w-4 h-4" /> Add Contact
                        </button>
                    </div>

                    {/* Add/Edit Form */}
                    {showAddForm && (
                        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl mb-6 animate-in slide-in-from-top-2">
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-200 outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-200 outline-none"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-200 outline-none"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">Relationship</label>
                                    <select
                                        value={formData.relationship}
                                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-200 outline-none"
                                    >
                                        {RELATIONSHIPS.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrimary}
                                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                    className="w-4 h-4 text-sky-600 rounded"
                                />
                                <span className="text-sm text-gray-600">Set as primary contact</span>
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2 text-gray-600 bg-gray-200 rounded-xl font-bold hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> {editingContact ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Contacts List */}
                    {loading ? (
                        <div className="text-center py-10">
                            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No emergency contacts added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contacts.map(contact => (
                                <div
                                    key={contact._id}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${
                                        contact.isPrimary ? 'border-sky-200 bg-sky-50' : 'border-gray-100 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                                            contact.isPrimary ? 'bg-sky-600' : 'bg-gray-400'
                                        }`}>
                                            {contact.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800">{contact.name}</p>
                                                {contact.isPrimary && (
                                                    <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">PRIMARY</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{contact.phone}</p>
                                            <p className="text-xs text-gray-400 capitalize">{contact.relationship}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                                        >
                                            <Phone className="w-5 h-5" />
                                        </a>
                                        <button
                                            onClick={() => startEdit(contact)}
                                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteContact(contact._id)}
                                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EmergencySOS;


