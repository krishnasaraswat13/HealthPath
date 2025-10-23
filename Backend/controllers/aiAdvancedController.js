const Groq = require("groq-sdk");
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Feedback = require('../models/Feedback');
const SymptomEntry = require('../models/SymptomEntry');
const HealthGoal = require('../models/HealthGoal');
const Medicine = require('../models/Medicine');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to call Groq
async function callGroq(systemPrompt, userPrompt, maxTokens = 2048) {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: maxTokens,
        temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || "Unable to generate response.";
}

// ==========================================
// 1. AI CLINICAL NOTES GENERATOR (Doctor)
// ==========================================
exports.generateClinicalNotes = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'name age gender medicalHistory')
            .populate('doctorId', 'name specialization');

        if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

        const prescription = await Prescription.findOne({ appointmentId });

        const systemPrompt = `You are a medical documentation expert. Generate professional SOAP clinical notes (Subjective, Objective, Assessment, Plan) from the given appointment data. Be thorough, structured, and use medical terminology appropriately. Format with clear headings and bullet points.`;

        const userPrompt = `
Patient: ${appointment.patientId?.name}, Age: ${appointment.patientId?.age}, Gender: ${appointment.patientId?.gender}
Medical History: ${appointment.patientId?.medicalHistory?.join(', ') || 'None recorded'}
Appointment Date: ${new Date(appointment.date).toLocaleDateString()}
Time Slot: ${appointment.timeSlot}
Diagnosis: ${appointment.diagnosis || 'Not yet diagnosed'}
${prescription ? `
Prescribed Medications:
${prescription.medicines?.map(m => `- ${m.medicineName} ${m.dosage} ${m.frequency} for ${m.duration}`).join('\n')}
Notes: ${prescription.notes || 'None'}
` : 'No prescription issued'}

Generate comprehensive SOAP clinical notes for this visit.`;

        const notes = await callGroq(systemPrompt, userPrompt);
        res.json({ success: true, clinicalNotes: notes });
    } catch (error) {
        console.error("Clinical Notes Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate clinical notes" });
    }
};

// ==========================================
// 2. AI TREATMENT PLAN GENERATOR (Doctor)
// ==========================================
exports.generateTreatmentPlan = async (req, res) => {
    try {
        const { diagnosis, patientAge, patientGender, medicalHistory, symptoms } = req.body;

        const systemPrompt = `You are an experienced physician creating a comprehensive treatment plan. Include:
1. **Treatment Goals** (short-term and long-term)
2. **Medication Plan** (with dosages and duration)
3. **Lifestyle Modifications** (diet, exercise, sleep)
4. **Follow-up Schedule** (when to return)
5. **Warning Signs** (when to seek immediate care)
6. **Expected Recovery Timeline**
Be specific, actionable, and evidence-based. Use markdown formatting.`;

        const userPrompt = `Create a treatment plan for:
Diagnosis: ${diagnosis}
Patient Age: ${patientAge}
Gender: ${patientGender}
Medical History: ${medicalHistory || 'None specified'}
Current Symptoms: ${symptoms || 'Related to diagnosis'}`;

        const plan = await callGroq(systemPrompt, userPrompt, 3000);
        res.json({ success: true, treatmentPlan: plan });
    } catch (error) {
        console.error("Treatment Plan Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate treatment plan" });
    }
};

// ==========================================
// 3. AI DRUG ALTERNATIVE SUGGESTER
// ==========================================
exports.suggestDrugAlternatives = async (req, res) => {
    try {
        const { medicineName, reason } = req.body;

        const systemPrompt = `You are a clinical pharmacologist. Suggest alternative medications for the given drug. For each alternative provide:
1. **Generic Name** and **Brand Names**
2. **Why it's a good alternative** (mechanism, efficacy)
3. **Cost comparison** (cheaper/similar/more expensive)
4. **Key differences** (side effects, dosing schedule)
5. **When to prefer this alternative**

Organize by: Generic alternatives first, then therapeutic alternatives. Use markdown tables where appropriate.`;

        const userPrompt = `Suggest alternatives for: ${medicineName}
Reason for seeking alternative: ${reason || 'Cost reduction or availability'}`;

        const alternatives = await callGroq(systemPrompt, userPrompt);
        res.json({ success: true, alternatives });
    } catch (error) {
        console.error("Drug Alternatives Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to suggest alternatives" });
    }
};

