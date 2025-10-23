/**
 * PatientPrescriptions Page
 * View prescriptions, track status, find pharmacies
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronLeft, Pill, Clock, MapPin, Phone, CheckCircle, AlertCircle, Package, Truck, Building2, ArrowRight, Search } from 'lucide-react';
import { getPatientPrescriptions, checkPrescriptionAvailability } from '../services/api';

const statusConfig = {
    created: { label: 'Created', color: 'bg-gray-100 text-gray-700', icon: FileText },
    sent_to_pharmacy: { label: 'Sent to Pharmacy', color: 'bg-blue-100 text-blue-700', icon: Truck },
    received: { label: 'Received by Pharmacy', color: 'bg-sky-100 text-sky-700', icon: Package },
    processing: { label: 'Being Prepared', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    ready: { label: 'Ready for Pickup', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    dispensed: { label: 'Dispensed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

const PatientPrescriptions = () => {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadPrescriptions();
    }, []);

    const loadPrescriptions = async () => {
        try {
            setLoading(true);
            const res = await getPatientPrescriptions();
            setPrescriptions(res.data.prescriptions || []);
        } catch (err) {
            console.error('Failed to load prescriptions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAvailability = async (prescriptionId) => {
        try {
            setCheckingAvailability(true);
            const res = await checkPrescriptionAvailability(prescriptionId);
            setAvailability(res.data);
        } catch (err) {
            console.error('Failed to check availability:', err);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const filtered = prescriptions.filter(p => filter === 'all' || p.status === filter);

    const getStatusProgress = (status) => {
        const steps = ['created', 'sent_to_pharmacy', 'received', 'processing', 'ready', 'dispensed'];
        const currentIdx = steps.indexOf(status);
        return ((currentIdx + 1) / steps.length) * 100;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2 text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">My Prescriptions</h1>
                    <p className="text-gray-500 mt-1">Track your prescriptions and medication orders</p>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'created', label: 'New' },
                        { key: 'sent_to_pharmacy', label: 'At Pharmacy' },
                        { key: 'ready', label: 'Ready' },
                        { key: 'dispensed', label: 'Dispensed' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === t.key ? 'bg-sky-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Prescriptions List */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No prescriptions found</h3>
                        <p className="text-gray-400 mt-2">Your prescriptions will appear here after a consultation</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(rx => {
                            const statusInfo = statusConfig[rx.status] || statusConfig.created;
                            const StatusIcon = statusInfo.icon;
                            const isExpanded = selectedPrescription === rx._id;

                            return (
                                <div key={rx._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                                    {/* Card Header */}
                                    <button onClick={() => setSelectedPrescription(isExpanded ? null : rx._id)}
                                        className="w-full p-5 flex items-center justify-between text-left">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center shadow">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{rx.diagnosis}</h3>
                                                <p className="text-sm text-gray-500">Dr. {rx.doctorId?.name} â€¢ {rx.doctorId?.specialization}</p>
                                                <p className="text-xs text-gray-400 mt-1">{new Date(rx.createdAt).toLocaleDateString()} â€¢ {rx.medicines?.length} medication(s)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${statusInfo.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusInfo.label}
                                            </span>
                                            <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 border-t border-gray-100">
                                            {/* Progress Bar */}
                                            {rx.status !== 'cancelled' && (
                                                <div className="mt-4 mb-5">
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                                        <span>Created</span><span>Sent</span><span>Received</span><span>Processing</span><span>Ready</span><span>Dispensed</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-sky-500 to-green-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${getStatusProgress(rx.status)}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Medicines */}
                                            <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2"><Pill className="w-4 h-4 text-sky-500" /> Medications</h4>
                                            <div className="grid gap-2 mb-4">
                                                {rx.medicines?.map((med, idx) => (
                                                    <div key={idx} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-800 text-sm">{med.medicineName}</p>
                                                            <p className="text-xs text-gray-500">{med.dosage} â€¢ {med.frequency} â€¢ {med.duration}</p>
                                                            {med.instructions && <p className="text-xs text-sky-500 mt-1">{med.instructions}</p>}
                                                        </div>
                                                        <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded font-medium">Qty: {med.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Notes */}
                                            {rx.notes && (
                                                <div className="p-3 bg-amber-50 rounded-xl mb-4">
                                                    <p className="text-xs font-semibold text-amber-700 mb-1">Doctor's Notes</p>
                                                    <p className="text-sm text-gray-700">{rx.notes}</p>
                                                </div>
                                            )}

                                            {/* Pharmacy info */}
                                            {rx.pharmacyId && (
                                                <div className="p-3 bg-green-50 rounded-xl mb-4 flex items-center gap-3">
                                                    <Building2 className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="font-medium text-gray-800 text-sm">{rx.pharmacyId.name}</p>
                                                        <p className="text-xs text-gray-500">{rx.pharmacyId.address} â€¢ {rx.pharmacyId.phone}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Check availability button */}
                                            {rx.status === 'created' && (
                                                <button onClick={() => handleCheckAvailability(rx._id)}
                                                    disabled={checkingAvailability}
                                                    className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-medium rounded-xl text-sm hover:from-sky-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2">
                                                    {checkingAvailability ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> Find Pharmacies with Stock</>}
                                                </button>
                                            )}

                                            {/* Availability results */}
                                            {availability && selectedPrescription === rx._id && (
                                                <div className="mt-4 space-y-2">
                                                    <h4 className="font-semibold text-gray-700 text-sm">Available Pharmacies ({availability.pharmacies?.length || 0})</h4>
                                                    {availability.pharmacies?.map((p, idx) => (
                                                        <div key={idx} className="p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-800 text-sm">{p.pharmacy.name}</p>
                                                                <p className="text-xs text-gray-500">{p.totalAvailable}/{availability.totalMedicines} medicines available</p>
                                                            </div>
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">{p.totalAvailable} items</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Validity */}
                                            {rx.validUntil && (
                                                <p className="text-xs text-gray-400 mt-3">Valid until: {new Date(rx.validUntil).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientPrescriptions;

