// models/Payroll.js
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalHours: { type: Number, required: true },
  hourlyRate: { type: Number, required: true },
  totalPay: { type: Number, required: true },
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payroll', payrollSchema);
