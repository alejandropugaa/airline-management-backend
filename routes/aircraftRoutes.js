const express = require('express');
const router = express.Router();
const Aircraft = require('../models/Aircraft');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const aircrafts = await Aircraft.find();
    res.json(aircrafts);
  } catch (error) {
    console.error('Error al obtener aeronaves:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
