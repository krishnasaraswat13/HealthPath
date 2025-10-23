import React, { useState, useRef, useEffect } from 'react';
import { Zap, CheckCircle, X, Command } from 'lucide-react';

const prescriptionTemplates = [
    { 
        command: '/cold', 
        name: 'Common Cold', 
        diagnosis: 'Upper Respiratory Tract Infection (Common Cold)', 
        prescription: 'Paracetamol 500mg - 1 tablet every 6 hours\nCetirizine 10mg - 1 tablet at night\nSaline nasal drops - 2 drops each nostril 3x daily\nRest and plenty of fluids'
    },
    { 
        command: '/fever', 
        name: 'Fever', 
        diagnosis: 'Viral Fever with Mild Dehydration', 
        prescription: 'Paracetamol 650mg - 1 tablet every 8 hours (if temp >100°F)\nORS solution - 1 packet in 1L water, sip frequently\nRest for 2-3 days, avoid cold drinks'
    },
    { 
        command: '/headache', 
        name: 'Headache', 
        diagnosis: 'Tension-type Headache / Migraine', 
        prescription: 'Ibuprofen 400mg - 1 tablet as needed (max 3/day)\nAmitriptyline 10mg - 1 tablet at bedtime (if recurrent)\nAvoid screen time, get adequate sleep'
    },
    { 
        command: '/gastritis', 
        name: 'Gastritis', 
        diagnosis: 'Acute Gastritis / Dyspepsia', 
        prescription: 'Pantoprazole 40mg - 1 tablet before breakfast\nDomperidone 10mg - 1 tablet before meals\nAntacid gel - 2 tsp after meals\nAvoid spicy, oily food and caffeine'
    },
    { 
        command: '/allergy', 
        name: 'Allergy', 
        diagnosis: 'Allergic Rhinitis / Skin Allergy', 
        prescription: 'Cetirizine 10mg - 1 tablet at night\nMontelukast 10mg - 1 tablet at night\nCalamine lotion - Apply on affected areas\nAvoid known allergens'
    },
    { 
        command: '/cough', 
        name: 'Cough', 
        diagnosis: 'Acute Bronchitis / Dry Cough', 
        prescription: 'Dextromethorphan syrup - 2 tsp 3x daily\nAmbroxol 30mg - 1 tablet 2x daily\nSteam inhalation - 10 mins 2x daily\nHoney with warm water at bedtime'
    },
    { 
        command: '/diarrhea', 
        name: 'Diarrhea', 
        diagnosis: 'Acute Gastroenteritis / Food Poisoning', 
        prescription: 'ORS solution - After every loose stool\nLoperamide 2mg - 1 tablet after each loose stool (max 8/day)\nProbiotics - 1 sachet 2x daily\nBRAT diet, avoid dairy'
    },
    { 
        command: '/bp', 
        name: 'Blood Pressure', 
        diagnosis: 'Hypertension Management', 
        prescription: 'Amlodipine 5mg - 1 tablet in the morning\nLow salt diet, regular exercise\nMonitor BP weekly\nFollow up in 2 weeks'
    }
];

const PrescriptionPad = ({ appointment, onComplete, onCancel }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [showCommands, setShowCommands] = useState(false);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const prescriptionRef = useRef(null);

    // Handle slash command detection
    useEffect(() => {
        const lines = prescription.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        
        if (lastLine.startsWith('/')) {
            const query = lastLine.toLowerCase();
            const filtered = prescriptionTemplates.filter(t => 
                t.command.includes(query) || t.name.toLowerCase().includes(query.slice(1))
            );
            setFilteredTemplates(filtered);
            setShowCommands(filtered.length > 0);
            setSelectedIndex(0);
        } else {
            setShowCommands(false);
        }
    }, [prescription]);

    const applyTemplate = (template) => {
        // Remove the slash command from prescription
        const lines = prescription.split('\n');
        lines.pop(); // Remove the line with /command
        const newPrescription = lines.length > 0 
            ? lines.join('\n') + '\n' + template.prescription 
            : template.prescription;
        
        setDiagnosis(template.diagnosis);
        setPrescription(newPrescription);
        setShowCommands(false);
        prescriptionRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (!showCommands) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredTemplates.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredTemplates.length > 0) {
            e.preventDefault();
            applyTemplate(filteredTemplates[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowCommands(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!diagnosis.trim() || !prescription.trim()) return;
        onComplete({ diagnosis, prescription });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Quick Templates */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" /> Quick Templates
                    </p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Command className="w-3 h-3" /> Type /command in prescription
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {prescriptionTemplates.slice(0, 6).map((template, idx) => (
                        <button 
                            key={idx}
                            type="button"
                            onClick={() => {
                                setDiagnosis(template.diagnosis);
                                setPrescription(template.prescription);
                            }}
                            className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-100 transition-colors border border-sky-100 flex items-center gap-1"
                        >
                            <span className="text-sky-400 font-mono">{template.command}</span>
                            <span className="text-gray-400">â€¢</span>
                            {template.name}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Diagnosis */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Diagnosis</label>
                <input 
                    type="text" 
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                    placeholder="Enter diagnosis..."
                />
            </div>
            
            {/* Prescription with Command Support */}
            <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Prescription
                    <span className="font-normal text-gray-400 ml-2 text-xs">
                        Type /cold, /fever, etc. for quick templates
                    </span>
                </label>
                <textarea 
                    ref={prescriptionRef}
                    required
                    rows="8"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none font-mono text-sm resize-none"
                    placeholder="Enter prescription details...&#10;&#10;Tip: Type /fever to auto-fill a fever prescription template"
                />
                
                {/* Command Autocomplete Dropdown */}
                {showCommands && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                <Command className="w-3 h-3" /> Quick Commands
                                <span className="text-gray-400 ml-auto">â†‘â†“ Navigate â€¢ Enter Select</span>
                            </p>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {filteredTemplates.map((template, idx) => (
                                <button
                                    key={template.command}
                                    type="button"
                                    onClick={() => applyTemplate(template)}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                                        idx === selectedIndex 
                                            ? 'bg-sky-50 border-l-2 border-sky-500' 
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="font-mono text-sm text-sky-600 font-bold">
                                        {template.command}
                                    </span>
                                    <span className="text-sm text-gray-700">{template.name}</span>
                                    <span className="text-xs text-gray-400 ml-auto truncate max-w-[150px]">
                                        {template.diagnosis}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button 
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </button>
                <button 
                    type="submit"
                    className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
                >
                    <CheckCircle className="w-4 h-4" />
                    Save & Complete
                </button>
            </div>
        </form>
    );
};

export default PrescriptionPad;


