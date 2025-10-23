import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Languages, Loader2, ArrowLeftRight, Copy, Check, Sparkles, Volume2 } from 'lucide-react';
import { translateMedical } from '../services/api';

const MedicalTranslator = () => {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [fromLang, setFromLang] = useState('English');
    const [toLang, setToLang] = useState('Hindi');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const languages = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Spanish', 'French', 'Arabic', 'Chinese'];

    const handleTranslate = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const res = await translateMedical({ text, fromLanguage: fromLang, toLanguage: toLang });
            setResult(res.data.translation);
        } catch (err) {
            console.error('Translation error:', err);
            alert('Failed to translate. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const swapLanguages = () => {
        setFromLang(toLang);
        setToLang(fromLang);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const speakText = (textToSpeak) => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        speechSynthesis.speak(utterance);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50">
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Languages className="w-6 h-6 text-blue-600" /> Medical Translator
                        </h1>
                        <p className="text-sm text-gray-500">AI-powered medical terminology translation</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Language Selector */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <select value={fromLang} onChange={(e) => setFromLang(e.target.value)}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-blue-200 shadow-sm">
                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={swapLanguages} className="p-3 bg-blue-100 hover:bg-blue-200 rounded-xl transition">
                        <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                    </button>
                    <select value={toLang} onChange={(e) => setToLang(e.target.value)}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-blue-200 shadow-sm">
                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>

                {/* Input / Output */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-600">{fromLang}</span>
                            <button onClick={() => speakText(text)} className="p-1.5 hover:bg-gray-200 rounded-lg transition" title="Listen">
                                <Volume2 className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <textarea value={text} onChange={(e) => setText(e.target.value)}
                            placeholder="Enter medical text, prescription, report, or symptoms to translate..."
                            className="w-full p-4 h-64 resize-none text-sm outline-none" />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-blue-600">{toLang}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => speakText(result)} className="p-1.5 hover:bg-blue-100 rounded-lg transition" title="Listen">
                                    <Volume2 className="w-4 h-4 text-blue-500" />
                                </button>
                                <button onClick={copyToClipboard} className="p-1.5 hover:bg-blue-100 rounded-lg transition" title="Copy">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                                </button>
                            </div>
                        </div>
                        <div className="p-4 h-64 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                                </div>
                            ) : result ? (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
                            ) : (
                                <p className="text-sm text-gray-300 italic">Translation will appear here...</p>
                            )}
                        </div>
                    </div>
                </div>

                <button onClick={handleTranslate} disabled={loading || !text.trim()}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl font-bold text-sm
                        hover:from-blue-700 hover:to-sky-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Translating...</> : <><Sparkles className="w-5 h-5" /> Translate</>}
                </button>

                {/* Quick Examples */}
                <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-700 mb-3 text-sm">Quick Examples - Click to translate</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "Take this medicine twice daily after meals for 7 days",
                            "Blood pressure: 140/90 mmHg. Diagnosis: Stage 1 Hypertension",
                            "Apply the ointment topically on the affected area before bedtime",
                            "Fasting blood sugar level is 126 mg/dL which indicates diabetes"
                        ].map((example, i) => (
                            <button key={i} onClick={() => setText(example)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition">
                                {example}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalTranslator;


