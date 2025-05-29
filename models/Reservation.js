const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  seatNumber: { type: String, required: true },
  ticketNumber: {
    type: String,
    unique: true,
    default: () => `TICKET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Reservation', reservationSchema);