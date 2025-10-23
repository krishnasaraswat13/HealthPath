import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse, Stethoscope, Pill, FileText, MapPin, Calendar, Clock, Video,
  Trash2, LogOut, PhoneIncoming, Check, X, Brain,
  Droplet, Calculator, Plus, Minus, LayoutGrid, Activity, 
  AlertTriangle, UploadCloud, Sparkles, BookOpen, Shield, FlaskConical, Target, Siren,
  MessageSquare, RefreshCw, Download, Star, Bell, Eye, BarChart3, ClipboardList, ThumbsUp
} from "lucide-react";
import { getPatientAppointments, cancelAppointment } from "../services/api";
import { useSocket } from "../context/SocketContext";
import NotificationBell from "../components/NotificationBell";
import { jsPDF } from "jspdf";

// --- CUSTOM HOOKS ---

function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPatientAppointments();
      const allAppointments = res.data || [];
      
      // Count completed appointments as total visits
      const completedCount = allAppointments.filter(apt => apt.status === 'completed').length;
      setTotalVisits(completedCount);
      
      // Filter for active appointments only
      const activeAppointments = allAppointments.filter(apt => 
        apt.status !== 'completed' && apt.status !== 'cancelled'
      );
      setAppointments(activeAppointments);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = (id) => {
    setAppointments((prev) => prev.filter((a) => a._id !== id));
  };

  return { appointments, totalVisits, loading, error, fetch, setAppointments, remove };
}

// --- REAL FUNCTIONAL COMPONENTS ---