// ==========================================
// 4. AI PATIENT DIET PLANNER
// ==========================================
exports.generateDietPlan = async (req, res) => {
    try {
        const { condition, age, gender, weight, height, allergies, preferences } = req.body;

        const systemPrompt = `You are a certified nutritionist specializing in therapeutic diets. Create a detailed 7-day diet plan that is:
- Medically appropriate for the patient's condition
- Nutritionally balanced with calorie counts
- Practical and easy to follow
- Culturally sensitive and varied

Format as a structured weekly plan with breakfast, lunch, dinner, and 2 snacks per day. Include nutritional tips specific to the condition.`;

        const userPrompt = `Create a therapeutic diet plan:
Medical Condition: ${condition}
Age: ${age}, Gender: ${gender}
Weight: ${weight}kg, Height: ${height}cm
Food Allergies: ${allergies || 'None'}
Dietary Preferences: ${preferences || 'No restrictions'}`;

        const dietPlan = await callGroq(systemPrompt, userPrompt, 4000);
        res.json({ success: true, dietPlan });
    } catch (error) {
        console.error("Diet Plan Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate diet plan" });
    }
};

// ==========================================
// 5. AI SYMPTOM TRIAGE (Urgency Assessment)
// ==========================================
exports.triageSymptoms = async (req, res) => {
    try {
        const { symptoms, age, gender, duration, severity } = req.body;

        const systemPrompt = `You are an emergency triage nurse. Based on the symptoms, assess the urgency level. You MUST respond with a JSON object in this exact format:
{
    "urgencyLevel": "EMERGENCY|URGENT|SEMI-URGENT|NON-URGENT",
    "urgencyScore": <1-10>,
    "color": "red|orange|yellow|green",
    "recommendation": "<what to do>",
    "possibleConditions": ["condition1", "condition2"],
    "shouldCallEmergency": true/false,
    "estimatedWaitSafe": "<how long is safe to wait>",
    "selfCareSteps": ["step1", "step2"],
    "warningSignsToWatch": ["sign1", "sign2"]
}
ONLY output valid JSON, nothing else.`;

        const userPrompt = `Patient: Age ${age}, ${gender}
Symptoms: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
Duration: ${duration || 'Not specified'}
Severity (1-10): ${severity || 'Not specified'}`;

        const result = await callGroq(systemPrompt, userPrompt);
        
        // Try to parse JSON response
        let triageResult;
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            triageResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { 
                urgencyLevel: "SEMI-URGENT", urgencyScore: 5, color: "yellow",
                recommendation: result, possibleConditions: [], shouldCallEmergency: false
            };
        } catch {
            triageResult = { 
                urgencyLevel: "SEMI-URGENT", urgencyScore: 5, color: "yellow",
                recommendation: result, possibleConditions: [], shouldCallEmergency: false
            };
        }

        res.json({ success: true, triage: triageResult });
    } catch (error) {
        console.error("Triage Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to assess symptoms" });
    }
};

