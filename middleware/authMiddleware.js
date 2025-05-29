const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (roles) => async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('Usuario no encontrado');
    if (!roles.includes(user.role)) throw new Error('Acceso denegado');
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'No autorizado' });
  }
};

module.exports = authMiddleware;