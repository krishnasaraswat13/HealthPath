import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import StreamChatWindow from '../components/StreamChatWindow';

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
    </div>
);

const Chat = () => {
    const { doctorId } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize state with passed data (fast load) or null (need to fetch)
    const [doctor, setDoctor] = useState(location.state?.doctorData || null);
    const [loading, setLoading] = useState(!location.state?.doctorData);
    const [error, setError] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const patientId = currentUser?._id || currentUser?.id;

    // Fetch Doctor Profile (Only if we didn't get it from navigation state)
    useEffect(() => {
        if (doctor) return;

        const fetchDoctorData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/doctor/profile/${doctorId}`);
                setDoctor(response.data);
            } catch (err) {
                setError('Could not load doctor information. They may not exist or the server is down.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) {
            fetchDoctorData();
        }
    }, [doctorId, doctor]);

    const handleEndChat = () => {
        navigate('/patient/dashboard');
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate('/patient/doctors')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                    Find Another Doctor
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-gray-50 p-4">
            {doctor && patientId ? (
                <StreamChatWindow
                    partner={doctor}
                    currentUser={currentUser}
                    userType="patient"
                    doctorId={doctor._id || doctorId}
                    patientId={patientId}
                    onEndChat={handleEndChat}
                />
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Initializing secure chat environment...</p>
                 </div>
            )}
        </div>
    );
};

export default Chat;