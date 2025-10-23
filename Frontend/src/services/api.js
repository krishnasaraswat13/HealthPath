import axios from 'axios';

// Automatically use localhost in development, production URL when deployed
const apiBaseURL = import.meta.env.DEV 
  ? 'http://localhost:5000/api' 
  : import.meta.env.VITE_API_URL;

const socketURL = import.meta.env.DEV
  ? 'http://localhost:5000'
  : import.meta.env.VITE_SOCKET_URL;

export { socketURL };

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- API FUNCTIONS ---

// 1. Doctor Search & Filters
// Calls: GET /api/doctor?category=Cardiologist&search=Dr.Neelmani
export const searchDoctors = (category, searchTerm) => {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (searchTerm) params.append('search', searchTerm);
  
  return api.get(`/doctor?${params.toString()}`);
};

// Get single doctor details (for the booking modal)
export const getDoctorById = (id) => api.get(`/doctor/profile/${id}`);

// 2. Appointment Booking
export const bookAppointment = (data) => api.post('/appointments/book', data);

// 3. Payment Confirmation
export const confirmPayment = (data) => api.post('/appointments/confirm-payment', data);

// 4. Dashboard Data
export const getDoctorAppointments = () => api.get('/appointments/doctor');
export const getPatientAppointments = () => api.get('/appointments/patient');

// 5. Cancel Appointment
export const cancelAppointment = (id) => api.delete(`/appointments/${id}`);

// 6. Report Analysis
export const analyzeReport = (reportData) => api.post('/reports/analyze', reportData);
export const analyzeBatchReports = (reports) => api.post('/reports/analyze/batch', { reports });
export const checkMLServiceHealth = () => api.get('/reports/health');

// 7. Pharmacy Operations
export const getMedicines = () => api.get('/pharmacy/inventory');
export const addMedicine = (data) => api.post('/pharmacy/add', data);
export const updateMedicine = (id, data) => api.put(`/pharmacy/update/${id}`, data);
export const deleteMedicine = (id) => api.delete(`/pharmacy/delete/${id}`);

// 8. Video Call (Stream.io)
export const getVideoToken = () => api.get('/video/token');
export const initVideoCall = (appointmentId) => api.post('/video/call/init', { appointmentId });
export const endVideoCall = (appointmentId) => api.post('/video/call/end', { appointmentId });

// 9. Stream Chat (Stream.io)
export const initStreamChatChannel = (doctorId, patientId) => 
  api.post('/stream/chat/channel', { doctorId, patientId });
export const getStreamChatToken = () => api.get('/stream/chat/token');
export const initStreamVideoCall = (channelId, doctorId, patientId) => 
  api.post('/stream/chat/video-call', { channelId, doctorId, patientId });

// 10. Prescriptions
export const createPrescription = (data) => api.post('/prescriptions', data);
export const sendPrescriptionToPharmacy = (prescriptionId, pharmacyId) => 
  api.post(`/prescriptions/${prescriptionId}/send`, { pharmacyId });
export const getDoctorPrescriptions = () => api.get('/prescriptions/doctor');
export const getPatientPrescriptions = () => api.get('/prescriptions/patient');
export const getPharmacyPrescriptions = () => api.get('/prescriptions/pharmacy');
export const updatePrescriptionStatus = (id, status, pharmacyNotes) => 
  api.put(`/prescriptions/${id}/status`, { status, pharmacyNotes });
export const checkPrescriptionAvailability = (id) => 
  api.post(`/prescriptions/${id}/check-availability`);

// 11. Notifications
export const getNotifications = (params) => api.get('/notifications', { params });
export const getUnreadNotificationCount = () => api.get('/notifications/unread-count');
export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const clearAllNotifications = () => api.delete('/notifications/clear-all');

// 12. Feedback & Surveys
export const submitFeedback = (data) => api.post('/feedback', data);
export const getDoctorFeedback = () => api.get('/feedback/doctor');
export const getPatientFeedback = () => api.get('/feedback/patient');
export const getPendingFeedback = () => api.get('/feedback/pending');
export const respondToFeedback = (id, doctorResponse) => 
  api.put(`/feedback/${id}/respond`, { doctorResponse });

// 13. Pharmacy Public APIs
export const getPublicPharmacyList = () => api.get('/pharmacy/list-public');
export const getPharmacyMedicinesById = (pharmacyId) => api.get(`/pharmacy/${pharmacyId}/medicines`);

// ===== 14. AI ADVANCED FEATURES (Groq-Powered) =====

// Doctor AI Tools
export const generateClinicalNotes = (appointmentId) => api.post('/ai-advanced/clinical-notes', { appointmentId });
export const generateTreatmentPlan = (data) => api.post('/ai-advanced/treatment-plan', data);
export const generateMedicalCertificate = (data) => api.post('/ai-advanced/medical-certificate', data);
export const getAIFeedbackInsights = () => api.post('/ai-advanced/feedback-insights');

// Patient AI Tools
export const generateDietPlan = (data) => api.post('/ai-advanced/diet-plan', data);
export const triageSymptoms = (data) => api.post('/ai-advanced/symptom-triage', data);
export const getWellnessScore = () => api.get('/ai-advanced/wellness-score');
export const getAppointmentSuggestions = (data) => api.post('/ai-advanced/appointment-suggestions', data);
export const translateMedical = (data) => api.post('/ai-advanced/translate', data);

// Pharmacy AI Tools
export const suggestDrugAlternatives = (data) => api.post('/ai-advanced/drug-alternatives', data);
export const getSmartReorderSuggestions = (data) => api.post('/ai-advanced/smart-reorder', data);

// Hospital AI Tools
export const estimateTreatmentCost = (data) => api.post('/ai-advanced/cost-estimate', data);
export const generateDischargeSummary = (data) => api.post('/ai-advanced/discharge-summary', data);
export const forecastCapacity = (data) => api.post('/ai-advanced/capacity-forecast', data);

// 15. Prescription PDF
export const getPrescriptionPDFData = (prescriptionId) => api.get(`/ai-advanced/prescription-pdf/${prescriptionId}`);
export const getPatientPrescriptionsDetailed = () => api.get('/ai-advanced/patient-prescriptions-detailed');

export default api;