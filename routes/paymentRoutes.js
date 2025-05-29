const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const authMiddleware = require('../middleware/authMiddleware');

// Process payment (Customer)
router.post('/', authMiddleware(['customer']), async (req, res) => {
  const { reservation, amount, method } = req.body;
  try {
    const payment = new Payment({ reservation, amount, method, status: 'completed' });
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Refund payment (Admin)
router.put('/:id/refund', authMiddleware(['admin']), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status: 'refunded' }, { new: true });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;