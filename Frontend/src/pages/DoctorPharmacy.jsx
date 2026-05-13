/**
 * DoctorPharmacy Page
 * Allows doctors to browse pharmacies, check stock, and send prescriptions
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Building2, Search, Pill, Send, MapPin, Phone, Package,
    Check, Loader2, Plus, Minus, FileText, X, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import {
    getPublicPharmacyList, getPharmacyMedicinesById,
    createPrescription, sendPrescriptionToPharmacy, getDoctorPrescriptions
} from '../services/api';

const DoctorPharmacy = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('pharmacies'); // pharmacies | prescriptions | new
    const [pharmacies, setPharmacies] = useState([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [pharmacyMeds, setPharmacyMeds] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMeds, setLoadingMeds] = useState(false);
    const [search, setSearch] = useState('');
    const [sending, setSending] = useState(null);
    const [sendSuccess, setSendSuccess] = useState(null);
    const [myPatients, setMyPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');

    // New prescription form
    const [rxForm, setRxForm] = useState({
        patientId: '', diagnosis: '', notes: '',
        medicines: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 }]
    });
    const [submittingRx, setSubmittingRx] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pharmRes, rxRes, patientsRes] = await Promise.all([
                getPublicPharmacyList(),
                getDoctorPrescriptions(),
                api.get('/doctor/my-patients').catch(() => ({ data: { patients: [] } }))
            ]);
            setPharmacies(pharmRes.data.pharmacies || pharmRes.data || []);
            setPrescriptions(rxRes.data.prescriptions || []);
            setMyPatients(patientsRes.data.patients || []);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPharmacy = async (pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setLoadingMeds(true);
        try {
            const res = await getPharmacyMedicinesById(pharmacy._id);
            setPharmacyMeds(res.data.medicines || res.data || []);
        } catch (err) {
            console.error('Failed to load medicines:', err);
            setPharmacyMeds([]);
        } finally {
            setLoadingMeds(false);
        }
    };

    const handleSendToPharmacy = async (prescriptionId, pharmacyId) => {
        try {
            setSending(prescriptionId);
            await sendPrescriptionToPharmacy(prescriptionId, pharmacyId);
            setSendSuccess(prescriptionId);
            setTimeout(() => setSendSuccess(null), 3000);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send prescription');
        } finally {
            setSending(null);
        }
    };

    const addMedicineLine = () => {
        setRxForm(prev => ({
            ...prev,
            medicines: [...prev.medicines, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 }]
        }));
    };

    const removeMedicineLine = (idx) => {
        setRxForm(prev => ({
            ...prev,
            medicines: prev.medicines.filter((_, i) => i !== idx)
        }));
    };

    const updateMedicineLine = (idx, field, value) => {
        setRxForm(prev => ({
            ...prev,
            medicines: prev.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m)
        }));
    };

    const handleCreatePrescription = async (e) => {
        e.preventDefault();
        if (!rxForm.patientId || !rxForm.diagnosis || rxForm.medicines.some(m => !m.medicineName || !m.dosage)) {
            alert('Please fill in patient ID, diagnosis, and all medicine details');
            return;
        }
        try {
            setSubmittingRx(true);
            await createPrescription(rxForm);
            setRxForm({
                patientId: '', diagnosis: '', notes: '',
                medicines: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 }]
            });
            setTab('prescriptions');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create prescription');
        } finally {
            setSubmittingRx(false);
        }
    };

    const filteredPharmacies = pharmacies.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => navigate('/doctor/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2 text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">Pharmacy Network</h1>
                    <p className="text-gray-500 mt-1">Browse pharmacies, manage prescriptions, and send orders</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'pharmacies', label: 'Browse Pharmacies', icon: Building2 },
                        { key: 'prescriptions', label: 'My Prescriptions', icon: FileText, badge: prescriptions.length },
                        { key: 'new', label: 'New Prescription', icon: Plus }
                    ].map(t => (
                        <button key={t.key} onClick={() => { setTab(t.key); setSelectedPharmacy(null); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                tab === t.key ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}>
                            <t.icon className="w-4 h-4" /> {t.label}
                            {t.badge > 0 && <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{t.badge}</span>}
                        </button>
                    ))}
                </div>

                {/* === PHARMACIES TAB === */}
                {tab === 'pharmacies' && !selectedPharmacy && (
                    <div>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search pharmacies by name or address..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPharmacies.map(p => (
                                <div key={p._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate">{p.name}</h3>
                                            {p.address && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{p.address}</p>}
                                            {p.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{p.phone}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleViewPharmacy(p)}
                                        className="w-full py-2.5 bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-600 font-medium rounded-xl text-sm hover:from-sky-100 hover:to-cyan-100 transition flex items-center justify-center gap-2 group-hover:from-sky-600 group-hover:to-cyan-600 group-hover:text-white">
                                        <Package className="w-4 h-4" /> View Inventory
                                    </button>
                                </div>
                            ))}
                            {filteredPharmacies.length === 0 && (
                                <div className="col-span-full bg-white rounded-2xl p-12 text-center">
                                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No pharmacies found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Pharmacy Detail View */}
                {tab === 'pharmacies' && selectedPharmacy && (
                    <div>
                        <button onClick={() => setSelectedPharmacy(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium">
                            <ChevronLeft className="w-4 h-4" /> Back to Pharmacies
                        </button>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                                <h2 className="text-xl font-bold">{selectedPharmacy.name}</h2>
                                {selectedPharmacy.address && <p className="text-green-100 text-sm mt-1 flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedPharmacy.address}</p>}
                                {selectedPharmacy.phone && <p className="text-green-100 text-sm mt-0.5 flex items-center gap-1"><Phone className="w-4 h-4" />{selectedPharmacy.phone}</p>}
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Pill className="w-5 h-5 text-green-500" /> Available Medicines</h3>
                                {loadingMeds ? (
                                    <div className="text-center py-8"><Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto" /></div>
                                ) : pharmacyMeds.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No medicines available</p>
                                ) : (
                                    <div className="grid gap-3">
                                        {pharmacyMeds.map(med => (
                                            <div key={med._id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{med.name}</p>
                                                    <p className="text-xs text-gray-500">{med.category || 'General'}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-bold text-green-600"> {med.price}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${med.stock > 10 ? 'bg-green-100 text-green-700' : med.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                        Stock: {med.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Send prescription to this pharmacy */}
                                {prescriptions.filter(rx => rx.status === 'created').length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-sky-500" /> Send Prescription Here</h4>
                                        {prescriptions.filter(rx => rx.status === 'created').map(rx => (
                                            <div key={rx._id} className="p-3 bg-sky-50 rounded-xl flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{rx.diagnosis}</p>
                                                    <p className="text-xs text-gray-500">{rx.medicines?.length} medication(s) · {rx.patientId?.name || 'Patient'}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleSendToPharmacy(rx._id, selectedPharmacy._id)}
                                                    disabled={sending === rx._id}
                                                    className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition disabled:opacity-50 flex items-center gap-1.5">
                                                    {sending === rx._id ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                     sendSuccess === rx._id ? <><CheckCircle className="w-4 h-4" /> Sent!</> :
                                                     <><Send className="w-4 h-4" /> Send</>}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* === PRESCRIPTIONS TAB === */}
                {tab === 'prescriptions' && (
                    <div>
                        {prescriptions.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-700">No prescriptions yet</h3>
                                <p className="text-gray-400 mt-2">Create a prescription after a consultation</p>
                                <button onClick={() => setTab('new')} className="mt-4 px-6 py-2.5 bg-sky-600 text-white rounded-xl font-medium text-sm hover:bg-sky-700 transition">
                                    <Plus className="w-4 h-4 inline mr-1" /> Create Prescription
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {prescriptions.map(rx => {
                                    const statusColors = {
                                        created: 'bg-gray-100 text-gray-700',
                                        sent_to_pharmacy: 'bg-blue-100 text-blue-700',
                                        received: 'bg-sky-100 text-sky-700',
                                        processing: 'bg-yellow-100 text-yellow-700',
                                        ready: 'bg-green-100 text-green-700',
                                        dispensed: 'bg-emerald-100 text-emerald-700',
                                        cancelled: 'bg-red-100 text-red-700'
                                    };
                                    return (
                                        <div key={rx._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{rx.diagnosis}</h3>
                                                    <p className="text-sm text-gray-500">Patient: {rx.patientId?.name || 'Unknown'} · {rx.medicines?.length} medication(s)</p>
                                                    <p className="text-xs text-gray-400">{new Date(rx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusColors[rx.status] || statusColors.created}`}>
                                                    {rx.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {rx.medicines?.map((m, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-medium">
                                                        {m.medicineName} ({m.dosage})
                                                    </span>
                                                ))}
                                            </div>
                                            {rx.pharmacyId && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Sent to: {rx.pharmacyId.name}</p>
                                            )}
                                            {rx.status === 'created' && (
                                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Not yet sent to pharmacy - browse pharmacies to send</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* === NEW PRESCRIPTION TAB === */}
                {tab === 'new' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 p-6 text-white">
                            <h2 className="text-xl font-bold">Create New Prescription</h2>
                            <p className="text-sky-200 text-sm mt-1">Fill in the details and send to a pharmacy</p>
                        </div>
                        <form onSubmit={handleCreatePrescription} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Patient *</label>
                                    {myPatients.length > 0 ? (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                value={patientSearch}
                                                onChange={e => setPatientSearch(e.target.value)}
                                                placeholder="Search by patient name..."
                                                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-2" />
                                            <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                                                {myPatients
                                                    .filter(p => !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase()) || p.email?.toLowerCase().includes(patientSearch.toLowerCase()))
                                                    .map(p => (
                                                    <button type="button" key={p._id} onClick={() => { setRxForm(prev => ({ ...prev, patientId: p._id })); setPatientSearch(p.name); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 transition flex items-center justify-between ${rxForm.patientId === p._id ? 'bg-sky-50 border-l-2 border-sky-500' : ''}`}>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{p.name}</p>
                                                            <p className="text-xs text-gray-500">{p.email} {p.age ? `· Age: ${p.age}` : ''} {p.gender ? `· ${p.gender}` : ''}</p>
                                                        </div>
                                                        {rxForm.patientId === p._id && <CheckCircle className="w-4 h-4 text-sky-600" />}
                                                    </button>
                                                ))}
                                                {myPatients.filter(p => !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                                                    <p className="px-4 py-3 text-sm text-gray-400 text-center">No patients found</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                            <p className="text-sm text-amber-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> No patient history found. Complete appointments to see patients here.</p>
                                            <input value={rxForm.patientId} onChange={e => setRxForm(prev => ({ ...prev, patientId: e.target.value }))}
                                                placeholder="Or enter patient ID manually" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-sky-500" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Diagnosis *</label>
                                    <input value={rxForm.diagnosis} onChange={e => setRxForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                                        placeholder="e.g., Upper Respiratory Infection" required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-gray-700">Medications *</label>
                                    <button type="button" onClick={addMedicineLine}
                                        className="text-sky-600 text-sm font-medium flex items-center gap-1 hover:text-sky-800 transition">
                                        <Plus className="w-4 h-4" /> Add Medicine
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {rxForm.medicines.map((med, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-gray-500">Medicine #{idx + 1}</span>
                                                {rxForm.medicines.length > 1 && (
                                                    <button type="button" onClick={() => removeMedicineLine(idx)} className="text-red-400 hover:text-red-600 transition">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <input value={med.medicineName} onChange={e => updateMedicineLine(idx, 'medicineName', e.target.value)}
                                                    placeholder="Medicine name *" required
                                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500" />
                                                <input value={med.dosage} onChange={e => updateMedicineLine(idx, 'dosage', e.target.value)}
                                                    placeholder="Dosage (e.g., 500mg) *" required
                                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500" />
                                                <input value={med.frequency} onChange={e => updateMedicineLine(idx, 'frequency', e.target.value)}
                                                    placeholder="Frequency (e.g., 3x/day)"
                                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500" />
                                                <input value={med.duration} onChange={e => updateMedicineLine(idx, 'duration', e.target.value)}
                                                    placeholder="Duration (e.g., 7 days)"
                                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500" />
                                                <input value={med.instructions} onChange={e => updateMedicineLine(idx, 'instructions', e.target.value)}
                                                    placeholder="Instructions (e.g., after meals)"
                                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500" />
                                                <input type="number" value={med.quantity} min={1} onChange={e => updateMedicineLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                    placeholder="Qty"
                                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Notes</label>
                                <textarea value={rxForm.notes} onChange={e => setRxForm(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3} placeholder="Any special instructions or notes..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none" />
                            </div>

                            <button type="submit" disabled={submittingRx}
                                className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-xl hover:from-sky-700 hover:to-cyan-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg">
                                {submittingRx ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileText className="w-5 h-5" /> Create Prescription</>}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorPharmacy;


