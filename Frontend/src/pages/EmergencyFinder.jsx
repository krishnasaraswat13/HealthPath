import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, MapPin, Navigation, Search, Building2, Droplets, Bed, 
    Activity, Phone, Clock, AlertTriangle, Heart, Filter,
    ChevronRight, X, Loader2, Shield, Zap, RefreshCw, Star, Check,
    Stethoscope, Baby, Brain, Flame, Siren, Truck, Wind
} from 'lucide-react';
import api from '../services/api';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const LIBRARIES = ["places"];

const EmergencyFinder = () => {
    const navigate = useNavigate();
    const [userCoords, setUserCoords] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [filteredHospitals, setFilteredHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [hospitalDetails, setHospitalDetails] = useState(null);
    const [directions, setDirections] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    
    // Filters
    const [activeTab, setActiveTab] = useState('all'); // all, blood, beds, equipment
    const [bloodTypeFilter, setBloodTypeFilter] = useState('');
    const [bedTypeFilter, setBedTypeFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // Emergency Request Modal
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        requestType: 'Blood',
        patientName: '',
        contactNumber: '',
        bloodType: '',
        bedType: '',
        urgency: 'Normal',
        notes: ''
    });

    const token = localStorage.getItem('token');

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bedTypes = ['General', 'ICU', 'NICU', 'PICU', 'CCU', 'Emergency', 'Maternity', 'Pediatric', 'Isolation'];
    
    const specialServiceIcons = {
        'Trauma Center': Flame,
        'Burn Unit': Flame,
        'Cardiac Emergency': Heart,
        'Stroke Center': Brain,
        'Pediatric Emergency': Baby,
        'Maternity Emergency': Baby,
        'Dialysis': Activity,
        'Organ Transplant': Heart
    };

    // Get user location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    console.error("Location error:", err);
                    // Default to a location if geolocation fails
                    setUserCoords({ lat: 28.6139, lng: 77.209 });
                }
            );
        }
    }, []);

    // Fetch nearby hospitals
    const fetchNearbyHospitals = useCallback(async () => {
        if (!userCoords) return;
        
        setSearchLoading(true);
        try {
            const response = await api.get('/emergency/nearby', {
                params: {
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    maxDistance: 50
                }
            });
            setHospitals(response.data);
            setFilteredHospitals(response.data);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    }, [userCoords]);

    useEffect(() => {
        if (userCoords) {
            fetchNearbyHospitals();
        }
    }, [userCoords, fetchNearbyHospitals]);

    // Search blood availability
    const searchBlood = async (bloodType) => {
        if (!bloodType || !userCoords) return;
        
        setSearchLoading(true);
        try {
            const response = await api.get(`/emergency/search/blood/${bloodType}`, {
                params: { lat: userCoords.lat, lng: userCoords.lng }
            });
            setFilteredHospitals(response.data);
        } catch (error) {
            console.error('Error searching blood:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Search bed availability
    const searchBeds = async (bedType) => {
        if (!bedType || !userCoords) return;
        
        setSearchLoading(true);
        try {
            const response = await api.get(`/emergency/search/beds/${bedType}`, {
                params: { lat: userCoords.lat, lng: userCoords.lng }
            });
            setFilteredHospitals(response.data);
        } catch (error) {
            console.error('Error searching beds:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Get hospital details
    const fetchHospitalDetails = async (hospitalId) => {
        try {
            const response = await api.get(`/emergency/hospital/${hospitalId}/details`);
            setHospitalDetails(response.data);
        } catch (error) {
            console.error('Error fetching hospital details:', error);
        }
    };

    // Calculate route to hospital
    const calculateRoute = async (hospital) => {
        if (!window.google || !userCoords || !hospital.location?.coordinates) return;

        const directionsService = new window.google.maps.DirectionsService();
        
        try {
            const result = await directionsService.route({
                origin: new window.google.maps.LatLng(userCoords.lat, userCoords.lng),
                destination: new window.google.maps.LatLng(
                    hospital.location.coordinates[1],
                    hospital.location.coordinates[0]
                ),
                travelMode: window.google.maps.TravelMode.DRIVING,
            });
            setDirections(result);
        } catch (error) {
            console.error("Route error:", error);
        }
    };

    // Handle hospital selection
    const handleHospitalSelect = (hospital) => {
        setSelectedHospital(hospital);
        fetchHospitalDetails(hospital._id || hospital.hospitalId);
        calculateRoute(hospital);
    };

    // Submit emergency request
    const submitEmergencyRequest = async () => {
        if (!selectedHospital || !token) return;
        
        try {
            await api.post('/emergency/request', {
                ...requestForm,
                hospitalId: selectedHospital._id || selectedHospital.hospitalId
            });
            
            alert('Emergency request submitted successfully! The hospital will contact you shortly.');
            setShowRequestModal(false);
            setRequestForm({
                requestType: 'Blood',
                patientName: '',
                contactNumber: '',
                bloodType: '',
                bedType: '',
                urgency: 'Normal',
                notes: ''
            });
        } catch (error) {
            alert('Failed to submit request. Please try again.');
        }
    };

    // Filter handlers
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setBloodTypeFilter('');
        setBedTypeFilter('');
        setDirections(null);
        
        if (tab === 'all') {
            setFilteredHospitals(hospitals);
        }
    };

    const handleBloodSearch = (type) => {
        setBloodTypeFilter(type);
        searchBlood(type);
    };

    const handleBedSearch = (type) => {
        setBedTypeFilter(type);
        searchBeds(type);
    };

    // Emergency SOS - Find nearest hospital
    const handleEmergencySOS = () => {
        if (filteredHospitals.length > 0) {
            const nearest = filteredHospitals[0];
            handleHospitalSelect(nearest);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
            {/* Header */}
            <header className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 shadow-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <Siren className="w-7 h-7" />
                                    Emergency Services
                                </h1>
                                <p className="text-red-100 text-sm">Find hospitals, blood banks & emergency care</p>
                            </div>
                        </div>
                        
                        {/* Emergency SOS Button */}
                        <button
                            onClick={handleEmergencySOS}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all animate-pulse"
                        >
                            <AlertTriangle className="w-5 h-5" />
                            SOS - Nearest Hospital
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {/* Quick Filter Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        {[
                            { id: 'all', label: 'All Hospitals', icon: Building2 },
                            { id: 'blood', label: 'Blood Banks', icon: Droplets },
                            { id: 'beds', label: 'Bed Availability', icon: Bed },
                            { id: 'equipment', label: 'Equipment', icon: Activity },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                        
                        <button
                            onClick={fetchNearbyHospitals}
                            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${searchLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Blood Type Filter */}
                    {activeTab === 'blood' && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-sm text-slate-500 mb-3">Select Blood Type:</p>
                            <div className="flex flex-wrap gap-2">
                                {bloodTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleBloodSearch(type)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                            bloodTypeFilter === type
                                                ? 'bg-red-600 text-white'
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bed Type Filter */}
                    {activeTab === 'beds' && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-sm text-slate-500 mb-3">Select Bed Type:</p>
                            <div className="flex flex-wrap gap-2">
                                {bedTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleBedSearch(type)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                            bedTypeFilter === type
                                                ? 'bg-sky-600 text-white'
                                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Map Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[500px] lg:h-[600px]">
                        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES} onLoad={() => setMapLoaded(true)}>
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={userCoords || { lat: 28.6139, lng: 77.209 }}
                                zoom={12}
                            >
                                {/* User Location Marker */}
                                {userCoords && (
                                    <Marker
                                        position={userCoords}
                                        icon={{
                                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                                    <circle cx="20" cy="20" r="15" fill="#3B82F6" stroke="white" stroke-width="3"/>
                                                    <circle cx="20" cy="20" r="6" fill="white"/>
                                                </svg>
                                            `),
                                            scaledSize: new window.google.maps.Size(40, 40)
                                        }}
                                        title="Your Location"
                                    />
                                )}

                                {/* Hospital Markers */}
                                {filteredHospitals.map((hospital, idx) => (
                                    hospital.location?.coordinates && (
                                        <Marker
                                            key={hospital._id || idx}
                                            position={{
                                                lat: hospital.location.coordinates[1],
                                                lng: hospital.location.coordinates[0]
                                            }}
                                            onClick={() => handleHospitalSelect(hospital)}
                                            icon={{
                                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                                                        <circle cx="18" cy="18" r="16" fill="${hospital.hasBloodBank ? '#DC2626' : '#059669'}" stroke="white" stroke-width="2"/>
                                                        <text x="18" y="24" text-anchor="middle" fill="white" font-size="16" font-weight="bold">H</text>
                                                    </svg>
                                                `),
                                                scaledSize: new window.google.maps.Size(36, 36)
                                            }}
                                        />
                                    )
                                ))}

                                {/* Directions */}
                                {directions && <DirectionsRenderer directions={directions} />}

                                {/* Info Window for Selected Hospital */}
                                {selectedHospital && selectedHospital.location?.coordinates && (
                                    <InfoWindow
                                        position={{
                                            lat: selectedHospital.location.coordinates[1],
                                            lng: selectedHospital.location.coordinates[0]
                                        }}
                                        onCloseClick={() => setSelectedHospital(null)}
                                    >
                                        <div className="p-2 max-w-[200px]">
                                            <h3 className="font-bold text-slate-900">{selectedHospital.name}</h3>
                                            <p className="text-sm text-slate-600 mb-2">{selectedHospital.address}</p>
                                            {selectedHospital.distance && (
                                                <p className="text-sm font-semibold text-sky-600">
                                                    {selectedHospital.distance} km away
                                                </p>
                                            )}
                                            {selectedHospital.phone && (
                                                <a 
                                                    href={`tel:${selectedHospital.phone}`}
                                                    className="text-sm text-red-600 font-medium flex items-center gap-1 mt-1"
                                                >
                                                    <Phone className="w-3 h-3" /> {selectedHospital.phone}
                                                </a>
                                            )}
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMap>
                        </LoadScript>
                    </div>

                    {/* Hospital List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                            </div>
                        ) : filteredHospitals.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No hospitals found matching your criteria</p>
                            </div>
                        ) : (
                            filteredHospitals.map((hospital, idx) => (
                                <div
                                    key={hospital._id || idx}
                                    onClick={() => handleHospitalSelect(hospital)}
                                    className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                                        selectedHospital?._id === hospital._id || selectedHospital?.hospitalId === hospital.hospitalId
                                            ? 'border-red-500 shadow-lg shadow-red-100'
                                            : 'border-slate-100 hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{hospital.name}</h3>
                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {hospital.address || 'Address not available'}
                                            </p>
                                        </div>
                                        {hospital.distance && (
                                            <span className="px-3 py-1 bg-sky-100 text-sky-700 text-sm font-semibold rounded-full">
                                                {hospital.distance} km
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {hospital.availableBeds !== undefined && (
                                            <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                                <Bed className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                                <p className="text-lg font-bold text-emerald-700">{hospital.availableBeds}</p>
                                                <p className="text-xs text-emerald-600">Beds</p>
                                            </div>
                                        )}
                                        {hospital.icuAvailable !== undefined && (
                                            <div className="bg-cyan-50 rounded-xl p-3 text-center">
                                                <Activity className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                                                <p className="text-lg font-bold text-cyan-700">{hospital.icuAvailable}</p>
                                                <p className="text-xs text-cyan-600">ICU</p>
                                            </div>
                                        )}
                                        {hospital.hasBloodBank && (
                                            <div className="bg-red-50 rounded-xl p-3 text-center">
                                                <Droplets className="w-5 h-5 text-red-600 mx-auto mb-1" />
                                                <p className="text-sm font-bold text-red-700">Available</p>
                                                <p className="text-xs text-red-600">Blood Bank</p>
                                            </div>
                                        )}
                                        {hospital.ventilatorAvailable > 0 && (
                                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                                                <Wind className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                                <p className="text-lg font-bold text-blue-700">{hospital.ventilatorAvailable}</p>
                                                <p className="text-xs text-blue-600">Ventilators</p>
                                            </div>
                                        )}
                                        {/* Blood units if searching for blood */}
                                        {hospital.unitsAvailable !== undefined && (
                                            <div className="bg-red-50 rounded-xl p-3 text-center col-span-2">
                                                <Droplets className="w-5 h-5 text-red-600 mx-auto mb-1" />
                                                <p className="text-lg font-bold text-red-700">{hospital.unitsAvailable} units</p>
                                                <p className="text-xs text-red-600">{hospital.bloodType} Available</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {hospital.is24x7 && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> 24/7
                                            </span>
                                        )}
                                        {hospital.specialServices?.slice(0, 3).map((service, i) => {
                                            const ServiceIcon = specialServiceIcons[service] || Shield;
                                            return (
                                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1">
                                                    <ServiceIcon className="w-3 h-3" />
                                                    {service}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        {hospital.phone && (
                                            <a
                                                href={`tel:${hospital.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                                            >
                                                <Phone className="w-4 h-4" /> Call Now
                                            </a>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedHospital(hospital);
                                                setShowRequestModal(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                                        >
                                            <AlertTriangle className="w-4 h-4" /> Request
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Route Info */}
                {directions && (
                    <div className="mt-6 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Navigation className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Route to {selectedHospital?.name}</h3>
                                    <p className="text-sky-100">
                                        {directions.routes[0]?.legs[0]?.distance?.text} â€¢ {directions.routes[0]?.legs[0]?.duration?.text}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const dest = selectedHospital.location.coordinates;
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest[1]},${dest[0]}`, '_blank');
                                }}
                                className="px-6 py-3 bg-white text-sky-600 font-bold rounded-xl hover:shadow-lg transition-all"
                            >
                                Open in Google Maps
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Emergency Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900">Emergency Request</h2>
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                Requesting from: <span className="font-semibold">{selectedHospital?.name}</span>
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Request Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Request Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Blood', 'Bed', 'Ambulance'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setRequestForm(prev => ({ ...prev, requestType: type }))}
                                            className={`py-2 px-4 rounded-xl font-medium transition-all ${
                                                requestForm.requestType === type
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Patient Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Patient Name</label>
                                <input
                                    type="text"
                                    value={requestForm.patientName}
                                    onChange={(e) => setRequestForm(prev => ({ ...prev, patientName: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none"
                                    placeholder="Enter patient name"
                                />
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                                <input
                                    type="tel"
                                    value={requestForm.contactNumber}
                                    onChange={(e) => setRequestForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none"
                                    placeholder="Enter contact number"
                                />
                            </div>

                            {/* Blood Type (if blood request) */}
                            {requestForm.requestType === 'Blood' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Blood Type Required</label>
                                    <div className="flex flex-wrap gap-2">
                                        {bloodTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setRequestForm(prev => ({ ...prev, bloodType: type }))}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                                    requestForm.bloodType === type
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bed Type (if bed request) */}
                            {requestForm.requestType === 'Bed' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Bed Type Required</label>
                                    <select
                                        value={requestForm.bedType}
                                        onChange={(e) => setRequestForm(prev => ({ ...prev, bedType: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 outline-none"
                                    >
                                        <option value="">Select bed type</option>
                                        {bedTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Urgency */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Urgency Level</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { level: 'Normal', active: 'bg-green-600 text-white', inactive: 'bg-green-50 text-green-600 hover:bg-green-100' },
                                        { level: 'Urgent', active: 'bg-amber-600 text-white', inactive: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
                                        { level: 'Critical', active: 'bg-red-600 text-white', inactive: 'bg-red-50 text-red-600 hover:bg-red-100' }
                                    ].map(({ level, active, inactive }) => (
                                        <button
                                            key={level}
                                            onClick={() => setRequestForm(prev => ({ ...prev, urgency: level }))}
                                            className={`py-2 px-4 rounded-xl font-medium transition-all ${
                                                requestForm.urgency === level ? active : inactive
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
                                <textarea
                                    value={requestForm.notes}
                                    onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none resize-none"
                                    rows={3}
                                    placeholder="Any additional information..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-3xl">
                            <button
                                onClick={submitEmergencyRequest}
                                disabled={!requestForm.patientName || !requestForm.contactNumber}
                                className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                <Siren className="w-5 h-5" />
                                Submit Emergency Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyFinder;

