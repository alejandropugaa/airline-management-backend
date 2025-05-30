// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener todos los usuarios (GET /api/users)
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});

// Crear un nuevo usuario (POST /api/users)
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const newUser = new User({ email, password, role });
    await newUser.save();
    res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
});

// Obtener un usuario por ID (GET /api/users/:id)
router.get('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
});

// Actualizar un usuario (PUT /api/users/:id)
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const { email, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { email, role },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
});

// Eliminar un usuario (DELETE /api/users/:id)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
});

// Obtener usuarios con rol 'employee' (Admin)
router.get('/employees/available-users', authMiddleware(['admin']), async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('🔥 Error en /employees/available-users:', err); // 👈
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
});

// Obtener usuarios con rol 'customer' que aún no tienen documento en customers
router.get('/customers/available-users', authMiddleware(['admin']), async (req, res) => {
  try {
    const usedUserIds = await Customer.distinct('user'); // IDs ya usados
    const availableUsers = await User.find({
      role: 'customer',
      _id: { $nin: usedUserIds }
    }).select('-password');

    res.json(availableUsers);
  } catch (err) {
    console.error('🔥 Error en /customers/available-users:', err);
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
});



module.exports = router;
