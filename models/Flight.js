const mongoose = require('mongoose');
const flightSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true, unique: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  aircraft: { type: mongoose.Schema.Types.ObjectId, ref: 'Aircraft', required: true },
  crew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  status: {
    type: String,
    enum: ['scheduled', 'delayed', 'cancelled', 'departed', 'arrived'],
    default: 'scheduled',
  },
 price: { type: Number, required: true },
   createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Flight', flightSchema);
