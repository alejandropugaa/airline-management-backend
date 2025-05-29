// 📁 backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Aircraft = require('../models/Aircraft');
const Baggage = require('../models/Baggage');

// Total de vuelos programados
router.get('/vuelos-programados', async (req, res) => {
  const total = await Flight.countDocuments({ status: 'scheduled' });
  res.json({ total });
});

// Total de clientes registrados
router.get('/clientes', async (req, res) => {
  const total = await Customer.countDocuments();
  res.json({ total });
});

// Vuelos por estado
router.get('/vuelos-por-estado', async (req, res) => {
  const result = await Flight.aggregate([
    { $group: { _id: "$status", total: { $sum: 1 } } }
  ]);
  res.json(result);
});

// Ventas por periodo
router.get('/ventas', async (req, res) => {
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [semanal, mensual, anual] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  ]);

  res.json({
    semanal: semanal[0]?.total || 0,
    mensual: mensual[0]?.total || 0,
    anual: anual[0]?.total || 0
  });
});

// Destino más solicitado
router.get('/destino-popular', async (req, res) => {
  const result = await Reservation.aggregate([
    {
      $lookup: {
        from: 'flights',
        localField: 'flight',
        foreignField: '_id',
        as: 'flightInfo'
      }
    },
    { $unwind: '$flightInfo' },
    {
      $group: {
        _id: '$flightInfo.destination',
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 1 }
  ]);
  res.json(result[0] || { _id: 'N/A', total: 0 });
});

// Vuelos por aeronave
router.get('/vuelos-por-avion', async (req, res) => {
  const result = await Flight.aggregate([
    {
      $lookup: {
        from: 'aircrafts',
        localField: 'aircraft',
        foreignField: '_id',
        as: 'aircraftInfo'
      }
    },
    { $unwind: '$aircraftInfo' },
    {
      $group: {
        _id: '$aircraftInfo.model',
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
  res.json(result);
});

// Reservas por estado
router.get('/reservas-por-estado', async (req, res) => {
  const result = await Reservation.aggregate([
    { $group: { _id: '$status', total: { $sum: 1 } } }
  ]);
  res.json(result);
});

// Promedio de equipaje por reserva
router.get('/promedio-equipaje', async (req, res) => {
  const result = await Baggage.aggregate([
    {
      $group: {
        _id: null,
        promedio: { $avg: '$weight' }
      }
    }
  ]);
  res.json(result[0] || { promedio: 0 });
});

// Métodos de pago utilizados
router.get('/metodos-pago', async (req, res) => {
  const result = await Payment.aggregate([
    {
      $group: {
        _id: '$method',
        total: { $sum: 1 }
      }
    }
  ]);
  res.json(result);
});

module.exports = router;

// En app.js o index.js:
// const dashboardRoutes = require('./routes/dashboard');
// app.use('/api/dashboard', dashboardRoutes);
