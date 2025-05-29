const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['pilot', 'crew', 'ground'], required: true },
  schedule: [{ flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' }, date: Date }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Employee', employeeSchema);