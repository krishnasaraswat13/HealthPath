import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, Download, ArrowLeft, Pill, Calendar, User, Clock, 
    CheckCircle, AlertCircle, RefreshCw, Loader2, QrCode, Eye, 
    Printer, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { getPatientPrescriptionsDetailed, getPrescriptionPDFData } from '../services/api';
import { jsPDF } from 'jspdf';

const PatientPrescriptionsPage = () => {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const res = await getPatientPrescriptionsDetailed();
            setPrescriptions(res.data.prescriptions || []);
        } catch (err) {
            console.error('Failed to fetch prescriptions:', err);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async (prescriptionId) => {
        try {
            setDownloadingId(prescriptionId);
            const res = await getPrescriptionPDFData(prescriptionId);
            const data = res.data.pdfData;

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 15;

            // ===== HEADER BAND =====
            doc.setFillColor(16, 78, 139);
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            // Clinic name
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('HealthPath', 15, 18);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('AI-Powered Healthcare Platform', 15, 25);
            doc.text('Digital Prescription', 15, 32);

            // Rx symbol
            doc.setFontSize(36);
            doc.setFont('helvetica', 'bold');
            doc.text('Rx', pageWidth - 35, 28);

            // Prescription ID
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${data.prescriptionId}`, pageWidth - 60, 36);

            y = 50;

            // ===== DOCTOR & PATIENT INFO =====
            doc.setTextColor(0, 0, 0);
            
            // Doctor Info (Left)
            doc.setFillColor(240, 245, 255);
            doc.roundedRect(10, y, 88, 35, 3, 3, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 78, 139);
            doc.text('Prescribing Physician', 15, y + 8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(11);
            doc.text(`Dr. ${data.doctor.name}`, 15, y + 16);
            doc.setFontSize(8);
            doc.text(`${data.doctor.specialization}`, 15, y + 22);
            doc.text(`Exp: ${data.doctor.experience} yrs`, 15, y + 28);

            // Patient Info (Right)
            doc.setFillColor(240, 255, 245);
            doc.roundedRect(102, y, 98, 35, 3, 3, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 120, 60);
            doc.text('Patient Details', 107, y + 8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(11);
            doc.text(`${data.patient.name}`, 107, y + 16);
            doc.setFontSize(8);
            doc.text(`Age: ${data.patient.age || 'N/A'} | Gender: ${data.patient.gender || 'N/A'}`, 107, y + 22);
            doc.text(`Phone: ${data.patient.phone || 'N/A'}`, 107, y + 28);

            y += 42;

            // ===== DATE & DIAGNOSIS =====
            doc.setFillColor(255, 248, 240);
            doc.roundedRect(10, y, pageWidth - 20, 18, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 100, 0);
            doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 15, y + 7);
            doc.text(`Valid Until: ${data.validUntil ? new Date(data.validUntil).toLocaleDateString('en-IN') : 'N/A'}`, 15, y + 13);
            doc.setTextColor(16, 78, 139);
            doc.text(`Diagnosis: ${data.diagnosis || 'Not specified'}`, 110, y + 10);

            y += 25;

            // ===== MEDICATIONS TABLE =====
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 78, 139);
            doc.text('Prescribed Medications', 15, y);
            y += 3;
            
            // Table header
            doc.setFillColor(16, 78, 139);
            doc.roundedRect(10, y, pageWidth - 20, 10, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            const cols = [15, 65, 95, 125, 155, 180];
            doc.text('#', cols[0], y + 7);
            doc.text('Medicine', cols[0] + 5, y + 7);
            doc.text('Dosage', cols[1], y + 7);
            doc.text('Frequency', cols[2], y + 7);
            doc.text('Duration', cols[3], y + 7);
            doc.text('Qty', cols[4], y + 7);
            doc.text('Instructions', cols[5], y + 7);
            y += 12;

            // Table rows
            data.medicines.forEach((med, idx) => {
                if (y > 260) {
                    doc.addPage();
                    y = 20;
                }
                const bgColor = idx % 2 === 0 ? [248, 250, 255] : [255, 255, 255];
                doc.setFillColor(...bgColor);
                doc.rect(10, y - 3, pageWidth - 20, 12, 'F');
                
                doc.setTextColor(40, 40, 40);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text(`${idx + 1}.`, cols[0], y + 4);
                doc.setFont('helvetica', 'bold');
                doc.text(med.name || '', cols[0] + 5, y + 4);
                doc.setFont('helvetica', 'normal');
                doc.text(med.dosage || '', cols[1], y + 4);
                doc.text(med.frequency || '', cols[2], y + 4);
                doc.text(med.duration || '', cols[3], y + 4);
                doc.text(`${med.quantity || ''}`, cols[4], y + 4);
                const instr = med.instructions || '';
                doc.text(instr.substring(0, 18), cols[5], y + 4);
                y += 12;
            });

            y += 5;

            // ===== NOTES =====
            if (data.notes) {
                if (y > 240) { doc.addPage(); y = 20; }
                doc.setFillColor(255, 255, 240);
                doc.roundedRect(10, y, pageWidth - 20, 20, 3, 3, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(140, 120, 0);
                doc.text('Doctor\'s Notes:', 15, y + 7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80, 80, 80);
                const noteLines = doc.splitTextToSize(data.notes, pageWidth - 40);
                doc.text(noteLines, 15, y + 14);
                y += 25 + (noteLines.length - 1) * 4;
            }

            // ===== REFILL INFO =====
            if (data.isRefillable) {
                doc.setFillColor(240, 255, 240);
                doc.roundedRect(10, y, pageWidth - 20, 12, 3, 3, 'F');
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 120, 60);
                doc.text(`Refillable: Yes | Refills Used: ${data.refillCount || 0} / ${data.maxRefills || 0}`, 15, y + 8);
                y += 16;
            }

            // ===== FOOTER =====
            const footerY = doc.internal.pageSize.getHeight() - 25;
            doc.setDrawColor(200, 200, 200);
            doc.line(10, footerY, pageWidth - 10, footerY);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text('This is a digitally generated prescription from HealthPath. Verify authenticity via QR code or prescription ID.', 15, footerY + 5);
            doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | Status: ${data.status?.toUpperCase()}`, 15, footerY + 10);
            doc.text('HealthPath - AI-Powered Healthcare | www.healthpath.ai', 15, footerY + 15);

            // Save
            doc.save(`Prescription_${data.patient.name}_${new Date(data.date).toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);

        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const statusColors = {
        created: 'bg-blue-100 text-blue-800',
        sent: 'bg-amber-100 text-amber-800',
        received: 'bg-teal-100 text-teal-800',
        dispensed: 'bg-green-100 text-green-800',
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Loading prescriptions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-sky-700 bg-clip-text text-transparent">
                                My Prescriptions
                            </h1>
                            <p className="text-sm text-gray-500">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} found</p>
                        </div>
                    </div>
                    <button onClick={fetchPrescriptions} className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
                        <RefreshCw className="w-5 h-5 text-blue-600" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {prescriptions.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No Prescriptions Yet</h3>
                        <p className="text-gray-400 mt-2">Your prescriptions will appear here after consultations.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prescriptions.map((rx) => (
                            <div key={rx._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                {/* Card Header */}
                                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === rx._id ? null : rx._id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                            <FileText className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">
                                                {rx.diagnosis || rx.appointmentId?.diagnosis || 'Prescription'}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    Dr. {rx.doctorId?.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Pill className="w-3.5 h-3.5" />
                                                    {rx.medicines?.length || 0} medicines
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[rx.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {rx.status?.charAt(0).toUpperCase() + rx.status?.slice(1)}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); generatePDF(rx._id); }}
                                            disabled={downloadingId === rx._id}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-sky-700 transition disabled:opacity-50 shadow-sm"
                                        >
                                            {downloadingId === rx._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            PDF
                                        </button>
                                        {expandedId === rx._id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === rx._id && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Medicines List */}
                                            <div>
                                                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Pill className="w-4 h-4 text-blue-500" /> Medications
                                                </h4>
                                                <div className="space-y-2">
                                                    {rx.medicines?.map((med, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                                                            <p className="font-bold text-gray-800">{med.medicineName}</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{med.dosage}</span>
                                                                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{med.frequency}</span>
                                                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{med.duration}</span>
                                                            </div>
                                                            {med.instructions && (
                                                                <p className="text-xs text-gray-500 mt-1 italic">"{med.instructions}"</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Details Panel */}
                                            <div className="space-y-3">
                                                {rx.notes && (
                                                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                                        <p className="text-xs font-bold text-amber-700 uppercase mb-1">Doctor's Notes</p>
                                                        <p className="text-sm text-amber-900">{rx.notes}</p>
                                                    </div>
                                                )}
                                                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Refillable</span>
                                                        <span className="font-medium">{rx.isRefillable ? `Yes (${rx.refillCount || 0}/${rx.maxRefills || 0})` : 'No'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Valid Until</span>
                                                        <span className="font-medium">{rx.validUntil ? new Date(rx.validUntil).toLocaleDateString('en-IN') : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Specialist</span>
                                                        <span className="font-medium">{rx.doctorId?.specialization || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                {rx.qrCode && (
                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                                                        <QrCode className="w-8 h-8 text-gray-400" />
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500">Digital Verification</p>
                                                            <p className="text-xs text-gray-400">Scan QR to verify authenticity</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientPrescriptionsPage;


