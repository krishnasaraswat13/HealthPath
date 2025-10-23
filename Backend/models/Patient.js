// HealthPath/backend/models/Patient.js
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  phone: { type: String, default: '' },
  medicalHistory: [String],
  currentDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", default: null },
  reminderSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    reminderTimes: { type: [String], default: ['1day', '2hours', '30min'] }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);
