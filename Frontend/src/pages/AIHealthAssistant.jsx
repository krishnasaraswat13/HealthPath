import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Send, MapPin, Building2, Pill as PillIcon, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import api from '../services/api'; 

const AIHealthAssistant = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState(""); 
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAIQuery = async () => {
        if (!prompt.trim()) return;

        const userMessage = { role: "user", content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setPrompt(""); 
        setLoading(true);

        try {
            const response = await api.post('/ai/ask', 
                { prompt: userMessage.content }
            );
            
            if (response.data && response.data.success) {
                setMessages(prev => [...prev, { role: "assistant", content: response.data.response }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: "assistant", 
                    content: response.data.message || "I apologize, but I encountered an error. Please try again." 
                }]);
            }
        } catch (error) {
            console.error('API Error:', error);
            const errorMessage = error.response?.data?.message || "I'm having trouble connecting. Please check your internet.";
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: errorMessage
            }]);
        } finally {
            setLoading(false);
        }
    };

    const findNearbyPlaces = async (type) => {
        setMapLoading(true);
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            setMapLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const token = localStorage.getItem('token');
                    
                    const response = await fetch(`${apiUrl}/api/maps/nearby`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'auth-token': token },
                        body: JSON.stringify({ latitude, longitude, type })
                    });

                    const data = await response.json();
                    if (response.ok && data.success && data.places.length > 0) {
                        initializeMap(latitude, longitude, data.places, type);
                    } else {
                        alert(data.message || 'No facilities found nearby.');
                        initializeMap(latitude, longitude, [], type);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while fetching nearby places.');
                } finally {
                    setMapLoading(false);
                }
            },
            (error) => {
                alert('Please enable location services.');
                setMapLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const initializeMap = (lat, lng, places, type) => {
        if (!window.google || !mapRef.current) return;

        try {
            if (!mapInstance.current) {
                mapInstance.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat, lng },
                    zoom: 13,
                    styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] }]
                });
            } else {
                mapInstance.current.setCenter({ lat, lng });
            }

            // User location marker
            new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstance.current,
                title: "You are here",
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4F46E5",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3
                },
                zIndex: 1000
            });

            // Places markers
            places.forEach((place, index) => {
                const marker = new window.google.maps.Marker({
                    position: { lat: place.lat, lng: place.lng },
                    map: mapInstance.current,
                    title: place.name,
                    animation: window.google.maps.Animation.DROP,
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `<div style="padding:8px"><b>${place.name}</b><br/>${place.address}</div>`
                });

                marker.addListener('click', () => infoWindow.open(mapInstance.current, marker));
            });

            if (places.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend({ lat, lng });
                places.forEach(place => bounds.extend({ lat: place.lat, lng: place.lng }));
                mapInstance.current.fitBounds(bounds);
            }
        } catch (error) {
            console.error('Map error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30 p-6 md:p-10">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-sky-500/5 rounded-2xl border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/patient/dashboard')} className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl shadow-lg shadow-sky-500/30">
                            <Brain className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">AI Health Assistant</h1>
                            <p className="text-gray-500 text-sm">Powered by HealthPath Intelligence</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat Section */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-sky-500/5 overflow-hidden flex flex-col h-[600px] border border-gray-100">
                    <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 p-5 text-white flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <h2 className="text-lg font-bold flex items-center gap-2 relative z-10">
                            <Sparkles className="h-5 w-5" /> Chat with AI
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl flex items-center justify-center">
                                    <Brain className="w-10 h-10 text-sky-300" />
                                </div>
                                <p className="max-w-sm">Ask me anything about symptoms, medicines, or healthy living!</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-br-none shadow-lg shadow-sky-500/20' 
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
                                placeholder="E.g., What are the symptoms of flu?"
                                className="flex-1 px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                                disabled={loading}
                            />
                            <button
                                onClick={handleAIQuery}
                                disabled={loading || !prompt.trim()}
                                className="px-6 py-3.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:shadow-sky-500/30 transition-all disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg shadow-sky-500/20"
                            >
                                <Send className="w-4 h-4" /> Send
                            </button>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-3">
                            AI can make mistakes. Always consult a doctor for serious concerns.
                        </p>
                    </div>
                </div>

                {/* Map Buttons Section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-sky-500/5 p-6 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="text-sky-600" /> Find Nearby
                        </h2>
                        <div className="space-y-3">
                            <button onClick={() => findNearbyPlaces('hospital')} disabled={mapLoading} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 font-bold">
                                {mapLoading ? <Loader2 className="animate-spin" /> : <Building2 />} Find Hospitals
                            </button>
                            <button onClick={() => findNearbyPlaces('pharmacy')} disabled={mapLoading} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 font-bold">
                                {mapLoading ? <Loader2 className="animate-spin" /> : <PillIcon />} Find Pharmacies
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-sky-500/5 overflow-hidden h-64 relative border border-gray-100">
                        <div ref={mapRef} className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                            {!mapInstance.current && <p className="text-sm">Map will appear here</p>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIHealthAssistant;