// ==========================================
// 6. AI WELLNESS SCORE CALCULATOR
// ==========================================
exports.calculateWellnessScore = async (req, res) => {
    try {
        const patientId = req.user.id;
        
        // Gather all patient health data
        const [symptoms, goals, appointments] = await Promise.all([
            SymptomEntry.find({ patientId }).sort({ date: -1 }).limit(7),
            HealthGoal.find({ patientId, status: 'active' }),
            Appointment.find({ patientId, status: 'completed' }).sort({ date: -1 }).limit(5)
        ]);

        const recentSymptoms = symptoms.map(s => ({
            mood: s.mood,
            sleep: s.sleepHours,
            water: s.waterIntake,
            symptoms: s.symptoms?.map(sym => sym.name).join(', ')
        }));

        const goalProgress = goals.map(g => ({
            title: g.title,
            progress: g.targetValue ? ((g.currentValue / g.targetValue) * 100).toFixed(0) : 0,
            streak: g.streakCount
        }));

        const systemPrompt = `You are a wellness analytics AI. Calculate a comprehensive wellness score (0-100) based on the patient's health data. Respond with a JSON object:
{
    "overallScore": <0-100>,
    "breakdown": {
        "physical": <0-100>,
        "mental": <0-100>,
        "lifestyle": <0-100>,
        "preventive": <0-100>
    },
    "trend": "improving|stable|declining",
    "topStrengths": ["strength1", "strength2"],
    "areasToImprove": ["area1", "area2"],
    "personalizedTips": ["tip1", "tip2", "tip3"],
    "weeklyChallenge": "<a specific health challenge for this week>"
}
ONLY output valid JSON.`;

        const userPrompt = `Patient health data from the past week:
Recent Symptom Entries: ${JSON.stringify(recentSymptoms)}
Active Health Goals: ${JSON.stringify(goalProgress)}
Recent Appointments: ${appointments.length} completed visits
Latest Diagnoses: ${appointments.map(a => a.diagnosis).filter(Boolean).join(', ') || 'None recent'}`;

        const result = await callGroq(systemPrompt, userPrompt);
        
        let wellnessData;
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            wellnessData = jsonMatch ? JSON.parse(jsonMatch[0]) : { overallScore: 70, trend: "stable" };
        } catch {
            wellnessData = { overallScore: 70, trend: "stable", personalizedTips: [result] };
        }

        res.json({ success: true, wellness: wellnessData });
    } catch (error) {
        console.error("Wellness Score Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to calculate wellness score" });
    }
};

// ==========================================
// 7. AI MEDICAL CERTIFICATE GENERATOR (Doctor)
// ==========================================
exports.generateMedicalCertificate = async (req, res) => {
    try {
        const { patientName, patientAge, diagnosis, startDate, endDate, purpose } = req.body;
        const doctor = await Doctor.findById(req.user.id).select('name specialization');

        const systemPrompt = `You are a medical documentation system. Generate a formal medical certificate. Include:
- Header: "MEDICAL CERTIFICATE"
- Patient details
- Clinical findings
- Professional recommendation
- Validity period
- Doctor's details
Format it professionally with proper medical language. Output clean text suitable for a PDF.`;

        const userPrompt = `Generate medical certificate:
Patient: ${patientName}, Age: ${patientAge}
Diagnosis/Condition: ${diagnosis}
Period: ${startDate} to ${endDate}
Purpose: ${purpose || 'Medical leave'}
Issuing Doctor: Dr. ${doctor?.name}, ${doctor?.specialization}
Date of Issue: ${new Date().toLocaleDateString()}`;

        const certificate = await callGroq(systemPrompt, userPrompt);
        res.json({ success: true, certificate, doctorName: doctor?.name, specialization: doctor?.specialization });
    } catch (error) {
        console.error("Certificate Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate certificate" });
    }
};

// ==========================================
// 8. AI FEEDBACK INSIGHTS (Doctor)
// ==========================================
exports.analyzeFeedbackInsights = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const feedbacks = await Feedback.find({ doctorId }).sort({ createdAt: -1 }).limit(50);

        if (feedbacks.length === 0) {
            return res.json({ success: true, insights: "No feedback data available yet. Insights will appear after patients submit feedback." });
        }

        const feedbackSummary = feedbacks.map(f => ({
            rating: f.overallRating,
            communication: f.ratings?.communication,
            professionalism: f.ratings?.professionalism,
            waitTime: f.ratings?.waitTime,
            comments: f.comments,
            suggestions: f.improvementSuggestions,
            wouldRecommend: f.wouldRecommend
        }));

        const systemPrompt = `You are a healthcare quality analyst. Analyze patient feedback data and provide actionable insights. Structure your response as:
1. **Overall Sentiment** - What patients think overall
2. **Top Strengths** - What patients love (with quotes)
3. **Areas for Improvement** - Constructive suggestions
4. **Trend Analysis** - Are things getting better/worse?
5. **Action Items** - Top 3 specific things to improve
6. **Patient Satisfaction Score** - Estimated NPS
7. **Competitive Edge** - What sets this doctor apart

Be honest, constructive, and specific. Use data from the reviews.`;

        const userPrompt = `Analyze these ${feedbacks.length} patient feedback entries:\n${JSON.stringify(feedbackSummary, null, 2)}`;

        const insights = await callGroq(systemPrompt, userPrompt, 3000);
        res.json({ success: true, insights });
    } catch (error) {
        console.error("Feedback Insights Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to analyze feedback" });
    }
};

