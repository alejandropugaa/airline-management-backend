const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Baggage = require('../models/Baggage');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const authMiddleware = require('../middleware/authMiddleware');

const MAX_WEIGHT = 20; // kilos permitidos
const EXTRA_FEE_PER_KG = 10; // $ por kilo extra
// Check-in baggage (Customer)
router.post('/', authMiddleware(['customer']), async (req, res) => {
  const { reservation, weight, method } = req.body;
  const MAX_WEIGHT = 20;
  const EXTRA_FEE_PER_KG = 10;
  try {
    const excessWeight = weight > MAX_WEIGHT ? weight - MAX_WEIGHT : 0;
    const extraCharge = excessWeight * EXTRA_FEE_PER_KG;
    const boardingPass = `PASS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const baggage = new Baggage({
      reservation,
      weight,
      boardingPass,
      extraCharge
    });
    await baggage.save();
    let payment = null;
    if (extraCharge > 0) {
      if (!method) {
        return res.status(400).json({ message: 'Método de pago requerido para exceso de peso' });
      }
      payment = new Payment({
        reservation,
        amount: extraCharge,
        method,
        status: 'completed'
      });
      await payment.save();
    }
    res.status(201).json({ baggage, payment });
  } catch (error) {
    console.error('Error al registrar equipaje:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get baggage by reservation (Customer)
router.get('/', authMiddleware(['customer']), async (req, res) => {
  const { reservation } = req.query;

  if (!reservation) {
    return res.status(400).json({ message: 'Se requiere el ID de la reservación' });
  }

  try {
    const baggages = await Baggage.find({ reservation });
    res.json(baggages);
  } catch (error) {
    console.error('Error al buscar equipaje por reservación:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});




// Update baggage status (Employee)
router.put('/:id', authMiddleware(['employee']), async (req, res) => {
  const { status } = req.body;
  try {
    const baggage = await Baggage.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!baggage) return res.status(404).json({ message: 'Baggage not found' });
    res.json(baggage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/baggage/all?email=<email>&reservation=<reservationId>&boardingPass=<boardingPass>
router.get(
  '/all',
  authMiddleware(['employee']), // el usuario debe ser un Employee
  async (req, res) => {
    try {
      // 1) Verificar que el employee tenga rol 'ground'
      const emp = await Employee.findOne({ user: req.user.id });
      if (!emp || emp.role !== 'ground') {
        return res.status(403).json({ message: 'Acceso denegado: solo ground staff' });
      }

      // 2) Obtener filtros del query
      const { email, reservation, boardingPass } = req.query;
      const filter = {};

      if (reservation) {
        filter.reservation = reservation;
      }

      if (boardingPass) {
        filter.boardingPass = { $regex: boardingPass, $options: 'i' }; // búsqueda insensible a mayúsculas
      }

      // 3) Buscar baggages con populate anidado
      let baggages = await Baggage.find(filter)
        .populate({
          path: 'reservation',
          populate: [
            { path: 'flight', model: 'Flight' },
            {
              path: 'customer',
              model: 'Customer',
              populate: {
                path: 'user',
                model: 'User'
              }
            }
          ]
        });

      // 4) Si hay filtro por email, aplicar después del populate
      if (email) {
        baggages = baggages.filter(b =>
          b.reservation?.customer?.user?.email?.toLowerCase().includes(email.toLowerCase())
        );
      }

      res.json(baggages);
    } catch (error) {
      console.error('Error al obtener todos los baggages:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// PUT /api/baggage/:id/status
router.put(
  '/:id/status',
  authMiddleware(['employee']),
  async (req, res) => {
    try {
      const emp = await Employee.findOne({ user: req.user.id });
      if (!emp || emp.role !== 'ground') {
        return res.status(403).json({ message: 'Acceso denegado: solo ground staff' });
      }

      const { id } = req.params;
      const { status } = req.body;
      if (!['checked', 'loaded', 'delivered'].includes(status)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }

      const baggage = await Baggage.findById(id);
      if (!baggage) return res.status(404).json({ message: 'Equipaje no encontrado' });

      baggage.status = status;
      await baggage.save();

      res.json({ message: 'Estado actualizado correctamente', baggage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);


module.exports = router;