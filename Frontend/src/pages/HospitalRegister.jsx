import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, Mail, MapPin, Phone, Bed, Activity, Users, Shield, Heart, Eye, EyeOff, Loader2, ArrowLeft, Check, Navigation } from 'lucide-react';
import api from '../services/api';

const HospitalRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        address: '',
        phone: '',
        latitude: 28.6139,
        longitude: 77.209,
        beds: 0,
        emergencyServices: false
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const getCurrentLocation = () => {
        if ('geolocation' in navigator) {
            setGettingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }));
                    setGettingLocation(false);
                },
                (err) => {
                    setError('Unable to get location. Please enter manually.');
                    setGettingLocation(false);
                }
            );
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/hospital-auth/register', formData);

            // Store token and user info
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: response.data.hospital.id,
                name: response.data.hospital.name,
                email: response.data.hospital.email,
                role: 'hospital'
            }));

            navigate('/hospital/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        { icon: Users, title: 'Patient Connectivity', desc: 'Connect with patients seeking quality healthcare' },
        { icon: Activity, title: 'Route Finder', desc: 'Help patients find your hospital easily on maps' },
        { icon: Heart, title: 'Service Catalog', desc: 'Showcase your services and transparent pricing' },
        { icon: Shield, title: 'Verified Status', desc: 'Build trust with verified hospital badge' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50 flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 p-12 flex-col justify-between relative overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                
                {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-3 mb-12 group">
                        <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">HealthPath</span>
                    </Link>

                    <h1 className="text-4xl font-bold text-white mb-4">
                        Register Your Hospital
                    </h1>
                    <p className="text-rose-100 text-lg mb-12">
                        Join our network and help patients find quality healthcare in their time of need.
                    </p>

                    <div className="space-y-6">
                        {benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <benefit.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">{benefit.title}</h3>
                                    <p className="text-rose-100 text-sm">{benefit.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4 pt-8 border-t border-white/20">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white/30 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                        ))}
                    </div>
                    <p className="text-rose-100 text-sm">Join <span className="text-white font-semibold">100+</span> hospitals on our platform</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-lg">
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-11 h-11 bg-gradient-to-br from-rose-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                            HealthPath
                        </span>
                    </div>

                    {/* Back Link */}
                    <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to login</span>
                    </Link>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Hospital Registration</h2>
                        <p className="text-gray-500">Register your hospital with HealthPath</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-red-600 text-xs">!</span>
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Hospital Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                    placeholder="Hospital Name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                        placeholder="hospital@example.com"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                    placeholder="Minimum 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none resize-none"
                                    placeholder="Hospital address"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                                <input
                                    type="number"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    step="0.0001"
                                    required
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                                <input
                                    type="number"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    step="0.0001"
                                    required
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={gettingLocation}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            {gettingLocation ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Navigation className="w-4 h-4" />
                            )}
                            {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Beds */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Beds</label>
                                <div className="relative">
                                    <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        name="beds"
                                        value={formData.beds}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Emergency Services */}
                            <div className="flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer mt-6">
                                    <input
                                        type="checkbox"
                                        name="emergencyServices"
                                        checked={formData.emergencyServices}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-rose-600 rounded-lg focus:ring-2 focus:ring-rose-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Emergency Services</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <Building2 className="w-5 h-5" />
                                    Register Hospital
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-gray-500">
                        Already have an account?{' '}
                        <Link to="/hospital/login" className="text-rose-600 hover:text-rose-700 font-semibold">
                            Sign in
                        </Link>
                    </p>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Verified Hospitals</span>
                        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Secure Platform</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalRegister;

