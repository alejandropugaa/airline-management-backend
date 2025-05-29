const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const authMiddleware = require('../middleware/authMiddleware');
const { sendConfirmationEmail } = require('../utils/emailService');
const { sendCancellationEmail } = require('../utils/emailService');
const Payment = require('../models/Payment');
const Flight = require('../models/Flight');
const Customer = require('../models/Customer'); // Asegúrate de importar esto arriba


// Crear reservación (Solo Cliente)
router.post('/', authMiddleware(['customer']), async (req, res) => {
  const { flight, seatNumber, paymentMethod = 'credit_card' } = req.body;

  try {
    // 1. Buscar el cliente
    const customerDoc = await Customer.findOne({ user: req.user._id }).select('frequentFlyer');
    if (!customerDoc) {
      return res.status(404).json({ message: 'Cliente no encontrado para este usuario' });
    }

    // 2. Crear la reservación
    const reservation = new Reservation({
      customer: customerDoc._id,
      flight,
      seatNumber,
    });
    await reservation.save();

    // 3. Obtener el precio del vuelo
    const flightDoc = await require('../models/Flight').findById(flight);
    const originalAmount = flightDoc?.price || 500; // Precio por defecto si no tiene precio

    // 4. Calcular descuento según el nivel de viajero frecuente
    let discount = 0;
    const frequentFlyerStatus = customerDoc.frequentFlyer.status;
    if (frequentFlyerStatus === 'platinum') {
      discount = originalAmount * 0.10; // 10% de descuento
    } else if (frequentFlyerStatus === 'gold') {
      discount = originalAmount * 0.05; // 5% de descuento
    } else if (frequentFlyerStatus === 'silver') {
      discount = originalAmount * 0.02; // 2% de descuento
    }
    const finalAmount = originalAmount - discount;

    // 5. Crear el pago simulado
    const payment = new Payment({
      reservation: reservation._id,
      amount: finalAmount, // Solo guardar el precio final
      method: paymentMethod,
      status: 'completed',
    });
    await payment.save();

    // 6. Actualizar puntos de viajero frecuente
    await updateFrequentFlyerPoints(customerDoc._id, 100);

    // 7. Enviar correo de confirmación
    if (!req.user.email) {
      throw new Error('No se encontró email para el usuario');
    }
    const populatedReservation = await Reservation.findById(reservation._id).populate('flight');
    await sendConfirmationEmail(req.user.email, populatedReservation);


    // 8. Responder con detalles
    res.status(201).json({
      reservation,
      payment: {
        ...payment.toObject(),
        originalAmount, // Incluir precio original para la vista
        discountApplied: discount, // Incluir descuento para la vista
        frequentFlyerStatus, // Incluir nivel para la vista
      },
    });
  } catch (error) {
    console.error('Error al crear reservación o pago:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});


// Cancelar reservación (Solo Cliente)
router.put('/:id/cancel', authMiddleware(['customer']), async (req, res) => {
  try {
    // 1. Buscar la reservación
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservación no encontrada' });

    // 2. Solo quien la creó puede cancelarla
    const customerDoc = await Customer.findOne({ user: req.user._id });
    if (!customerDoc || !reservation.customer.equals(customerDoc._id)) {
      return res.status(403).json({ message: 'No autorizado para cancelar esta reservación' });
    }

    // 3. Actualizar estado de la reservación
    reservation.status = 'cancelled';
    await reservation.save();

    // 3.1. Volver a poblar el vuelo para el correo
    await reservation.populate('flight');
    // 4. Ajustar puntos de viajero frecuente
    await updateFrequentFlyerPoints(reservation.customer, -100);

    // 5. Procesar reembolso simulado
    let refundAmount = 0;
    const payment = await Payment.findOne({ reservation: reservation._id });
    if (payment && payment.status === 'completed') {
      payment.status = 'refunded';
      await payment.save();
      refundAmount = payment.amount;
    }

    // 6. Enviar correo de cancelación
    const email = req.user.email; // o busca el User si no viene en req.user
    await sendCancellationEmail(email, reservation, refundAmount);

    // 7. Responder con detalles
    res.json({ reservation, refundAmount });
  } catch (error) {
    console.error('Error al cancelar reservación:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Nuevo endpoint: Obtener todas las reservaciones del usuario autenticado
router.get('/', authMiddleware(['customer']), async (req, res) => {
  try {

    // Buscar el cliente (Customer) asociado al usuario logueado
    const customer = await Customer.findOne({ user: req.user.id });

    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Buscar reservaciones de ese cliente
    const reservations = await Reservation.find({ customer: customer._id })
  .populate({
    path: 'flight',
    populate: {
      path: 'aircraft',
      model: 'Aircraft'
    }
  })
  .populate('customer');


    res.json(reservations);
  } catch (error) {
    console.error('Error completo al obtener reservaciones:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Obtener asientos ocupados de un vuelo
router.get('/occupied/:flightId', authMiddleware(['admin', 'employee', 'customer']), async (req, res) => {
  try {
    const flightId = req.params.flightId;
    const reservations = await Reservation.find({ 
      flight: flightId,
      status: 'confirmed' // Solo incluir reservaciones activas
    });
    const occupiedSeats = reservations.map(res => res.seatNumber);
    //console.log(`Asientos ocupados para vuelo ${flightId}:`, occupiedSeats); // Depuración
    res.json(occupiedSeats);
  } catch (error) {
    console.error('Error al obtener asientos ocupados:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

async function updateFrequentFlyerPoints(customerId, change) {
  const customer = await Customer.findById(customerId);
  if (!customer) return;

  const newPoints = Math.max(0, customer.frequentFlyer.points + change);
  customer.frequentFlyer.points = newPoints;

  let newStatus = 'none';
  if (newPoints >= 1800) newStatus = 'platinum';
  else if (newPoints >= 1200) newStatus = 'gold';
  else if (newPoints >= 600) newStatus = 'silver';

  customer.frequentFlyer.status = newStatus;

  await customer.save();
}


module.exports = router;