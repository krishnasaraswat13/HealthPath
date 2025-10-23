import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';

// --- EXISTING PAGES ---
import HomePage from './pages/HomePage';
import UnifiedLogin from './pages/UnifiedLogin';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboardNew';
import PatientLogin from './pages/PatientLogin';
import PatientRegister from './pages/PatientRegister';
import PatientDashboard from './pages/PatientDashboard';
import FindDoctors from './pages/FindDoctors';
import ReportAnalysis from './pages/ReportAnalysis';
import MapPage from './pages/MapPage';
import Chat from './pages/chat';
import PharmacyLogin from './pages/PharmacyLogin';
import PharmacyRegister from './pages/PharmacyRegister';
import PharmacyDashboard from './pages/PharmacyDashboard';

// --- CORE FEATURE PAGES ---
import MedicalHistory from './pages/MedicalHistory';
import PharmacyCatalog from './pages/PharmacyCatalog';
import AIHealthAssistant from './pages/AIHealthAssistant'; 
import MedicalReportDecoder from './pages/MedicalReportDecoder';
import HospitalLogin from './pages/HospitalLogin';
import HospitalRegister from './pages/HospitalRegister';
import HospitalDashboard from './pages/HospitalDashboard';

// --- REAL-WORLD FEATURES ---
import SymptomJournal from './pages/SymptomJournal';
import EmergencySOS from './pages/EmergencySOS';
import MedicineInteractionChecker from './pages/MedicineInteractionChecker';
import HealthGoals from './pages/HealthGoals';
import EmergencyFinder from './pages/EmergencyFinder';
import VideoCallPage from './pages/VideoCallPage';

// --- NEW AI-POWERED FEATURE PAGES ---
import PatientPrescriptionsPage from './pages/PatientPrescriptionsPage';
import SymptomTriage from './pages/SymptomTriage';
import AIDietPlanner from './pages/AIDietPlanner';
import WellnessScore from './pages/WellnessScore';
import MedicalTranslator from './pages/MedicalTranslator';
import DoctorPharmacy from './pages/DoctorPharmacy';
import HealthAnalytics from './pages/HealthAnalytics';
import PatientFeedback from './pages/PatientFeedback';


const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }
    
    if (!token || !user || user.role !== role) {
        localStorage.clear();
        return <Navigate to="/" />;
    }
    return children;
};

// Protected route for multiple roles (e.g., doctor OR patient)
const MultiRoleProtectedRoute = ({ children, roles }) => {
    const token = localStorage.getItem('token');
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }
    
    if (!token || !user || !roles.includes(user.role)) {
        localStorage.clear();
        return <Navigate to="/" />;
    }
    return children;
};

