const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['credit_card', 'paypal', 'debit_card', 'cash'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);