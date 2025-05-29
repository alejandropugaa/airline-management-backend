require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const flightRoutes = require('./routes/flightRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const customerRoutes = require('./routes/customerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const baggageRoutes = require('./routes/baggageRoutes');
const usersRoutes = require('./routes/usersRoutes');
const employeeu = require('./routes/usersRoutes');
const customeru = require('./routes/customerRoutes');
const cancel = require('./routes/reservationRoutes');
const dashboard = require('./routes/dashboardRoutes');


const app = express();

// Middleware
app.use(cors({
  origin: ['https://airline-management-frontend.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));




app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/baggage', baggageRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/employee-available', employeeu);
app.use('/api/available-users', customeru);
app.use('/api/:id/cancel', cancel);
app.use('/api/aircrafts', require('./routes/aircraftRoutes'));
app.use('api//occupied/:flightId', require('./routes/reservationRoutes'));
app.use('/api/dashboard', dashboard);




// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));