const App = () => {
    return (
        <Router>
            <SocketProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    
                    {/* Unified Login Route */}
                    <Route path="/login" element={<UnifiedLogin />} />
                    
                    {/* Doctor Routes */}
                    <Route path="/doctor/login" element={<DoctorLogin />} />
                    <Route path="/doctor/register" element={<DoctorRegister />} />
                    <Route path="/doctor/dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
                    <Route path="/doctor/pharmacy" element={<ProtectedRoute role="doctor"><DoctorPharmacy /></ProtectedRoute>} />
                    
                    {/* Patient Routes */}
                    <Route path="/patient/login" element={<PatientLogin />} />
                    <Route path="/patient/register" element={<PatientRegister />} />
                    <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
                    <Route path="/patient/doctors" element={<ProtectedRoute role="patient"><FindDoctors /></ProtectedRoute>} />
                    
                    {/* YOUR ML MODEL (Existing) */}
                    <Route path="/patient/report-analysis" element={<ProtectedRoute role="patient"><ReportAnalysis /></ProtectedRoute>} />
                    
                    {/* NEW AI DECODER (Generative AI) - ADDED THIS LINE */}
                    <Route path="/patient/report-decoder" element={<ProtectedRoute role="patient"><MedicalReportDecoder /></ProtectedRoute>} />

                    <Route path="/patient/map" element={<ProtectedRoute role="patient"><MapPage /></ProtectedRoute>} />
                    <Route path="/patient/chat/:doctorId" element={<ProtectedRoute role="patient"><Chat /></ProtectedRoute>} />
                    
                    {/* --- NEW ROUTES FOR MEDICAL HISTORY & PHARMACY CATALOG & AI --- */}
                    <Route path="/patient/medical-history" element={<ProtectedRoute role="patient"><MedicalHistory /></ProtectedRoute>} />
                    <Route path="/patient/pharmacy-catalog" element={<ProtectedRoute role="patient"><PharmacyCatalog /></ProtectedRoute>} />
                    
                    {/* --- ADDED AI ASSISTANT ROUTE --- */}
                    <Route path="/patient/ai-assistant" element={<ProtectedRoute role="patient"><AIHealthAssistant /></ProtectedRoute>} />
                    
                    {/* --- REAL-WORLD FEATURE ROUTES --- */}
                    <Route path="/patient/symptom-journal" element={<ProtectedRoute role="patient"><SymptomJournal /></ProtectedRoute>} />
                    <Route path="/patient/emergency" element={<ProtectedRoute role="patient"><EmergencySOS /></ProtectedRoute>} />
                    <Route path="/patient/medicine-checker" element={<ProtectedRoute role="patient"><MedicineInteractionChecker /></ProtectedRoute>} />
                    <Route path="/patient/health-goals" element={<ProtectedRoute role="patient"><HealthGoals /></ProtectedRoute>} />
                    <Route path="/patient/emergency-finder" element={<ProtectedRoute role="patient"><EmergencyFinder /></ProtectedRoute>} />
                    <Route path="/patient/health-analytics" element={<ProtectedRoute role="patient"><HealthAnalytics /></ProtectedRoute>} />
                    <Route path="/patient/feedback" element={<ProtectedRoute role="patient"><PatientFeedback /></ProtectedRoute>} />
                    
                    {/* --- NEW AI-POWERED FEATURE ROUTES --- */}
                    <Route path="/patient/prescriptions" element={<ProtectedRoute role="patient"><PatientPrescriptionsPage /></ProtectedRoute>} />
                    <Route path="/patient/symptom-triage" element={<ProtectedRoute role="patient"><SymptomTriage /></ProtectedRoute>} />
                    <Route path="/patient/diet-planner" element={<ProtectedRoute role="patient"><AIDietPlanner /></ProtectedRoute>} />
                    <Route path="/patient/wellness-score" element={<ProtectedRoute role="patient"><WellnessScore /></ProtectedRoute>} />
                    <Route path="/patient/medical-translator" element={<ProtectedRoute role="patient"><MedicalTranslator /></ProtectedRoute>} />
                    
                    {/* --- VIDEO CALL ROUTE (Doctor & Patient) --- */}
                    <Route path="/video-call/:appointmentId" element={<MultiRoleProtectedRoute roles={['doctor', 'patient']}><VideoCallPage /></MultiRoleProtectedRoute>} />
                    
                    {/* Pharmacy Routes */}
                    <Route path="/pharmacy/login" element={<PharmacyLogin />} />
                    <Route path="/pharmacy/register" element={<PharmacyRegister />} />
                    <Route path="/pharmacy/dashboard" element={<ProtectedRoute role="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />

                    {/* Hospital Routes */}
                    <Route path="/hospital/login" element={<HospitalLogin />} />
                    <Route path="/hospital/register" element={<HospitalRegister />} />
                    <Route path="/hospital/dashboard" element={<ProtectedRoute role="hospital"><HospitalDashboard /></ProtectedRoute>} />

                    <Route path="*" element={<h1 className='text-4xl text-center pt-20 font-bold text-red-500'>404 | Page Not Found</h1>} />
                </Routes>
            </SocketProvider>
        </Router>
    );
};

export default App;