// ==========================================
// 9. AI SMART APPOINTMENT SUGGESTIONS
// ==========================================
exports.suggestAppointmentSlots = async (req, res) => {
    try {
        const { symptoms, urgency, preferredTime } = req.body;

        const systemPrompt = `You are a medical scheduling AI. Based on the patient's symptoms and urgency, suggest:
1. Which specialist they should see
2. How soon they should be seen
3. Ideal time of day for this type of visit
4. What to prepare before the appointment
5. Questions to ask the doctor

Respond with JSON:
{
    "recommendedSpecialist": "string",
    "urgencyAssessment": "immediate|within24h|within48h|withinWeek|routine",
    "idealTimeSlot": "morning|afternoon|evening",
    "preparationSteps": ["step1", "step2"],
    "questionsToAsk": ["q1", "q2"],
    "estimatedDuration": "minutes"
}
ONLY output valid JSON.`;

        const userPrompt = `Patient symptoms: ${symptoms}
Urgency feeling: ${urgency || 'moderate'}
Preferred time: ${preferredTime || 'any'}`;

        const result = await callGroq(systemPrompt, userPrompt);
        
        let suggestions;
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendedSpecialist: "General Physician" };
        } catch {
            suggestions = { recommendedSpecialist: "General Physician", recommendation: result };
        }

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error("Slot Suggestion Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to suggest slots" });
    }
};

// ==========================================
// 10. AI HOSPITAL COST ESTIMATOR
// ==========================================
exports.estimateTreatmentCost = async (req, res) => {
    try {
        const { treatment, location, insuranceType } = req.body;

        const systemPrompt = `You are a healthcare cost estimation AI for India. Provide estimated treatment costs. Respond with JSON:
{
    "treatmentName": "string",
    "estimatedCostRange": { "min": number, "max": number, "currency": "INR" },
    "breakdown": [
        { "item": "Consultation", "cost": number },
        { "item": "Diagnostics", "cost": number },
        { "item": "Surgery/Procedure", "cost": number },
        { "item": "Medication", "cost": number },
        { "item": "Hospital Stay", "cost": number }
    ],
    "insuranceCoverage": "string",
    "costSavingTips": ["tip1", "tip2"],
    "averageStayDuration": "string",
    "additionalCosts": ["possible extra cost1", "possible extra cost2"]
}
ONLY output valid JSON. Use realistic Indian healthcare pricing.`;

        const userPrompt = `Estimate cost for:
Treatment/Procedure: ${treatment}
Location: ${location || 'Metro city, India'}
Insurance: ${insuranceType || 'No insurance'}`;

        const result = await callGroq(systemPrompt, userPrompt);
        
        let estimate;
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            estimate = jsonMatch ? JSON.parse(jsonMatch[0]) : { estimatedCostRange: { min: 0, max: 0 } };
        } catch {
            estimate = { treatmentName: treatment, description: result };
        }

        res.json({ success: true, estimate });
    } catch (error) {
        console.error("Cost Estimate Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to estimate cost" });
    }
};

// ==========================================
// 11. AI PHARMACY SMART REORDER SUGGESTIONS
// ==========================================
exports.smartReorderSuggestions = async (req, res) => {
    try {
        const { inventory, orderHistory } = req.body;

        const systemPrompt = `You are a pharmacy inventory AI analyst. Analyze the inventory and order patterns to suggest reorders. Respond with JSON:
{
    "urgentReorders": [{"medicine": "name", "currentStock": 0, "suggestedOrder": 0, "reason": "string"}],
    "predictedShortages": [{"medicine": "name", "daysUntilStockout": 0, "suggestedOrder": 0}],
    "overStocked": [{"medicine": "name", "excessUnits": 0, "recommendation": "string"}],
    "seasonalAlerts": ["alert1"],
    "costOptimization": ["tip1", "tip2"],
    "summaryInsight": "string"
}
ONLY output valid JSON.`;

        const userPrompt = `Current Inventory:\n${JSON.stringify(inventory)}\nRecent Order History:\n${JSON.stringify(orderHistory || [])}`;

        const result = await callGroq(systemPrompt, userPrompt, 3000);
        
        let suggestions;
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : { summaryInsight: result };
        } catch {
            suggestions = { summaryInsight: result };
        }

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error("Reorder Suggestion Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate reorder suggestions" });
    }
};

