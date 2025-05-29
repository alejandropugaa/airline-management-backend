const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Schedule = require('../models/Schedule');
const Payroll = require('../models/Payroll');
const User = require('../models/Flight');

const authMiddleware = require('../middleware/authMiddleware');

// Create employee (Admin)
router.post('/', authMiddleware(['admin']), async (req, res) => {
  const { user, role, schedule } = req.body;
  console.log('Datos recibidos:', { user, role, schedule });

  try {
    const existing = await Employee.findOne({ user });
    if (existing) {
      console.log('Ya existe un empleado con ese usuario');
      return res.status(400).json({ message: 'Este usuario ya está asignado como empleado' });
    }

    const employee = new Employee({ user, role, schedule });
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    console.error('❌ Error al crear empleado:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});


// Obtener todos los turnos (horarios) del empleado autenticado
router.get('/schedule', authMiddleware(['employee']), async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });

    const schedules = await Schedule.find({ employee: employee._id })
      .populate('flight') // ✨ Mostrar detalles del vuelo
      .lean();

    res.json(schedules);
  } catch (error) {
    console.error('Error al obtener los turnos del empleado:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Obtener todos los empleados (para asignar tripulación)
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const employees = await Employee.find().populate('user');
    res.json(employees);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener todos los empleados con datos de usuario
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const employees = await Employee.find().populate('user', '-password');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los empleados' });
  }
});

// Eliminar un empleado
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar empleado:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Actualizar rol de un empleado
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  const { role } = req.body;
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    employee.role = role;
    await employee.save();
    res.json({ message: 'Empleado actualizado correctamente', employee });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Paga según rol
    const rates = {
      pilot: 300,
      crew: 200,
      ground: 180
    };

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

async function generatePayroll(startDate, endDate) {
  // Busca schedules cuyo vuelo (flight) tenga departureTime entre startDate y endDate
  const schedules = await Schedule.find()
    .populate({
      path: 'flight',
      match: {
        departureTime: { $gte: startDate, $lte: endDate }
      }
    })
    .populate('employee');

  // Filtrar schedules que sí tienen vuelo (flight) dentro del rango
  const filteredSchedules = schedules.filter(s => s.flight !== null);

  const payrollMap = new Map();

  for (const schedule of filteredSchedules) {
    const employeeId = schedule.employee._id.toString();
    const role = schedule.employee.role;
    const hourlyRate = rates[role] || 0;

    const hoursWorked = parseTime(schedule.endTime) - parseTime(schedule.startTime);

    if (!payrollMap.has(employeeId)) {
      payrollMap.set(employeeId, { hours: 0, rate: hourlyRate, employee: schedule.employee });
    }

    const entry = payrollMap.get(employeeId);
    entry.hours += hoursWorked;
  }

  const payrollEntries = [];

  for (const [id, data] of payrollMap.entries()) {
    const totalPay = data.hours * data.rate;

    const payroll = new Payroll({
      employee: data.employee._id,
      startDate,
      endDate,
      totalHours: data.hours,
      hourlyRate: data.rate,
      totalPay
    });

    await payroll.save();
    payrollEntries.push(payroll);
  }

  return payrollEntries;
}

router.post('/generate', authMiddleware(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await generatePayroll(start, end);
    res.json({ message: 'Nómina generada', count: result.length, data: result });
  } catch (error) {
    console.error('Error al generar nómina:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.get('/payroll', authMiddleware(['admin']), async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ message: 'Fechas de inicio y fin requeridas' });
  }

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const schedules = await Schedule.find()
      .populate({
        path: 'flight',
        match: {
          departureTime: { $gte: startDate, $lte: endDate }
        }
      })
      .populate({
        path: 'employee',
        populate: { path: 'user' } // para obtener el nombre del usuario
      });

    // Filtra los schedules sin vuelos dentro del intervalo
    const filteredSchedules = schedules.filter(s => s.flight !== null);

    const rates = {
      pilot: 300,
      crew: 150,
      ground: 100
    };

    const payrollMap = new Map();

    for (const sched of filteredSchedules) {
      const emp = sched.employee;
      const empId = emp._id.toString();
      const role = emp.role;
      const rate = rates[role] || 0;

      const departure = new Date(sched.flight.departureTime);
      const arrival = new Date(sched.flight.arrivalTime);
      const diffMs = arrival - departure;
      const hours = diffMs / (1000 * 60 * 60); // convierte a horas

      if (!payrollMap.has(empId)) {
        payrollMap.set(empId, {
          employee: emp.user.email,
          role,
          hours: 0,
          rate,
          totalPay: 0
        });
      }

      const record = payrollMap.get(empId);
      record.hours += hours;
      record.totalPay = record.hours * rate;
    }

    const result = Array.from(payrollMap.values()).map(entry => ({
      ...entry,
      hours: entry.hours.toFixed(2),
      totalPay: entry.totalPay.toFixed(2)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error al calcular nómina:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});




module.exports = router;