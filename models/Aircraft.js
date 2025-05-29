const mongoose = require('mongoose');

const aircraftSchema = new mongoose.Schema({
  model: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  seatMap: [{ type: String }] // Ej: ['1A', '1B', ..., '11A']
});

module.exports = mongoose.model('Aircraft', aircraftSchema);
