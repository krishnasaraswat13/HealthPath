import React, { useState, useEffect } from 'react';
import { 
    X, 
    Calendar, 
    Clock, 
    AlertCircle,
    Loader2 
} from 'lucide-react';
import api, { bookAppointment, confirmPayment } from '../services/api'; 
import PaymentModal from './PaymentModal'; // <--- IMPORT THE SIMULATOR

const BookingModal = ({ doctor, onClose }) => {
    const [step, setStep] = useState(1); // 1: Select, 2: Payment Simulator, 3: Success
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Stores the booking ID created in Step 1, needed for confirmation in Step 2
    const [appointmentData, setAppointmentData] = useState(null); 

    // --- AVAILABILITY STATE ---
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", 
        "12:00 PM", "02:00 PM", "03:00 PM", 
        "04:00 PM", "05:00 PM", "06:00 PM"
    ];

    // --- 1. FETCH BOOKED SLOTS ---
    useEffect(() => {
        if (selectedDate && doctor._id) {
            const fetchBookedSlots = async () => {
                setLoadingSlots(true);
                try {
                    const res = await api.get('/appointments/booked-slots', {
                        params: { doctorId: doctor._id, date: selectedDate }
                    });
                    setBookedSlots(res.data); 
                } catch (err) {
                    console.error("Error fetching slots", err);
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchBookedSlots();
        } else {
            setBookedSlots([]); 
        }
    }, [selectedDate, doctor._id]);

    // --- STEP 1: CREATE PENDING APPOINTMENT ---
    const handleProceedToPayment = async () => {
        if (!selectedDate || !selectedTime) {
            setError('Please select both a date and time.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // 1. Create the appointment in DB with status "pending"
            const res = await bookAppointment({
                doctorId: doctor._id,
                date: selectedDate,
                timeSlot: selectedTime
            });

            // 2. Save the ID so we can confirm it after payment
            setAppointmentData(res.data.appointment); 
            
            // 3. Open the Payment Simulator
            setStep(2); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book slot');
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2: HANDLE SUCCESS FROM SIMULATOR ---
    // This function is passed to PaymentModal and called when the spinner finishes
    const handlePaymentSuccess = async () => {
        try {
            setLoading(true);

            // 1. Tell Backend: "User paid, mark appointment as scheduled"
            await confirmPayment({
                appointmentId: appointmentData._id,
                paymentId: `PAY_${Math.floor(Math.random() * 1000000)}` // Mock ID
            });

            // 2. Show Final Success Screen
            setStep(3); 
        } catch (err) {
            setError('Payment confirmation failed. Please contact support.');
            setStep(1); // Go back if error
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    
    // IF STEP 2: Render the Full Screen Payment Simulator
    if (step === 2) {
        return (
            <PaymentModal 
                doctor={doctor}
                date={selectedDate}
                time={selectedTime}
                price={doctor.fees}
                onClose={() => setStep(1)} // Go back to selection if closed
                onConfirm={handlePaymentSuccess} // Trigger DB update on success
            />
        );
    }

    // NORMAL MODAL (Step 1 & 3)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 p-6 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold">Book Appointment</h2>
                        <p className="text-sky-200 text-sm">with Dr. {doctor.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition relative z-10">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {error && (
                        <div className="mb-4 bg-rose-50 text-rose-700 p-4 rounded-xl flex items-center gap-2 text-sm border border-rose-100">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* --- STEP 1: SELECTION --- */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-sky-600" />
                                    Select Date
                                </label>
                                <input 
                                    type="date" 
                                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedTime('');
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-sky-600" />
                                    Select Time Slot
                                    {loadingSlots && <Loader2 className="h-3 w-3 animate-spin ml-2 text-sky-500"/>}
                                </label>
                                
                                {!selectedDate ? (
                                    <p className="text-sm text-gray-400 italic">Please select a date first.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {timeSlots.map((slot) => {
                                            const isTaken = bookedSlots.includes(slot);
                                            const isSelected = selectedTime === slot;

                                            return (
                                                <button
                                                    key={slot}
                                                    disabled={isTaken}
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`
                                                        py-2.5 px-3 text-sm rounded-xl border-2 transition-all font-medium
                                                        ${isTaken 
                                                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed line-through opacity-60 border-gray-100' 
                                                            : isSelected 
                                                                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white border-transparent shadow-lg shadow-sky-500/30 scale-105' 
                                                                : 'border-gray-200 text-gray-600 hover:border-sky-300 hover:bg-sky-50'
                                                        }
                                                    `}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500">Consultation Fee</p>
                                    <p className="text-2xl font-black text-gray-900">${doctor.fees}</p>
                                </div>
                                <button 
                                    onClick={handleProceedToPayment}
                                    disabled={loading || !selectedTime}
                                    className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white py-3.5 px-6 rounded-xl font-bold hover:shadow-xl hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Proceed to Pay
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- STEP 3: SUCCESS --- */}
                    {step === 3 && (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                             <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                 <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                 </svg>
                             </div>
                             <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                             <p className="text-gray-500 mb-8">
                                 Your appointment with Dr. {doctor.name} is scheduled for {selectedDate} at {selectedTime}.
                             </p>
                             <button 
                                 onClick={onClose}
                                 className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 text-white py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-sky-500/30 transition-all"
                             >
                                 Done
                             </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default BookingModal;
