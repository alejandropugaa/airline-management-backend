const mongoose = require('mongoose');

const baggageSchema = new mongoose.Schema({
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  weight: { type: Number, required: true },
  status: { type: String, enum: ['checked', 'loaded', 'delivered'], default: 'checked' },
  boardingPass: { type: String, required: true, unique: true },
  extraCharge: { type: Number, default: 0 }, 
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Baggage', baggageSchema);