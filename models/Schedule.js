const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true }, // ✨ Nuevo campo
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);

