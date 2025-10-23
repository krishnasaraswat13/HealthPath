/**
 * Hospital Seed Script for HealthPath
 * Seeds 10 hospitals near GLA University, Mathura / Vrindavan area
 * 
 * Usage: node seed_hospitals.js
 * Requires MONGO_URI in .env
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Fix DNS for MongoDB Atlas SRV
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const HospitalAccount = require('./models/HospitalAccount');

const hospitals = [
    {
        name: "Mathura Medical Center",
        email: "admin@mathuramedical.com",
        password: "Hospital@123",
        address: "NH-2, Mathura-Vrindavan Road, Mathura, UP 281001",
        phone: "+91-9876543001",
        location: { type: "Point", coordinates: [77.6737, 27.4924] },
        specialties: ["General Medicine", "Cardiology", "Orthopedics", "Pediatrics"],
        beds: 150,
        emergencyServices: true,
        pricing: [
            { serviceType: "Consultation", name: "General Consultation", price: 300, category: "OPD" },
            { serviceType: "Test", name: "Blood Test (CBC)", price: 250, category: "Lab" },
            { serviceType: "Consultation", name: "Specialist Consultation", price: 600, category: "OPD" }
        ]
    },
    {
        name: "Vrindavan Multi-Specialty Hospital",
        email: "admin@vrindavanhospital.com",
        password: "Hospital@123",
        address: "Chatikara Road, Vrindavan, Mathura, UP 281121",
        phone: "+91-9876543002",
        location: { type: "Point", coordinates: [77.7006, 27.5806] },
        specialties: ["Cardiology", "Neurology", "Oncology", "Dermatology"],
        beds: 200,
        emergencyServices: true,
        pricing: [
            { serviceType: "Consultation", name: "Cardiology Consultation", price: 800, category: "OPD" },
            { serviceType: "Surgery", name: "Angioplasty", price: 150000, category: "Cardiac" },
            { serviceType: "Test", name: "ECG", price: 500, category: "Diagnostic" }
        ]
    },
    {
        name: "GLA University Health Center",
        email: "admin@glahealthcenter.com",
        password: "Hospital@123",
        address: "17 km Stone, NH-2, Mathura-Delhi Highway, Mathura, UP 281406",
        phone: "+91-9876543003",
        location: { type: "Point", coordinates: [77.5364, 27.6094] },
        specialties: ["General Medicine", "Physiotherapy", "Dermatology", "Psychiatry"],
        beds: 50,
        emergencyServices: false,
        pricing: [
            { serviceType: "Consultation", name: "General Checkup", price: 200, category: "OPD" },
            { serviceType: "Consultation", name: "Mental Health Counseling", price: 500, category: "Wellness" },
            { serviceType: "Test", name: "Routine Blood Panel", price: 400, category: "Lab" }
        ]
    },
    {
        name: "Shri Krishna Hospital",
        email: "admin@shrikrishnahospital.com",
        password: "Hospital@123",
        address: "Dampier Nagar, Mathura, UP 281001",
        phone: "+91-9876543004",
        location: { type: "Point", coordinates: [77.6833, 27.4946] },
        specialties: ["General Surgery", "Orthopedics", "ENT", "Ophthalmology"],
        beds: 120,
        emergencyServices: true,
        pricing: [
            { serviceType: "Surgery", name: "Knee Replacement", price: 200000, category: "Orthopedics" },
            { serviceType: "Consultation", name: "ENT Consultation", price: 400, category: "OPD" },
            { serviceType: "Test", name: "X-Ray", price: 350, category: "Radiology" }
        ]
    },
    {
        name: "Nayati Medicity Mathura",
        email: "admin@nayatimathura.com",
        password: "Hospital@123",
        address: "Goverdhan Chauraha, NH-2, Mathura, UP 281001",
        phone: "+91-9876543005",
        location: { type: "Point", coordinates: [77.6535, 27.4700] },
        specialties: ["Cardiology", "Neurosurgery", "Urology", "Gastroenterology", "Nephrology"],
        beds: 300,
        emergencyServices: true,
        pricing: [
            { serviceType: "Consultation", name: "Neurology Consultation", price: 1000, category: "OPD" },
            { serviceType: "Surgery", name: "Laparoscopic Surgery", price: 80000, category: "General" },
            { serviceType: "Test", name: "MRI Scan", price: 5000, category: "Radiology" },
            { serviceType: "Admission", name: "ICU Per Day", price: 8000, category: "Admission" }
        ]
    },
    {
        name: "Deen Dayal Hospital",
        email: "admin@deendayalhospital.com",
        password: "Hospital@123",
        address: "Refinery Nagar, Mathura, UP 281006",
        phone: "+91-9876543006",
        location: { type: "Point", coordinates: [77.6360, 27.4530] },
        specialties: ["Pediatrics", "Gynecology", "General Medicine", "Pulmonology"],
        beds: 100,
        emergencyServices: true,
        pricing: [
            { serviceType: "Consultation", name: "Pediatric Consultation", price: 350, category: "OPD" },
            { serviceType: "Consultation", name: "Gynecology Consultation", price: 500, category: "OPD" },
            { serviceType: "Test", name: "Ultrasound", price: 800, category: "Diagnostic" }
        ]
    },
    {
        name: "Bhagwat Hospital Vrindavan",
        email: "admin@bhagwathospital.com",
        password: "Hospital@123",
        address: "Parikrama Marg, Vrindavan, Mathura, UP 281121",
        phone: "+91-9876543007",
        location: { type: "Point", coordinates: [77.7015, 27.5750] },
        specialties: ["General Medicine", "Dermatology", "Ophthalmology"],
        beds: 60,
        emergencyServices: false,
        pricing: [
            { serviceType: "Consultation", name: "Eye Checkup", price: 300, category: "OPD" },
            { serviceType: "Surgery", name: "Cataract Surgery", price: 25000, category: "Ophthalmology" },
            { serviceType: "Test", name: "Eye Pressure Test", price: 200, category: "Diagnostic" }
        ]
    },
    {
        name: "Agra Road Trauma Center",
        email: "admin@agratraumacenter.com",
        password: "Hospital@123",
        address: "Agra Road, Near Toll Plaza, Mathura, UP 281001",
        phone: "+91-9876543008",
        location: { type: "Point", coordinates: [77.7200, 27.4800] },
        specialties: ["Trauma Surgery", "Orthopedics", "General Surgery", "Critical Care"],
        beds: 80,
        emergencyServices: true,
        pricing: [
            { serviceType: "Surgery", name: "Fracture Fixation", price: 50000, category: "Trauma" },
            { serviceType: "Admission", name: "General Ward Per Day", price: 1500, category: "Admission" },
            { serviceType: "Test", name: "CT Scan", price: 3500, category: "Radiology" }
        ]
    },
    {
        name: "Govardhan Community Hospital",
        email: "admin@govardhanhospital.com",
        password: "Hospital@123",
        address: "Govardhan Town, Mathura, UP 281502",
        phone: "+91-9876543009",
        location: { type: "Point", coordinates: [77.4640, 27.4960] },
        specialties: ["General Medicine", "Pediatrics", "Obstetrics"],
        beds: 40,
        emergencyServices: false,
        pricing: [
            { serviceType: "Consultation", name: "General OPD", price: 150, category: "OPD" },
            { serviceType: "Consultation", name: "Obstetric Consultation", price: 400, category: "OPD" },
            { serviceType: "Other", name: "Normal Delivery", price: 15000, category: "Maternity" }
        ]
    },
    {
        name: "Vrindavan Heart & Super Specialty",
        email: "admin@vrindavanheart.com",
        password: "Hospital@123",
        address: "Bhaktivedanta Swami Marg, Raman Reti, Vrindavan, UP 281121",
        phone: "+91-9876543010",
        location: { type: "Point", coordinates: [77.6880, 27.5670] },
        specialties: ["Cardiology", "Cardiac Surgery", "Vascular Surgery", "Interventional Radiology"],
        beds: 180,
        emergencyServices: true,
        pricing: [
            { serviceType: "Consultation", name: "Cardiac Consultation", price: 900, category: "OPD" },
            { serviceType: "Surgery", name: "CABG (Bypass Surgery)", price: 300000, category: "Cardiac" },
            { serviceType: "Test", name: "Echocardiogram", price: 1500, category: "Diagnostic" },
            { serviceType: "Test", name: "Stress Test (TMT)", price: 1200, category: "Diagnostic" }
        ]
    }
];

async function seedHospitals() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('âœ… MongoDB Connected');

        // Check existing hospitals
        const existingCount = await HospitalAccount.countDocuments();
        console.log(`ðŸ“Š Existing hospitals in DB: ${existingCount}`);

        let seeded = 0;
        let skipped = 0;

        for (const hospitalData of hospitals) {
            // Check if hospital already exists by email
            const exists = await HospitalAccount.findOne({ email: hospitalData.email });
            if (exists) {
                console.log(`â­ï¸  Skipped (already exists): ${hospitalData.name}`);
                skipped++;
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(hospitalData.password, salt);

            const hospital = new HospitalAccount({
                ...hospitalData,
                password: hashedPassword
            });

            await hospital.save();
            console.log(`âœ… Seeded: ${hospitalData.name}`);
            seeded++;
        }

        console.log('\nðŸ“‹ Seed Summary:');
        console.log(`   New hospitals added: ${seeded}`);
        console.log(`   Skipped (duplicates): ${skipped}`);
        console.log(`   Total in DB now: ${existingCount + seeded}`);

    } catch (error) {
        console.error('âŒ Seed Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('ðŸ”Œ MongoDB connection closed');
    }
}

seedHospitals();

