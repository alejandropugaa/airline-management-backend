const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/profile', authMiddleware(['customer']), async (req, res) => {
  console.log('✅ Solicitud PUT /profile recibida de:', req.user?.email || req.user?.id);
  const { phone, address, seatPreference, mealPreference } = req.body;

  try {
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado' });

    // Actualizar los campos
    customer.contactInfo.phone = phone;
    customer.contactInfo.address = address;
    customer.preferences.seatPreference = seatPreference;
    customer.preferences.mealPreference = mealPreference;

    await customer.save();

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar perfil:', err.message);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});
// Create customer (Customer)
router.post('/', authMiddleware(['customer']), async (req, res) => {
  const { passport, contactInfo, preferences } = req.body;
  try {
    const customer = new Customer({ user: req.user.id, passport, contactInfo, preferences });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Get customer profile (Customer)
router.get('/profile', authMiddleware(['customer']), async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Obtener todos los clientes (admin)
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    // Populamos el campo user solo con el email (excluyendo password)
    const customers = await Customer.find()
      .populate('user', 'email'); // solo email del usuario

    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener los clientes' });
  }
});



router.post('/admin', authMiddleware(['admin']), async (req, res) => {
  const { user, passport, contactInfo, preferences } = req.body;
  try {
    const existing = await Customer.findOne({ user });
    if (existing) return res.status(400).json({ message: 'Este usuario ya es cliente' });

    const customer = new Customer({ user, passport, contactInfo, preferences });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
});

router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
});

router.get('/available-users', authMiddleware(['admin']), async (req, res) => {
  try {
    // Obtener todos los user IDs que ya están en customers
    const customers = await Customer.find({}, 'user');
    const usedUserIds = customers.map(c => c.user.toString());

    // Buscar usuarios con rol 'customer' que no estén en usedUserIds
    const users = await User.find({
      role: 'customer',
      _id: { $nin: usedUserIds }
    }, 'email'); // Solo el email y el _id para el select

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios disponibles' });
  }
});


router.get('/me', authMiddleware(['customer']), async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) {
      console.error('Cliente no encontrado para user.id:', req.user.id);
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    console.log('Cliente encontrado:', customer.frequentFlyer); // Depuración
    res.json({ frequentFlyer: customer.frequentFlyer });
  } catch (error) {
    console.error('Error al obtener datos del cliente:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});


router.get('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('user', 'email');
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el cliente' });
  }
});
module.exports = router;

