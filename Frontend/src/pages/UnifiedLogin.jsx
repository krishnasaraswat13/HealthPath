import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Heart, Pill, Building2, Mail, Lock, ArrowRight, ArrowLeft, HeartPulse, Eye, EyeOff, Shield, Zap, Video, Brain } from 'lucide-react';

const UnifiedLogin = () => {
  const [userType, setUserType] = useState('patient');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const userTypes = {
    patient: {
      title: 'Patient',
      description: 'Access your health dashboard',
      icon: Heart,
      endpoint: '/patient/login',
      redirectPath: '/patient/dashboard',
      dataKey: 'patient',
      gradient: 'from-teal-500 to-emerald-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      borderColor: 'border-teal-500',
    },
    doctor: {
      title: 'Doctor',
      description: 'Manage your practice',
      icon: Stethoscope,
      endpoint: '/doctor/login',
      redirectPath: '/doctor/dashboard',
      dataKey: 'doctor',
      gradient: 'from-sky-500 to-cyan-500',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-600',
      borderColor: 'border-sky-500',
    },
    pharmacy: {
      title: 'Pharmacy',
      description: 'Manage inventory & orders',
      icon: Pill,
      endpoint: '/pharmacy/login',
      redirectPath: '/pharmacy/dashboard',
      dataKey: 'pharmacy',
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-500',
    },
    hospital: {
      title: 'Hospital',
      description: 'Facility management',
      icon: Building2,
      endpoint: '/hospital-auth/login',
      redirectPath: '/hospital/dashboard',
      dataKey: 'hospital',
      gradient: 'from-rose-500 to-pink-500',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-500',
    },
  };

  const currentType = userTypes[userType];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post(currentType.endpoint, formData);
      const userObj = { ...res.data[currentType.dataKey], role: userType };

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userObj));

      navigate(currentType.redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HeartPulse className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">HealthPath</span>
          </div>
          
          {/* Main Content */}
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Welcome to<br />
            <span className="text-sky-200">HealthPath Access</span>
          </h1>
          <p className="text-xl text-sky-100 max-w-md leading-relaxed">
            Sign in to your role-specific workspace and continue care operations without interruptions.
          </p>
        </div>

        {/* Features */}
        <div className="relative grid grid-cols-2 gap-6">
          {[
            { icon: Shield, text: 'Secure & Private' },
            { icon: Zap, text: 'Live Updates' },
            { icon: Video, text: 'Video Consults' },
            { icon: Brain, text: 'Smart Insights' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <item.icon className="w-5 h-5 text-white" />
              <span className="text-white font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-sky-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
              HealthPath
            </span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-500">Choose your portal and enter your credentials</p>
          </div>

          {/* Portal Selector */}
          <div className="grid grid-cols-4 gap-2 mb-8 p-1 bg-gray-100 rounded-2xl">
            {Object.entries(userTypes).map(([key, type]) => {
              const Icon = type.icon;
              const isActive = userType === key;
              return (
                <button
                  key={key}
                  onClick={() => { setUserType(key); setError(''); }}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg` 
                      : 'text-gray-500 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span className="text-xs font-semibold">{type.title}</span>
                </button>
              );
            })}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-300 bg-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-300 bg-white"
                  placeholder="Enter your password"
                  required
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a href="#" className="text-sm text-sky-600 hover:text-sky-700 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-gradient-to-r ${currentType.gradient} text-white font-bold rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In as {currentType.title}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to HealthPath?</span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              to={`/${userType}/register`}
              className="w-full py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center gap-2"
            >
              Create {currentType.title} Account
            </Link>

            {/* Back to Home */}
            <Link
              to="/"
              className="w-full py-3 text-gray-500 font-medium transition-colors hover:text-sky-600 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;


