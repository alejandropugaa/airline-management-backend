const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  passport: { type: String, required: true },
  contactInfo: {
    phone: String,
    address: String,
  },
  frequentFlyer: {
    status: { type: String, enum: ['none', 'silver', 'gold', 'platinum'], default: 'none' },
    points: { type: Number, default: 0 },
  },
  preferences: {
    seatPreference: String,
    mealPreference: String,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', customerSchema);