const HydrationTracker = () => {
  const [count, setCount] = useState(() => parseInt(localStorage.getItem('water_count')) || 0);
  const target = 8;

  useEffect(() => {
    localStorage.setItem('water_count', count);
  }, [count]);

  return (
    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h4 className="font-bold text-blue-900 flex items-center gap-2 text-lg"><Droplet className="w-5 h-5 fill-blue-500 text-blue-500"/> Hydration</h4>
            <p className="text-xs text-blue-600 mt-1">Daily Target: {target} glasses</p>
        </div>
        <span className="text-2xl font-black text-blue-600">{count}<span className="text-sm text-blue-400 font-medium">/{target}</span></span>
      </div>
      
      <div className="relative h-4 bg-blue-200 rounded-full overflow-hidden mb-6">
        <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((count / target) * 100, 100)}%` }}></div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setCount(Math.max(0, count - 1))} className="flex-1 py-2 bg-white text-blue-500 rounded-xl font-bold shadow-sm hover:bg-blue-100 transition"><Minus className="w-4 h-4 mx-auto"/></button>
        <button onClick={() => setCount(count + 1)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl font-bold shadow-blue-200 shadow-lg hover:bg-blue-600 transition"><Plus className="w-4 h-4 mx-auto"/></button>
      </div>
    </div>
  );
};

const MedicineManager = () => {
  const [meds, setMeds] = useState(() => JSON.parse(localStorage.getItem('patient_meds')) || []);
  const [newMed, setNewMed] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    localStorage.setItem('patient_meds', JSON.stringify(meds));
  }, [meds]);

  const addMed = (e) => {
    e.preventDefault();
    if (!newMed) return;
    setMeds([...meds, { id: Date.now(), name: newMed, time: newTime || "Anytime", taken: false }]);
    setNewMed("");
    setNewTime("");
  };

  const toggleMed = (id) => {
    setMeds(meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const deleteMed = (id) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg"><Pill className="w-5 h-5 text-teal-500"/> Daily Medicines</h4>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2 max-h-[200px]">
        {meds.length === 0 && <p className="text-gray-400 text-sm text-center italic mt-4">No medicines added yet.</p>}
        {meds.map((med) => (
          <div key={med.id} className={`flex items-center justify-between p-3 rounded-xl transition-all border ${med.taken ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 hover:border-teal-200'}`}>
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleMed(med.id)}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${med.taken ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                {med.taken && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className={`font-bold text-sm ${med.taken ? 'text-green-800 line-through opacity-60' : 'text-gray-800'}`}>{med.name}</p>
                <p className="text-[10px] text-gray-500">{med.time}</p>
              </div>
            </div>
            <button onClick={() => deleteMed(med.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
      </div>

      <form onSubmit={addMed} className="flex gap-2 mt-auto">
        <input type="text" placeholder="Pill name" className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-300" value={newMed} onChange={e => setNewMed(e.target.value)} />
        <input type="text" placeholder="Time" className="w-20 bg-gray-50 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-300" value={newTime} onChange={e => setNewTime(e.target.value)} />
        <button type="submit" className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition"><Plus className="w-5 h-5"/></button>
      </form>
    </div>
  );
};

const BMICalculator = () => {
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const [bmi, setBmi] = useState(null);

  const calc = () => {
    if(h && w) {
      const val = (w / ((h/100) ** 2)).toFixed(1);
      setBmi(val);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg"><Calculator className="w-5 h-5 text-orange-500"/> BMI Calculator</h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Height (cm)</label>
                <input type="number" placeholder="175" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-100 transition" value={h} onChange={e => setH(e.target.value)}/>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Weight (kg)</label>
                <input type="number" placeholder="70" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-100 transition" value={w} onChange={e => setW(e.target.value)}/>
            </div>
        </div>
        
        {bmi ? (
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-center animate-in zoom-in">
            <p className="text-xs text-orange-500 font-bold uppercase mb-1">Your BMI Score</p>
            <p className="text-3xl font-black">{bmi}</p>
            <p className="text-sm font-medium mt-1">{bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal Weight' : 'Overweight'}</p>
            <button onClick={() => setBmi(null)} className="mt-3 text-xs underline text-orange-600 hover:text-orange-800">Recalculate</button>
          </div>
        ) : (
          <button onClick={calc} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg shadow-gray-200">Calculate BMI</button>
        )}
      </div>
    </div>
  );
};

// --- CORE COMPONENTS ---

const DashboardCard = ({ title, Icon, colorKey, description, onClick }) => {
  const colors = {
    sky: { bg: "bg-sky-50", icon: "text-sky-600", hover: "group-hover:bg-sky-100", shadow: "group-hover:shadow-sky-500/10" },
    red: { bg: "bg-rose-50", icon: "text-rose-600", hover: "group-hover:bg-rose-100", shadow: "group-hover:shadow-rose-500/10" },
    yellow: { bg: "bg-amber-50", icon: "text-amber-600", hover: "group-hover:bg-amber-100", shadow: "group-hover:shadow-amber-500/10" },
    teal: { bg: "bg-teal-50", icon: "text-teal-600", hover: "group-hover:bg-teal-100", shadow: "group-hover:shadow-teal-500/10" },
    green: { bg: "bg-emerald-50", icon: "text-emerald-600", hover: "group-hover:bg-emerald-100", shadow: "group-hover:shadow-emerald-500/10" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", hover: "group-hover:bg-orange-100", shadow: "group-hover:shadow-orange-500/10" },
    pink: { bg: "bg-pink-50", icon: "text-pink-600", hover: "group-hover:bg-pink-100", shadow: "group-hover:shadow-pink-500/10" },
    cyan: { bg: "bg-cyan-50", icon: "text-cyan-600", hover: "group-hover:bg-cyan-100", shadow: "group-hover:shadow-cyan-500/10" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", hover: "group-hover:bg-emerald-100", shadow: "group-hover:shadow-emerald-500/10" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", hover: "group-hover:bg-amber-100", shadow: "group-hover:shadow-amber-500/10" },
  };
  const c = colors[colorKey];

  return (
    <button onClick={onClick} className={`group w-full text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl ${c.shadow} hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-44`}>
      <div className={`absolute -top-8 -right-8 w-28 h-28 ${c.bg} rounded-full blur-xl transition-transform group-hover:scale-150 opacity-60`}></div>
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${c.bg} ${c.hover} mb-4 group-hover:scale-110 transition-all duration-300 relative z-10`}>
        <Icon className={`w-7 h-7 ${c.icon}`} />
      </div>
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-sky-600 transition-colors">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">{description}</p>
      </div>
    </button>
  );
};

const AppointmentCard = ({ apt, onJoin, onCancel, onChat, onReschedule, onDownloadReceipt, onViewDetails, onReview }) => {
  const dateStr = new Date(apt.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const isCompleted = apt.status === 'completed';
  const isPending = apt.status === 'pending' || apt.status === 'scheduled';
  
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative">
            <img src={apt.doctorId?.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} alt="Dr" className="w-14 h-14 rounded-full object-cover border-2 border-sky-50" />
            <span className={`absolute bottom-0 right-0 w-3 h-3 ${isCompleted ? 'bg-gray-400' : 'bg-green-500'} border-2 border-white rounded-full`}></span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">Dr. {apt.doctorId?.name}</h4>
            <p className="text-sky-600 font-medium text-xs">{apt.doctorId?.specialization}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded"><Calendar className="h-3 w-3" /> {dateStr}</span>
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded"><Clock className="h-3 w-3" /> {apt.timeSlot}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${apt.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                {apt.paymentStatus?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {isCompleted ? (
            // Completed Appointment Actions
            <>
              <button onClick={() => onChat(apt)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition" title="Chat"><MessageSquare className="h-4 w-4" /></button>
              <button onClick={() => onViewDetails(apt)} className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition" title="View Prescription"><Eye className="h-4 w-4" /></button>
              <button onClick={() => onDownloadReceipt(apt)} className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition" title="Download Receipt"><Download className="h-4 w-4" /></button>
              <button onClick={() => onReview(apt)} className="p-2.5 text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-xl transition" title="Leave Review"><Star className="h-4 w-4" /></button>
              <span className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2"><Check className="w-4 h-4"/> Done</span>
            </>
          ) : (
            // Pending/Scheduled Appointment Actions
            <>
              <button onClick={() => onChat(apt)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition" title="Chat with Doctor"><MessageSquare className="h-4 w-4" /></button>
              <button onClick={() => onReschedule(apt)} className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition" title="Reschedule"><RefreshCw className="h-4 w-4" /></button>
              <button onClick={() => onCancel(apt._id)} className="p-2.5 text-red-400 bg-red-50 hover:bg-red-100 rounded-xl transition" title="Cancel"><Trash2 className="h-4 w-4" /></button>
              <button onClick={() => onJoin(apt)} className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-sky-700 transition">
                <Video className="h-4 w-4" /> Join Call
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Show prescription if completed */}
      {isCompleted && apt.diagnosis && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Diagnosis</p>
            <p className="text-gray-800 text-sm">{apt.diagnosis}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Prescription</p>
            <p className="text-gray-800 text-sm font-mono">{apt.prescription || "N/A"}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket(); 
  const patient = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const { appointments, totalVisits, loading, fetch, setAppointments, remove } = useAppointments();
  
  const [activeTab, setActiveTab] = useState("overview"); 
  const [incomingSession, setIncomingSession] = useState(null);
  
  // NEW: Modal states
  const [notification, setNotification] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  const nextAppt = useMemo(() => {
    if(!appointments.length) return null;
    return appointments.sort((a,b) => new Date(a.date) - new Date(b.date)).find(a => new Date(a.date) >= new Date());
  }, [appointments]);

  useEffect(() => { fetch(); }, [fetch]);

  // Socket listeners for notifications
  useEffect(() => {
    const patientId = patient?._id || patient?.id;
    if (socket && isConnected && patientId) {
        socket.emit('join_room', patientId);
        
        // Incoming call handler
        const handleReq = (data) => setIncomingSession(data);
        socket.on('session_request', handleReq);
        
        // Appointment reminder notification
        const handleReminder = (data) => {
            setNotification({ type: 'reminder', message: data.message, doctorName: data.doctorName });
            setTimeout(() => setNotification(null), 10000);
        };
        socket.on('appointment_reminder', handleReminder);
        
        // General notification
        const handleNotification = (data) => {
            setNotification({ type: 'info', message: data.message });
            setTimeout(() => setNotification(null), 5000);
        };
        socket.on('patient_notification', handleNotification);
        
        return () => {
            socket.off('session_request', handleReq);
            socket.off('appointment_reminder', handleReminder);
            socket.off('patient_notification', handleNotification);
        };
    }
  }, [socket, isConnected, patient?._id, patient?.id]);

  // Handlers
  const handleJoin = (apt) => {
    if (!apt.doctorId) return;
    navigate(`/video-call/${apt._id}`, { 
      state: { 
        appointmentInfo: { 
          doctorName: apt.doctorId?.name || 'Doctor', 
          timeSlot: apt.timeSlot,
          date: apt.date
        } 
      } 
    });
  };
  const handleChat = (apt) => {
    if (!apt.doctorId?._id) return;
    navigate(`/patient/chat/${apt.doctorId._id}`, { state: { doctorData: apt.doctorId } });
  };
  const handleCancel = async (id) => { 
    if(window.confirm("Cancel this appointment?")) { 
      try { await cancelAppointment(id); remove(id); } catch(err) { console.error('Failed to cancel', err); alert('Failed to cancel appointment.'); }
    } 
  };
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };
  
  const handleReschedule = (apt) => {
    setSelectedAppointment(apt);
    setRescheduleData({ date: '', time: '' });
    setShowRescheduleModal(true);
  };
  
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Add API call to reschedule appointment
    alert(`Reschedule request sent for ${rescheduleData.date} at ${rescheduleData.time}`);
    setShowRescheduleModal(false);
  };
  
  const handleViewDetails = (apt) => {
    setSelectedAppointment(apt);
    setShowDetailsModal(true);
  };
  
  const handleDownloadReceipt = (apt) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("HealthPath - Consultation Receipt", 20, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(apt.date).toLocaleDateString()}`, 20, 40);
    doc.text(`Time: ${apt.timeSlot}`, 20, 50);
    doc.text(`Doctor: Dr. ${apt.doctorId?.name}`, 20, 60);
    doc.text(`Specialization: ${apt.doctorId?.specialization}`, 20, 70);
    doc.text(`Patient: ${patient?.name}`, 20, 80);
    doc.text(`Status: ${apt.status}`, 20, 90);
    doc.text(`Payment: ${apt.paymentStatus}`, 20, 100);
    if (apt.diagnosis) {
      doc.text(`Diagnosis: ${apt.diagnosis}`, 20, 120);
    }
    if (apt.prescription) {
      doc.text(`Prescription: ${apt.prescription}`, 20, 130);
    }
    doc.save(`receipt_${apt._id}.pdf`);
  };
  
  const handleReview = (apt) => {
    setSelectedAppointment(apt);
    setReviewData({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    // TODO: Add API call to submit review
    alert(`Review submitted: ${reviewData.rating} stars`);
    setShowReviewModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30 p-4 md:p-8 font-sans text-gray-900 relative">
      
      {/* FLOATING AI BUTTON */}
      <button onClick={() => navigate("/patient/ai-assistant")} className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 text-white p-4 rounded-2xl shadow-2xl shadow-sky-500/30 hover:scale-110 hover:shadow-sky-500/40 transition-all duration-300 group">
        <Brain className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {/* INCOMING CALL MODAL */}
      {incomingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><PhoneIncoming className="w-12 h-12 text-emerald-600" /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Incoming Call</h3>
                <p className="text-gray-500 mb-8">Dr. {incomingSession.doctorName} is calling...</p>
                <div className="flex gap-4">
                    <button onClick={() => setIncomingSession(null)} className="flex-1 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors"><X className="w-5 h-5 inline mr-2"/> Decline</button>
                    <button onClick={() => { navigate(`/patient/chat/${incomingSession.doctorId}`); setIncomingSession(null); }} className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30"><Check className="w-5 h-5 inline mr-2"/> Accept</button>
                </div>
            </div>
        </div>
      )}

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 ${
          notification.type === 'reminder' ? 'bg-gradient-to-r from-sky-600 to-cyan-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
        } text-white`}>
          <Bell className="w-5 h-5 animate-bounce" />
          <div>
            <p className="font-bold text-sm">{notification.message}</p>
            {notification.doctorName && <p className="text-xs text-white/80">From Dr. {notification.doctorName}</p>}
          </div>
          <button onClick={() => setNotification(null)} className="ml-4 p-1 hover:bg-white/20 rounded-full transition"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Reschedule Appointment</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-gray-600 mb-4">Current: {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.timeSlot}</p>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Date</label>
                <input type="date" required value={rescheduleData.date} onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Time</label>
                <select required value={rescheduleData.time} onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none">
                  <option value="">Select time</option>
                  <option value="09:00 - 09:30">09:00 - 09:30</option>
                  <option value="09:30 - 10:00">09:30 - 10:00</option>
                  <option value="10:00 - 10:30">10:00 - 10:30</option>
                  <option value="10:30 - 11:00">10:30 - 11:00</option>
                  <option value="11:00 - 11:30">11:00 - 11:30</option>
                  <option value="14:00 - 14:30">14:00 - 14:30</option>
                  <option value="14:30 - 15:00">14:30 - 15:00</option>
                  <option value="15:00 - 15:30">15:00 - 15:30</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700">Request Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {showReviewModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Rate Your Experience</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-gray-600 mb-4">How was your consultation with Dr. {selectedAppointment.doctorId?.name}?</p>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" onClick={() => setReviewData({...reviewData, rating: star})} className={`p-2 transition ${reviewData.rating >= star ? 'text-amber-400' : 'text-gray-300'}`}>
                    <Star className={`w-8 h-8 ${reviewData.rating >= star ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Feedback (Optional)</label>
                <textarea value={reviewData.comment} onChange={e => setReviewData({...reviewData, comment: e.target.value})} rows={3} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none" placeholder="Share your experience..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Skip</button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Appointment Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-sky-50 rounded-xl">
                <img src={selectedAppointment.doctorId?.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} alt="Dr" className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-gray-900">Dr. {selectedAppointment.doctorId?.name}</h4>
                  <p className="text-sky-600 text-sm">{selectedAppointment.doctorId?.specialization}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Date</p>
                  <p className="font-bold">{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Time</p>
                  <p className="font-bold">{selectedAppointment.timeSlot}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Status</p>
                  <p className={`font-bold ${selectedAppointment.status === 'completed' ? 'text-green-600' : 'text-sky-600'}`}>{selectedAppointment.status}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Payment</p>
                  <p className={`font-bold ${selectedAppointment.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{selectedAppointment.paymentStatus}</p>
                </div>
              </div>
              {selectedAppointment.diagnosis && (
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Diagnosis</p>
                  <p className="text-gray-800">{selectedAppointment.diagnosis}</p>
                </div>
              )}
              {selectedAppointment.prescription && (
                <div className="p-4 bg-cyan-50 rounded-xl">
                  <p className="text-xs font-bold text-cyan-600 uppercase mb-2">Prescription</p>
                  <p className="text-gray-800 font-mono text-sm whitespace-pre-wrap">{selectedAppointment.prescription}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { handleDownloadReceipt(selectedAppointment); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download Receipt
              </button>
              <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-end bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 text-white p-8 rounded-3xl shadow-xl shadow-sky-500/20 relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
            <p className="text-sky-200 font-medium mb-1 text-sm">Good to see you,</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{patient?.name || "Patient"}</h1>
            <div className="flex gap-3">
                <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {isConnected ? 'Online' : 'Connecting...'}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 transition-colors">
                    <LogOut className="w-3 h-3" /> Logout
                </button>
                <NotificationBell onNavigate={navigate} />
            </div>
        </div>
        
        {/* TAB NAVIGATION */}
        <div className="flex bg-white/15 backdrop-blur-md p-1.5 rounded-2xl mt-6 md:mt-0 relative z-10 border border-white/20">
            {['overview', 'health', 'appointments'].map(tab => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${activeTab === tab ? 'bg-white text-sky-600 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </header>

      {/* --- TAB CONTENT --- */}
      <main className="max-w-7xl mx-auto min-h-[500px]">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* Next Appointment Banner */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-gradient-to-r from-sky-600 to-cyan-600 text-white p-6 rounded-2xl shadow-xl shadow-sky-500/20 relative overflow-hidden flex items-center justify-between">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <div className="relative z-10">
                            <p className="text-sky-200 text-xs font-bold uppercase tracking-wider mb-1">Next Appointment</p>
                            {nextAppt ? (
                                <div>
                                    <h3 className="text-2xl font-bold">Dr. {nextAppt.doctorId?.name}</h3>
                                    <p className="text-sky-100 flex items-center gap-2 mt-2"><Clock className="w-4 h-4"/> {new Date(nextAppt.date).toLocaleDateString()} at {nextAppt.timeSlot}</p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold">No upcoming visits</h3>
                                    <p className="text-sky-200 text-sm mt-1">Book a consultation to get started.</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm relative z-10 cursor-pointer hover:bg-white/30 transition-colors border border-white/20" onClick={() => nextAppt ? handleJoin(nextAppt) : navigate('/patient/doctors')}>
                            {nextAppt ? <Video className="w-6 h-6"/> : <Calendar className="w-6 h-6"/>}
                        </div>
                    </div>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Visits</p>
                            <p className="text-3xl font-black text-gray-900 mt-1">{totalVisits}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Pending</p>
                            <p className="text-3xl font-black bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent mt-1">{appointments.length}</p>
                        </div>
                    </div>
                </div>

                {/* 7 CARDS GRID (Included New Feature) */}
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><LayoutGrid className="w-6 h-6 text-sky-600"/> Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <DashboardCard title="Find a Doctor" Icon={Stethoscope} colorKey="sky" description="Search specialists and reserve your slot." onClick={() => navigate("/patient/doctors")} />
                    <DashboardCard title="Medical History" Icon={HeartPulse} colorKey="red" description="View diagnoses and prescriptions." onClick={() => navigate("/patient/medical-history")} />
                    <DashboardCard title="Pharmacy" Icon={Pill} colorKey="yellow" description="Request and track medicines online." onClick={() => navigate("/patient/pharmacy-catalog")} />
                    <DashboardCard title="AI Assistant" Icon={Brain} colorKey="teal" description="Get quick symptom guidance." onClick={() => navigate("/patient/ai-assistant")} />
                    
                    {/* CARD 5: Your Existing ML Analysis */}
                    <DashboardCard title="Report Analysis" Icon={FileText} colorKey="green" description="ML prediction from lab reports." onClick={() => navigate("/patient/report-analysis")} />
                    
                    <DashboardCard title="Route Finder" Icon={MapPin} colorKey="teal" description="Find nearby clinics." onClick={() => navigate("/patient/map")} />
                    
                    {/* CARD 7: NEW AI Decoder */}
                    <DashboardCard title="AI Report Decoder" Icon={Sparkles} colorKey="orange" description="Simple explanation of complex reports." onClick={() => navigate("/patient/report-decoder")} />
                    
                    {/* NEW REAL-WORLD FEATURES */}
                    <DashboardCard title="Symptom Journal" Icon={BookOpen} colorKey="pink" description="Track daily symptoms & mood." onClick={() => navigate("/patient/symptom-journal")} />
                    <DashboardCard title="Emergency SOS" Icon={Shield} colorKey="red" description="One-tap emergency contacts." onClick={() => navigate("/patient/emergency")} />
                    <DashboardCard title="Medicine Checker" Icon={FlaskConical} colorKey="emerald" description="Check drug interactions." onClick={() => navigate("/patient/medicine-checker")} />
                    <DashboardCard title="Health Goals" Icon={Target} colorKey="cyan" description="Track fitness & wellness goals." onClick={() => navigate("/patient/health-goals")} />
                    <DashboardCard title="Emergency Finder" Icon={Siren} colorKey="red" description="Find blood banks, beds & ambulances." onClick={() => navigate("/patient/emergency-finder")} />

                    {/* ENHANCED & NEW AI FEATURES */}
                    <DashboardCard title="My Prescriptions" Icon={ClipboardList} colorKey="sky" description="Download prescriptions as PDF." onClick={() => navigate("/patient/prescriptions")} />
                    <DashboardCard title="AI Symptom Triage" Icon={AlertTriangle} colorKey="red" description="Get urgency assessment instantly." onClick={() => navigate("/patient/symptom-triage")} />
                    <DashboardCard title="AI Diet Planner" Icon={Activity} colorKey="emerald" description="Personalized 7-day meal plan." onClick={() => navigate("/patient/diet-planner")} />
                    <DashboardCard title="Wellness Score" Icon={HeartPulse} colorKey="teal" description="AI-computed health score." onClick={() => navigate("/patient/wellness-score")} />
                    <DashboardCard title="Medical Translator" Icon={UploadCloud} colorKey="cyan" description="Translate prescriptions to 15+ languages." onClick={() => navigate("/patient/medical-translator")} />
                    <DashboardCard title="Health Analytics" Icon={BarChart3} colorKey="sky" description="Review trends and recovery progress." onClick={() => navigate("/patient/health-analytics")} />
                    <DashboardCard title="Appointment Feedback" Icon={Star} colorKey="amber" description="Rate & review your appointments." onClick={() => navigate("/patient/feedback")} />
                </div>
            </div>
        )}

        {/* 2. HEALTH TOOLS TAB */}
        {activeTab === 'health' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                <div className="h-80"><HydrationTracker /></div>
                <div className="h-80"><MedicineManager /></div>
                <div className="h-80"><BMICalculator /></div>
                
                {/* EMERGENCY SOS CARD */}
                <div className="col-span-1 md:col-span-3 bg-red-50 p-6 rounded-2xl border border-red-100 text-center flex flex-col items-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-2"/>
                    <h3 className="text-red-900 font-bold text-lg">Emergency SOS</h3>
                    <p className="text-red-700 text-sm mb-4">Click below to call emergency services instantly.</p>
                    <button onClick={() => window.location.href = "tel:102"} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-transform active:scale-95">
                        CALL AMBULANCE (102)
                    </button>
                </div>
            </div>
        )}

        {/* 3. APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Your Schedule</h2>
                    <button onClick={fetch} className="text-sm font-bold text-sky-600 bg-sky-50 px-4 py-2 rounded-lg hover:bg-sky-100">Refresh List</button>
                </div>
                {loading ? (
                    <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div></div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                        <p className="text-gray-500 font-medium">No active appointments.</p>
                        <button onClick={() => navigate("/patient/doctors")} className="mt-4 text-sky-600 font-bold hover:underline">Find a Doctor</button>
                    </div>
                ) : (
                    appointments.map((apt) => (
                      <AppointmentCard 
                        key={apt._id} 
                        apt={apt} 
                        onJoin={handleJoin} 
                        onCancel={handleCancel}
                        onChat={handleChat}
                        onReschedule={handleReschedule}
                        onDownloadReceipt={handleDownloadReceipt}
                        onViewDetails={handleViewDetails}
                        onReview={handleReview}
                      />
                    ))
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default PatientDashboard;

