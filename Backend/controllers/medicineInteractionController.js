/**
 * Medicine Interaction Controller
 * AI-powered drug interaction warning system
 */

const Groq = require("groq-sdk");
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// @desc    Check medicine interactions
// @route   POST /api/medicine/interaction-check
// @access  Private (Patient)
exports.checkInteraction = asyncHandler(async (req, res) => {
    const { medicines, conditions } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
        throw new ValidationError('Please provide at least 2 medicines to check for interactions');
    }

    const medicineList = medicines.join(', ');
    const conditionList = conditions?.length > 0 ? conditions.join(', ') : 'None specified';

    const prompt = `
You are a pharmaceutical expert. Analyze the following medicines for potential drug interactions.

Medicines: ${medicineList}
Patient Conditions: ${conditionList}

Please provide a structured analysis:

1. **INTERACTION RISK LEVEL**: (None / Mild / Moderate / Severe / Critical)

2. **KNOWN INTERACTIONS**:
   - List any direct interactions between the medicines
   - Explain the effect of each interaction

3. **WARNINGS**:
   - Special precautions
   - Timing considerations (take together/separate)
   - Foods to avoid

4. **RECOMMENDATIONS**:
   - Safe to take together or not
   - Suggested alternatives if needed
   - When to consult a doctor

Keep the response concise but thorough. This is for educational purposes only - always consult a healthcare provider.
`;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a knowledgeable pharmacist providing drug interaction information. Be accurate, helpful, and always recommend consulting a healthcare provider for serious concerns."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: 1000
    });

    const analysis = completion.choices[0]?.message?.content || "Unable to analyze interactions.";

    // Parse risk level from response
    let riskLevel = 'unknown';
    if (analysis.toLowerCase().includes('critical')) riskLevel = 'critical';
    else if (analysis.toLowerCase().includes('severe')) riskLevel = 'severe';
    else if (analysis.toLowerCase().includes('moderate')) riskLevel = 'moderate';
    else if (analysis.toLowerCase().includes('mild')) riskLevel = 'mild';
    else if (analysis.toLowerCase().includes('none')) riskLevel = 'none';

    res.json({
        success: true,
        medicines: medicines,
        riskLevel: riskLevel,
        analysis: analysis,
        disclaimer: "This information is for educational purposes only. Always consult with a healthcare provider or pharmacist before taking multiple medications."
    });
});

// @desc    Get common interaction warnings for a single medicine
// @route   GET /api/medicine/warnings/:medicineName
// @access  Private (Patient)
exports.getMedicineWarnings = asyncHandler(async (req, res) => {
    const { medicineName } = req.params;

    if (!medicineName) {
        throw new ValidationError('Medicine name is required');
    }

    const prompt = `
Provide key safety information about ${medicineName}:

1. **Common Side Effects** (list 5 most common)
2. **Serious Side Effects** (warning signs to watch for)
3. **Common Drug Interactions** (5 common medicines it interacts with)
4. **Food Interactions** (foods/drinks to avoid)
5. **Special Populations** (pregnancy, elderly, children warnings)
6. **Storage** (how to store properly)

Keep response concise and practical.
`;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a pharmacist providing medication information. Be accurate and safety-focused."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: 800
    });

    const warnings = completion.choices[0]?.message?.content || "Unable to fetch warnings.";

    res.json({
        success: true,
        medicineName: medicineName,
        warnings: warnings,
        disclaimer: "Consult your pharmacist or doctor for complete information."
    });
});

// @desc    Generate prescription QR code data
// @route   POST /api/medicine/prescription-qr
// @access  Private (Doctor)
exports.generatePrescriptionQR = asyncHandler(async (req, res) => {
    const { patientId, patientName, medicines, diagnosis, doctorId, doctorName, appointmentId } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
        throw new ValidationError('Medicines list is required');
    }

    // Create prescription data object
    const prescriptionData = {
        id: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        doctor: {
            id: doctorId,
            name: doctorName
        },
        patient: {
            id: patientId,
            name: patientName
        },
        diagnosis: diagnosis || 'Not specified',
        medicines: medicines.map(med => ({
            name: med.name,
            dosage: med.dosage || 'As directed',
            frequency: med.frequency || 'As directed',
            duration: med.duration || 'As directed',
            instructions: med.instructions || ''
        })),
        appointmentId: appointmentId,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Valid for 30 days
    };

    // In production, you would encode this as a QR code
    // For now, return the data that can be encoded client-side
    const qrString = Buffer.from(JSON.stringify(prescriptionData)).toString('base64');

    res.json({
        success: true,
        prescriptionId: prescriptionData.id,
        qrData: qrString,
        prescriptionDetails: prescriptionData,
        message: 'Prescription QR generated. Show this at pharmacy for verification.'
    });
});

// @desc    Verify prescription QR code
// @route   POST /api/medicine/verify-prescription
// @access  Private (Pharmacy)
exports.verifyPrescription = asyncHandler(async (req, res) => {
    const { qrData } = req.body;

    if (!qrData) {
        throw new ValidationError('QR data is required');
    }

    try {
        const decodedData = JSON.parse(Buffer.from(qrData, 'base64').toString('utf8'));
        
        // Check if prescription is still valid
        const validUntil = new Date(decodedData.validUntil);
        const isValid = validUntil > new Date();

        res.json({
            success: true,
            isValid: isValid,
            prescription: decodedData,
            message: isValid 
                ? 'Prescription verified successfully' 
                : 'Prescription has expired'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid prescription QR code'
        });
    }
});
