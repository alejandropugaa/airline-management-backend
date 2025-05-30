const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const { generateCode, storeCode } = require('../utils/verificationStore');
const { sendVerificationCodeEmail } = require('../utils/emailService');
const { isValidCode, deleteCode } = require('../utils/verificationStore');

router.post('/send-verification-code', async (req, res) => {
  const { email } = req.body;

  try {
    const code = generateCode();         
    storeCode(email, code);              
    await sendVerificationCodeEmail(email, code); 
    res.status(200).json({ message: 'Código enviado al correo' });
  } catch (err) {
    console.error(' Error al enviar código:', err);
    res.status(500).json({ message: 'No se pudo enviar el código' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ email, password, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/registercustomer', async (req, res) => {
  const { email, password, passport, code } = req.body;

  try {
    // 1. Verificar código de correo
    if (!isValidCode(email, code)) {
      return res.status(400).json({ message: 'Código de verificación inválido o expirado' });
    }

    // 2. Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El correo ya está registrado' });

    // 3. Crear usuario normalmente
    const newUser = new User({ email, password, role: 'customer' });
    await newUser.save();

    const newCustomer = new Customer({
      user: newUser._id,
      passport,
      contactInfo: { phone: '', address: '' },
      frequentFlyer: { status: 'none', points: 0 },
      preferences: { seatPreference: 'any', mealPreference: 'standard' }
    });
    await newCustomer.save();

    // 4. Eliminar el código ya usado
    deleteCode(email);

    // 5. Generar y enviar token
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error('❌ Error al registrar:', error.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});



router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;