// ==========================================
// 12. AI DISCHARGE SUMMARY GENERATOR (Hospital)
// ==========================================
exports.generateDischargeSummary = async (req, res) => {
    try {
        const { patientName, age, gender, admissionDate, dischargeDate, diagnosis, procedures, medications, instructions } = req.body;

        const systemPrompt = `You are a hospital documentation AI. Generate a comprehensive discharge summary following standard medical format:
1. **Patient Information**
2. **Admission Details** (date, reason, initial assessment)
3. **Hospital Course** (treatment timeline, procedures, response)
4. **Discharge Diagnosis** (final diagnosis with ICD codes if applicable)
5. **Discharge Medications** (with complete dosing instructions)
6. **Follow-up Instructions** (appointments, activity restrictions, diet)
7. **Warning Signs** (when to return to emergency)
8. **Patient Education** (condition-specific advice)

Make it professional, complete, and suitable for official medical records.`;

        const userPrompt = `Generate discharge summary:
Patient: ${patientName}, Age: ${age}, Gender: ${gender}
Admitted: ${admissionDate}
Discharged: ${dischargeDate}
Diagnosis: ${diagnosis}
Procedures Performed: ${procedures || 'None'}
Current Medications: ${medications || 'None'}
Special Instructions: ${instructions || 'Standard post-discharge care'}`;

        const summary = await callGroq(systemPrompt, userPrompt, 4000);
        res.json({ success: true, dischargeSummary: summary });
    } catch (error) {
        console.error("Discharge Summary Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate discharge summary" });
    }
};

// ==========================================
// 13. AI MEDICAL TRANSLATION
// ==========================================
exports.translateMedical = async (req, res) => {
    try {
        const { text, fromLanguage, toLanguage } = req.body;

        const systemPrompt = `You are a medical translator. Translate the given medical text accurately while:
1. Preserving medical terminology accuracy
2. Keeping drug names in their international form
3. Adding simple explanations for complex terms in brackets
4. Maintaining the original structure and formatting

Provide the translated text followed by a glossary of key medical terms.`;

        const userPrompt = `Translate from ${fromLanguage || 'English'} to ${toLanguage || 'Hindi'}:

${text}`;

        const translation = await callGroq(systemPrompt, userPrompt);
        res.json({ success: true, translation });
    } catch (error) {
        console.error("Translation Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to translate" });
    }
};

// ==========================================
// 14. AI HOSPITAL BED CAPACITY FORECAST
// ==========================================
exports.forecastCapacity = async (req, res) => {
    try {
        const { currentOccupancy, totalBeds, emergencyAdmissions, seasonalTrend } = req.body;

        const systemPrompt = `You are a hospital capacity planning AI. Based on current data, forecast bed occupancy. Respond with JSON:
{
    "currentUtilization": "<percentage>",
    "forecast7Days": [
        {"day": "Mon", "predicted": 85, "confidence": "high"},
        {"day": "Tue", "predicted": 87, "confidence": "high"}
    ],
    "riskLevel": "low|medium|high|critical",
    "recommendations": ["rec1", "rec2"],
    "expectedPeakDay": "string",
    "staffingAdvice": "string",
    "actionItems": ["action1", "action2"]
}
ONLY output valid JSON.`;

        const userPrompt = `Hospital capacity data:
Current Beds Occupied: ${currentOccupancy} / ${totalBeds}
Recent Emergency Admissions (past week): ${emergencyAdmissions || 'Unknown'}
Season/Trend: ${seasonalTrend || 'Normal'}`;

        const result = await callGroq(systemPrompt, userPrompt);
        
        let forecast;
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            forecast = jsonMatch ? JSON.parse(jsonMatch[0]) : { riskLevel: "medium" };
        } catch {
            forecast = { riskLevel: "medium", recommendations: [result] };
        }

        res.json({ success: true, forecast });
    } catch (error) {
        console.error("Capacity Forecast Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to forecast capacity" });
    }
};
